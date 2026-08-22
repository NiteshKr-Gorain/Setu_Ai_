"""
AI Cost Control, Budget Protection & Usage Tracking Service for SETU.
Implements:
  1. Named budget protection constants (₹1500 target monthly budget).
  2. MongoDB collection `ai_usage_log` with token, cost, and timestamp tracking.
  3. Pre-call budget guard (<80% normal, 80-100% warning, >100% fallback degradation).
  4. Per-user daily AI quotas to prevent single-user budget exhaustion.
  5. 3-tier decision tree (Cache -> FAISS MiniLM RAG -> Escalated OpenRouter AI).
  6. Admin telemetry and cost accounting metrics.
"""
import os
import re
import time
import hashlib
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config import settings
from app.services.faiss_rag_service import faiss_rag_service
from app.services.openrouter_client import (
    call_openrouter,
    get_model_for_tier,
    OpenRouterException,
    MODEL_TIERS
)

logger = logging.getLogger(__name__)

# =========================================================================
# BUDGET PROTECTION & COST CONTROL CONFIGURATION (TUNABLE CONSTANTS)
# =========================================================================
MONTHLY_BUDGET_INR: float = 1500.0              # Target monthly AI budget in INR (≤ ₹1500)
BUDGET_WARNING_THRESHOLD_PCT: float = 0.80      # 80% (₹1200) -> Log warning flag
BUDGET_EXCEEDED_THRESHOLD_PCT: float = 1.00     # 100% (₹1500) -> Block reasoning tier, degrade to fallback

# Per-User Daily AI Request Quota (Prevents single user from exhausting budget)
USER_DAILY_REQUEST_LIMIT: int = 30              # Max AI queries per user per calendar day (UTC)

# Cache & RAG Default Parameters
DEFAULT_CACHE_TTL_SECONDS: int = 3600           # 1 hour in-memory cache TTL
DEFAULT_RAG_SIMILARITY_THRESHOLD: float = 0.55  # Minimum FAISS vector similarity score

# OpenRouter Model Pricing in INR per 1,000 tokens (1 USD ≈ 86 INR)
# TODO: Update with exact numbers from OpenRouter's pricing page (https://openrouter.ai/models)
MODEL_PRICING: Dict[str, Dict[str, float]] = {
    "openai/gpt-4o-mini": {
        "prompt_per_1k_inr": 0.0129,       # TODO: Update exact OpenRouter prompt token price
        "completion_per_1k_inr": 0.0516,   # TODO: Update exact OpenRouter completion token price
    },
    "anthropic/claude-sonnet-4": {
        "prompt_per_1k_inr": 0.2580,       # TODO: Update exact OpenRouter prompt token price
        "completion_per_1k_inr": 1.2900,   # TODO: Update exact OpenRouter completion token price
    },
    "meta-llama/llama-3.1-8b-instruct": {
        "prompt_per_1k_inr": 0.0050,       # TODO: Update exact OpenRouter prompt token price
        "completion_per_1k_inr": 0.0200,   # TODO: Update exact OpenRouter completion token price
    }
}

# Multi-step and analytical reasoning trigger keywords for model tier selection
REASONING_KEYWORDS = {
    "why",
    "how does",
    "how do",
    "compare",
    "difference between",
    "explain scientifically",
    "step by step",
    "mechanism",
    "biochemical",
    "molecular",
    "analyze",
    "evaluate",
    "root cause",
    "contraindication",
    "drug interaction",
    "pros and cons",
    "versus",
    "vs",
    "deep dive",
    "clinical",
    "scientific reason"
}

class UserQuotaExceededError(Exception):
    """Raised when a user exceeds their daily AI query quota."""
    pass

# In-Memory Cache Store: normalized_hash -> cache_entry_dict
_QUERY_CACHE: Dict[str, Dict[str, Any]] = {}

# Global Metrics Counter for Cost & AI Traffic Auditing
_METRICS: Dict[str, Any] = {
    "total_queries": 0,
    "cache_hits": 0,
    "rag_hits": 0,
    "ai_calls": 0,
    "ai_tiers": {
        "simple": 0,
        "reasoning": 0,
        "fallback": 0
    },
    "tokens_consumed": {
        "prompt_tokens": 0,
        "completion_tokens": 0,
        "total_tokens": 0
    },
    "estimated_cost_inr": 0.0,
    "user_daily_counts": {}
}

def normalize_query_text(query: str) -> str:
    """Normalizes query text by lowercasing, stripping punctuation, and collapsing whitespace."""
    if not query:
        return ""
    q = query.lower().strip()
    q = re.sub(r'[^\w\s]', '', q)
    q = re.sub(r'\s+', ' ', q)
    return q.strip()

def get_query_cache_key(query: str) -> str:
    """Generates a deterministic SHA-256 hash key for a normalized query string."""
    normalized = normalize_query_text(query)
    return hashlib.sha256(normalized.encode('utf-8')).hexdigest()

def get_cached_query(query: str) -> Optional[Dict[str, Any]]:
    """Retrieves cached query result if available and not expired."""
    key = get_query_cache_key(query)
    entry = _QUERY_CACHE.get(key)
    if not entry:
        return None

    now = time.time()
    if now > entry.get("expires_at", 0):
        _QUERY_CACHE.pop(key, None)
        return None

    return entry

def set_cached_query(query: str, data: Dict[str, Any], ttl_seconds: int = DEFAULT_CACHE_TTL_SECONDS) -> None:
    """Stores query result in the in-memory cache with specified TTL."""
    key = get_query_cache_key(query)
    now = time.time()
    _QUERY_CACHE[key] = {
        **data,
        "cached_at": now,
        "expires_at": now + ttl_seconds
    }

def clear_query_cache() -> None:
    """Clears the entire in-memory query cache."""
    _QUERY_CACHE.clear()

def classify_query_complexity(query: str) -> str:
    """
    Tunable heuristic function to determine if a query requires the 'reasoning' model tier
    or can be fulfilled by the cheap 'simple' tier.
    """
    clean = normalize_query_text(query)
    words = clean.split()

    for kw in REASONING_KEYWORDS:
        if kw in clean:
            return "reasoning"

    if len(words) > 25 or len(clean) > 150:
        return "reasoning"

    return "simple"

def estimate_cost_inr(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    """
    Calculates approximate INR cost for an OpenRouter completion based on MODEL_PRICING.
    """
    pricing = MODEL_PRICING.get(model, MODEL_PRICING["openai/gpt-4o-mini"])
    prompt_cost = (prompt_tokens / 1000.0) * pricing["prompt_per_1k_inr"]
    comp_cost = (completion_tokens / 1000.0) * pricing["completion_per_1k_inr"]
    return round(prompt_cost + comp_cost, 4)

async def record_ai_usage(
    user_id: str,
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
    total_tokens: int,
    estimated_cost_inr: float,
    budget_status: str = "normal",
    requested_tier: str = "simple",
    executed_tier: str = "simple",
    db: Optional[AsyncIOMotorDatabase] = None
) -> Dict[str, Any]:
    """
    Records an OpenRouter call document into the MongoDB collection 'ai_usage_log'.
    """
    now = datetime.now(timezone.utc)
    month_str = now.strftime("%Y-%m")
    day_str = now.strftime("%Y-%m-%d")

    doc = {
        "user_id": str(user_id),
        "model": str(model),
        "prompt_tokens": int(prompt_tokens),
        "completion_tokens": int(completion_tokens),
        "total_tokens": int(total_tokens),
        "estimated_cost_inr": float(estimated_cost_inr),
        "timestamp": now,
        "month": month_str,
        "day": day_str,
        "budget_status": budget_status,
        "requested_tier": requested_tier,
        "executed_tier": executed_tier
    }

    # Record in MongoDB if available
    if db is not None:
        try:
            await db["ai_usage_log"].insert_one(doc)
        except Exception as e:
            logger.error(f"Failed to persist AI usage record to MongoDB ({e}).")

    # Update in-memory metrics & user daily tracking
    _METRICS["tokens_consumed"]["prompt_tokens"] += prompt_tokens
    _METRICS["tokens_consumed"]["completion_tokens"] += completion_tokens
    _METRICS["tokens_consumed"]["total_tokens"] += total_tokens
    _METRICS["estimated_cost_inr"] = round(_METRICS["estimated_cost_inr"] + estimated_cost_inr, 4)
    _METRICS["ai_tiers"][executed_tier] = _METRICS["ai_tiers"].get(executed_tier, 0) + 1

    daily_key = f"{user_id}:{day_str}"
    user_daily_map = _METRICS.setdefault("user_daily_counts", {})
    user_daily_map[daily_key] = user_daily_map.get(daily_key, 0) + 1

    return doc

async def get_monthly_spend(
    db: Optional[AsyncIOMotorDatabase] = None,
    month: Optional[str] = None
) -> float:
    """
    Sums estimated_cost_inr for the current (or given 'YYYY-MM') month from MongoDB ai_usage_log.
    Falls back to in-memory metrics when db is not provided or offline.
    """
    target_month = month or datetime.now(timezone.utc).strftime("%Y-%m")
    
    if db is not None:
        try:
            pipeline = [
                {"$match": {"month": target_month}},
                {"$group": {"_id": None, "total_spend": {"$sum": "$estimated_cost_inr"}}}
            ]
            cursor = db["ai_usage_log"].aggregate(pipeline)
            docs = await cursor.to_list(length=1)
            if docs:
                return round(float(docs[0].get("total_spend", 0.0)), 4)
            return 0.0
        except Exception as e:
            logger.warning(f"Failed to query MongoDB ai_usage_log monthly spend ({e}). Falling back to in-memory.")

    return round(_METRICS["estimated_cost_inr"], 4)

async def check_user_daily_quota(
    user_id: str,
    db: Optional[AsyncIOMotorDatabase] = None,
    daily_limit: int = USER_DAILY_REQUEST_LIMIT
) -> Tuple[bool, int]:
    """
    Checks whether a user has exceeded their daily AI request quota for today (UTC).
    Returns (is_allowed, today_usage_count).
    """
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    if db is not None:
        try:
            count = await db["ai_usage_log"].count_documents({
                "user_id": str(user_id),
                "day": today_str
            })
            return (count < daily_limit, count)
        except Exception as e:
            logger.warning(f"Error querying daily quota from MongoDB ({e}). Falling back to in-memory quota tracking.")
            
    # In-memory fallback
    user_daily_counts = _METRICS.setdefault("user_daily_counts", {})
    count = user_daily_counts.get(f"{user_id}:{today_str}", 0)
    return (count < daily_limit, count)

async def check_budget_and_resolve_tier(
    user_id: str,
    requested_tier: str,
    db: Optional[AsyncIOMotorDatabase] = None
) -> Tuple[str, str, Dict[str, Any]]:
    """
    Evaluates monthly spend against the ₹1500 target budget and resolves the execution tier:
      - Spend < 80% (₹1200): Proceed normally ("normal")
      - 80% <= Spend < 100% (₹1200 - ₹1500): Proceed normally, log "warning" flag
      - Spend >= 100% (₹1500): Block "reasoning" tier, degrade to "fallback" tier, log "budget_exceeded" flag
      
    Returns:
        (effective_tier, budget_status, budget_metadata)
    """
    current_spend = await get_monthly_spend(db=db)
    warning_threshold = MONTHLY_BUDGET_INR * BUDGET_WARNING_THRESHOLD_PCT   # ₹1200
    exceeded_threshold = MONTHLY_BUDGET_INR * BUDGET_EXCEEDED_THRESHOLD_PCT # ₹1500
    
    budget_metadata = {
        "monthly_budget_inr": MONTHLY_BUDGET_INR,
        "current_spend_inr": current_spend,
        "remaining_budget_inr": max(0.0, round(MONTHLY_BUDGET_INR - current_spend, 2)),
        "utilization_pct": round((current_spend / MONTHLY_BUDGET_INR) * 100.0, 2) if MONTHLY_BUDGET_INR > 0 else 0.0
    }
    
    if current_spend >= exceeded_threshold:
        logger.warning(
            f"Budget exceeded ({current_spend:.2f} INR >= {exceeded_threshold:.2f} INR). "
            f"Degrading requested '{requested_tier}' tier to 'fallback' tier."
        )
        return "fallback", "budget_exceeded", budget_metadata
        
    if current_spend >= warning_threshold:
        logger.warning(
            f"Budget warning ({current_spend:.2f} INR >= {warning_threshold:.2f} INR). "
            f"Approaching monthly budget threshold ({budget_metadata['utilization_pct']}% utilized)."
        )
        return requested_tier, "warning", budget_metadata
        
    return requested_tier, "normal", budget_metadata

def get_orchestrator_metrics() -> Dict[str, Any]:
    """Returns aggregated traffic percentages, cache hit rates, and cost telemetry."""
    total = _METRICS["total_queries"]
    cache_hits = _METRICS["cache_hits"]
    rag_hits = _METRICS["rag_hits"]
    ai_calls = _METRICS["ai_calls"]

    cache_pct = round((cache_hits / total * 100.0), 2) if total > 0 else 0.0
    rag_pct = round((rag_hits / total * 100.0), 2) if total > 0 else 0.0
    ai_pct = round((ai_calls / total * 100.0), 2) if total > 0 else 0.0

    return {
        "total_queries": total,
        "cache_hits": cache_hits,
        "cache_hit_percentage": cache_pct,
        "rag_hits": rag_hits,
        "rag_hit_percentage": rag_pct,
        "ai_calls": ai_calls,
        "ai_call_percentage": ai_pct,
        "ai_tiers": dict(_METRICS["ai_tiers"]),
        "tokens_consumed": dict(_METRICS["tokens_consumed"]),
        "estimated_cost_inr": round(_METRICS["estimated_cost_inr"], 4),
        "cached_entries_count": len(_QUERY_CACHE)
    }

async def get_admin_usage_summary(
    db: Optional[AsyncIOMotorDatabase] = None,
    month: Optional[str] = None
) -> Dict[str, Any]:
    """
    Compiles comprehensive admin telemetry for GET /api/admin/ai-usage:
    - Current month spend and remaining budget
    - Request count by model
    - Cache hit rate vs. AI call rate vs. RAG hit rate
    """
    target_month = month or datetime.now(timezone.utc).strftime("%Y-%m")
    current_spend = await get_monthly_spend(db=db, month=target_month)
    
    model_counts: Dict[str, int] = {}
    if db is not None:
        try:
            pipeline = [
                {"$match": {"month": target_month}},
                {"$group": {"_id": "$model", "count": {"$sum": 1}}}
            ]
            cursor = db["ai_usage_log"].aggregate(pipeline)
            docs = await cursor.to_list(length=100)
            for d in docs:
                model_name = d.get("_id") or "unknown"
                model_counts[model_name] = d.get("count", 0)
        except Exception as e:
            logger.warning(f"Could not aggregate model counts from MongoDB ({e}).")
            
    if not model_counts:
        model_counts = {
            MODEL_TIERS["simple"]: _METRICS["ai_tiers"].get("simple", 0),
            MODEL_TIERS["reasoning"]: _METRICS["ai_tiers"].get("reasoning", 0),
            MODEL_TIERS["fallback"]: _METRICS["ai_tiers"].get("fallback", 0)
        }
        
    status = "normal"
    if current_spend >= MONTHLY_BUDGET_INR * BUDGET_EXCEEDED_THRESHOLD_PCT:
        status = "budget_exceeded"
    elif current_spend >= MONTHLY_BUDGET_INR * BUDGET_WARNING_THRESHOLD_PCT:
        status = "warning"

    recent_calls: List[Dict[str, Any]] = []
    if db is not None:
        try:
            cursor_recent = db["ai_usage_log"].find().sort("timestamp", -1).limit(25)
            raw_calls = await cursor_recent.to_list(length=25)
            for call in raw_calls:
                ts = call.get("timestamp")
                ts_iso = ts.isoformat() if hasattr(ts, "isoformat") else str(ts)
                recent_calls.append({
                    "id": str(call.get("_id", "")),
                    "user_id": call.get("user_id", "anonymous"),
                    "model": call.get("model", "unknown"),
                    "prompt_tokens": int(call.get("prompt_tokens", 0)),
                    "completion_tokens": int(call.get("completion_tokens", 0)),
                    "total_tokens": int(call.get("total_tokens", 0)),
                    "estimated_cost_inr": float(call.get("estimated_cost_inr", 0.0)),
                    "timestamp": ts_iso,
                    "budget_status": call.get("budget_status", "normal"),
                    "executed_tier": call.get("executed_tier", "simple")
                })
        except Exception as e:
            logger.warning(f"Could not retrieve recent calls from MongoDB ({e}).")

    telemetry = get_orchestrator_metrics()

    return {
        "month": target_month,
        "monthly_budget_inr": MONTHLY_BUDGET_INR,
        "current_month_spend_inr": current_spend,
        "remaining_budget_inr": max(0.0, round(MONTHLY_BUDGET_INR - current_spend, 2)),
        "budget_utilization_pct": round((current_spend / MONTHLY_BUDGET_INR) * 100.0, 2) if MONTHLY_BUDGET_INR > 0 else 0.0,
        "budget_status": status,
        "request_count_by_model": model_counts,
        "user_daily_request_limit": USER_DAILY_REQUEST_LIMIT,
        "telemetry": telemetry,
        "recent_calls": recent_calls
    }

def reset_orchestrator_metrics() -> None:
    """Resets global orchestrator metric counters (for testing and fresh periods)."""
    _METRICS["total_queries"] = 0
    _METRICS["cache_hits"] = 0
    _METRICS["rag_hits"] = 0
    _METRICS["ai_calls"] = 0
    _METRICS["ai_tiers"] = {"simple": 0, "reasoning": 0, "fallback": 0}
    _METRICS["tokens_consumed"] = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
    _METRICS["estimated_cost_inr"] = 0.0
    _METRICS["user_daily_counts"] = {}

async def answer_query(
    user_id: str,
    query: str,
    db: Optional[AsyncIOMotorDatabase] = None,
    rag_threshold: float = DEFAULT_RAG_SIMILARITY_THRESHOLD,
    cache_ttl_seconds: int = DEFAULT_CACHE_TTL_SECONDS
) -> Dict[str, Any]:
    """
    Central AI Request Orchestrator with Budget-Protection & Quota Enforcement:
      1. Check in-memory TTL cache -> Return cached response if hit (0 tokens).
      2. Run FAISS MiniLM RAG similarity search -> If score >= threshold, return grounded response.
      3. Budget Guard & User Quota Check:
         - Verify user daily quota (< USER_DAILY_REQUEST_LIMIT)
         - Evaluate monthly spend against ₹1500 budget (warning at 80%, degrade to fallback at 100%)
      4. Escalate to OpenRouter AI with resolved model tier.
      5. Persist usage in MongoDB 'ai_usage_log' and in-memory cache with TTL.
    """
    start_time = time.time()
    steps_log: List[Dict[str, Any]] = []
    _METRICS["total_queries"] += 1

    clean_query = query.strip()
    if not clean_query:
        return {
            "answer": "Please provide a question or topic to search.",
            "source": "cache",
            "model_used": None,
            "model_tier": None,
            "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
            "rag_grounded": False,
            "citations": [],
            "budget_status": "normal",
            "steps_log": [{"step": "validation", "status": "empty_query"}],
            "execution_time_ms": 0.0
        }

    # =========================================================================
    # STEP 1: Check In-Memory TTL Cache
    # =========================================================================
    cached_result = get_cached_query(clean_query)
    if cached_result:
        _METRICS["cache_hits"] += 1
        steps_log.append({
            "step": "cache_check",
            "status": "hit",
            "cached_at": cached_result.get("cached_at"),
            "expires_at": cached_result.get("expires_at"),
            "details": "Returned existing grounded answer directly from in-memory cache."
        })
        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "answer": cached_result["answer"],
            "source": "cache",
            "model_used": cached_result.get("model_used"),
            "model_tier": cached_result.get("model_tier"),
            "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
            "rag_grounded": cached_result.get("rag_grounded", False),
            "citations": cached_result.get("citations", []),
            "budget_status": "normal",
            "steps_log": steps_log,
            "execution_time_ms": elapsed_ms
        }

    steps_log.append({
        "step": "cache_check",
        "status": "miss",
        "details": "No valid cache entry found. Proceeding to FAISS vector search."
    })

    # =========================================================================
    # STEP 2: Database / RAG Search via FAISS Vector Store (all-MiniLM-L6-v2)
    # =========================================================================
    rag_matches = await faiss_rag_service.hybrid_search(
        query=clean_query,
        top_k=3,
        min_score=rag_threshold
    )

    if rag_matches:
        top_match = rag_matches[0]
        top_score = top_match.get("score", 0.0)
        _METRICS["rag_hits"] += 1

        steps_log.append({
            "step": "rag_search",
            "status": "hit",
            "score": top_score,
            "matches_count": len(rag_matches),
            "top_match_title": top_match.get("title"),
            "details": f"Found {len(rag_matches)} verified traditional knowledge match(es) with top score {top_score}."
        })

        citations = [
            {
                "id": m.get("id"),
                "title": m.get("title"),
                "category": m.get("category"),
                "source": m.get("source", "Setu Verified Knowledge Vault"),
                "score": m.get("score")
            }
            for m in rag_matches
        ]

        # High confidence match (score >= 0.70) -> format directly with zero LLM tokens!
        if top_score >= 0.70:
            formatted_answer = (
                f"🌿 **{top_match.get('title')}**\n\n"
                f"**Traditional Remedy / Solution:**\n{top_match.get('solution', top_match.get('content'))}\n\n"
                f"🔬 **Why it Works (Scientific Principle):**\n{top_match.get('why_it_works', 'Grounding in traditional practice.')}\n\n"
                f"💡 **Key Takeaway:** {top_match.get('takeaway', 'Follow elder guidance.')}\n"
                f"*(Source: {top_match.get('source', 'Setu Ancestral Knowledge Vault')})*"
            )
            usage = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
            model_used = None
            model_tier = None
        else:
            # Moderate confidence -> use cheap "simple" tier model to phrase facts cleanly
            model_slug = get_model_for_tier("simple")
            context_blocks = "\n\n".join([
                f"Source [{i+1}]: {m.get('title')}\nContent: {m.get('content')}\nSolution: {m.get('solution')}"
                for i, m in enumerate(rag_matches)
            ])
            rag_prompt = (
                f"You are SETU's traditional wisdom guide. Answer the user's question accurately using ONLY "
                f"the retrieved traditional knowledge sources below. Keep your response concise and structured.\n\n"
                f"RETRIEVED KNOWLEDGE CONTEXT:\n{context_blocks}\n\n"
                f"USER QUESTION: {clean_query}"
            )
            messages = [
                {"role": "system", "content": "You are a helpful traditional wisdom assistant. Ground your response in the provided context."},
                {"role": "user", "content": rag_prompt}
            ]

            try:
                formatted_answer, usage = await call_openrouter(
                    messages=messages,
                    model=model_slug,
                    max_tokens=400,
                    temperature=0.2
                )
                model_used = model_slug
                model_tier = "simple"
                cost = estimate_cost_inr(model_slug, usage["prompt_tokens"], usage["completion_tokens"])
                await record_ai_usage(
                    user_id=user_id,
                    model=model_slug,
                    prompt_tokens=usage["prompt_tokens"],
                    completion_tokens=usage["completion_tokens"],
                    total_tokens=usage["total_tokens"],
                    estimated_cost_inr=cost,
                    budget_status="normal",
                    requested_tier="simple",
                    executed_tier="simple",
                    db=db
                )
            except OpenRouterException as oe:
                logger.warning(f"RAG phrasing via OpenRouter failed ({oe}); falling back to direct match.")
                formatted_answer = top_match.get("content", top_match.get("solution", ""))
                usage = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
                model_used = None
                model_tier = None

        cache_payload = {
            "answer": formatted_answer,
            "source": "rag",
            "model_used": model_used,
            "model_tier": model_tier,
            "rag_grounded": True,
            "citations": citations
        }
        set_cached_query(clean_query, cache_payload, ttl_seconds=cache_ttl_seconds)

        steps_log.append({
            "step": "cache_store",
            "status": "success",
            "ttl_seconds": cache_ttl_seconds,
            "details": "RAG grounded answer cached for subsequent queries."
        })

        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "answer": formatted_answer,
            "source": "rag",
            "model_used": model_used,
            "model_tier": model_tier,
            "usage": usage,
            "rag_grounded": True,
            "citations": citations,
            "budget_status": "normal",
            "steps_log": steps_log,
            "execution_time_ms": elapsed_ms
        }

    steps_log.append({
        "step": "rag_search",
        "status": "miss",
        "details": f"No vector match found exceeding threshold ({rag_threshold}). Proceeding to Budget Guard & AI layer."
    })

    # =========================================================================
    # STEP 3: User Quota Check & Budget Guard
    # =========================================================================
    is_quota_ok, user_today_count = await check_user_daily_quota(user_id=user_id, db=db)
    if not is_quota_ok:
        steps_log.append({
            "step": "quota_check",
            "status": "quota_exceeded",
            "daily_requests": user_today_count,
            "limit": USER_DAILY_REQUEST_LIMIT
        })
        return {
            "answer": (
                "⚠️ **Daily AI Request Limit Reached**\n\n"
                f"You have reached your daily quota of {USER_DAILY_REQUEST_LIMIT} AI generations for today. "
                "You can continue browsing existing verified community articles, oral archives, and traditional remedies freely!"
            ),
            "source": "quota_limit",
            "model_used": None,
            "model_tier": None,
            "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
            "rag_grounded": False,
            "citations": [],
            "budget_status": "quota_exceeded",
            "steps_log": steps_log,
            "execution_time_ms": round((time.time() - start_time) * 1000, 2)
        }

    # Complexity classification
    requested_tier = classify_query_complexity(clean_query)
    
    # Budget Guard resolution
    effective_tier, budget_status, budget_meta = await check_budget_and_resolve_tier(
        user_id=user_id,
        requested_tier=requested_tier,
        db=db
    )
    
    model_slug = get_model_for_tier(effective_tier)
    _METRICS["ai_calls"] += 1

    steps_log.append({
        "step": "budget_guard",
        "budget_status": budget_status,
        "requested_tier": requested_tier,
        "effective_tier": effective_tier,
        "selected_model": model_slug,
        "monthly_spend_inr": budget_meta["current_spend_inr"],
        "utilization_pct": budget_meta["utilization_pct"],
        "details": f"Budget status is '{budget_status}'. Executing with '{effective_tier}' tier."
    })

    system_instruction = (
        "You are SETU AI, a cultural and traditional wisdom assistant bridging elder knowledge and modern youth. "
        "Provide factual, respectful, and well-structured guidance on Indian heritage, Ayurveda, sustainable farming, "
        "and traditional craftsmanship. If scientific rationale is requested, explain the underlying mechanism clearly."
    )

    messages = [
        {"role": "system", "content": system_instruction},
        {"role": "user", "content": clean_query}
    ]

    try:
        answer_text, usage = await call_openrouter(
            messages=messages,
            model=model_slug,
            max_tokens=600,
            temperature=0.3
        )
    except OpenRouterException as err:
        logger.error(f"OpenRouter primary call failed: {err}. Attempting fallback tier.")
        steps_log.append({
            "step": "ai_call_error",
            "error": str(err),
            "details": "Primary model failed. Attempting fallback tier."
        })
        fallback_model = get_model_for_tier("fallback")
        answer_text, usage = await call_openrouter(
            messages=messages,
            model=fallback_model,
            max_tokens=400,
            temperature=0.3
        )
        model_slug = fallback_model
        effective_tier = "fallback"

    cost = estimate_cost_inr(model_slug, usage["prompt_tokens"], usage["completion_tokens"])
    
    # Record usage in MongoDB and metrics
    await record_ai_usage(
        user_id=user_id,
        model=model_slug,
        prompt_tokens=usage["prompt_tokens"],
        completion_tokens=usage["completion_tokens"],
        total_tokens=usage["total_tokens"],
        estimated_cost_inr=cost,
        budget_status=budget_status,
        requested_tier=requested_tier,
        executed_tier=effective_tier,
        db=db
    )

    steps_log.append({
        "step": "ai_call",
        "tier": effective_tier,
        "model_used": model_slug,
        "tokens": usage,
        "cost_inr": cost,
        "details": "Generated fresh answer via OpenRouter."
    })

    # Store in in-memory cache
    cache_payload = {
        "answer": answer_text,
        "source": "ai",
        "model_used": model_slug,
        "model_tier": effective_tier,
        "rag_grounded": False,
        "citations": []
    }
    set_cached_query(clean_query, cache_payload, ttl_seconds=cache_ttl_seconds)

    steps_log.append({
        "step": "cache_store",
        "status": "success",
        "ttl_seconds": cache_ttl_seconds,
        "details": "Answer saved to cache for 1 hour."
    })

    elapsed_ms = round((time.time() - start_time) * 1000, 2)
    return {
        "answer": answer_text,
        "source": "ai",
        "model_used": model_slug,
        "model_tier": effective_tier,
        "usage": usage,
        "rag_grounded": False,
        "citations": [],
        "budget_status": budget_status,
        "steps_log": steps_log,
        "execution_time_ms": elapsed_ms
    }
