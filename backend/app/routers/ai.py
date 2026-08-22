import asyncio
import logging
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_optional_database
from app.services.keras_model import keras_classifier
from app.services.search_engine import dual_check_search_pipeline
from app.services.faiss_rag_service import faiss_rag_service
from app.services.old_man_persona import ELDER_NAME, ELDER_ROLE
from app.services.cost_control_service import (
    answer_query,
    get_orchestrator_metrics,
    clear_query_cache,
    classify_query_complexity
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["ai"])

class OrchestratedQueryRequest(BaseModel):
    query: str = Field(..., description="User query / question")
    user_id: Optional[str] = Field("anonymous_user", description="Identifier of the requesting user")
    rag_threshold: Optional[float] = Field(0.55, description="Similarity threshold for RAG match")
    cache_ttl_seconds: Optional[int] = Field(3600, description="In-memory cache TTL in seconds")

class ChatRequest(BaseModel):
    prompt: str
    category: Optional[str] = "General"
    local_context: Optional[Dict[str, Any]] = None

class StreamChatRequest(BaseModel):
    prompt: str
    options: Optional[Dict[str, Any]] = None

class ClassifyRequest(BaseModel):
    prompt: str

class TrainKnowledgeRequest(BaseModel):
    title: str
    content: str
    category: Optional[str] = "General"
    solution: Optional[str] = None
    why_it_works: Optional[str] = None
    gotchas: Optional[str] = None
    takeaway: Optional[str] = None
    keywords: Optional[List[str]] = None

@router.get("/api/health")
@router.get("/health/ai")
def ai_health_check():
    faiss_stats = faiss_rag_service.get_stats()
    return {
        "status": "online",
        "keras_model": "loaded",
        "faiss_engine": faiss_stats["engine"],
        "faiss_vectors": faiss_stats["faiss_total_vectors"],
        "embedding_model": faiss_stats["embedding_model"],
        "dual_search": "active",
        "engine": "FastAPI + FAISS IndexFlatIP (384d MiniLM) + MongoDB + Keras 3 + Google Web Search",
        "persona": f"{ELDER_NAME} ({ELDER_ROLE})"
    }

@router.get("/api/ai/faiss/stats")
def get_faiss_stats():
    """Returns statistics for FAISS IndexFlatIP (384d MiniLM) RAG store."""
    return faiss_rag_service.get_stats()

@router.post("/api/ai/train")
async def train_knowledge(req: TrainKnowledgeRequest):
    """Dynamically trains/indexes new verified knowledge into FAISS MiniLM vector index."""
    title = req.title.strip()
    content = req.content.strip()
    if not title or not content:
        raise HTTPException(status_code=400, detail="Title and content are required.")

    meta = await faiss_rag_service.add_knowledge(
        title=title,
        content=content,
        category=req.category or "General",
        keywords=req.keywords or [],
        solution=req.solution,
        why_it_works=req.why_it_works,
        gotchas=req.gotchas,
        takeaway=req.takeaway,
        source="User Trained Knowledge"
    )
    return {
        "status": "success",
        "message": f"Successfully indexed '{title}' into FAISS MiniLM RAG index.",
        "entry": meta,
        "total_vectors": faiss_rag_service.count()
    }

@router.post("/api/classify")
def classify_prompt(req: ClassifyRequest):
    """Endpoint for classifying user prompts with Keras deep learning model."""
    result = keras_classifier.classify_and_vectorize(req.prompt)
    return result

@router.post("/api/chat")
async def process_chat(
    req: ChatRequest,
    db: Optional[AsyncIOMotorDatabase] = Depends(get_optional_database)
):
    """
    Dual-Check AI Pipeline Endpoint with FAISS RAG & Professional Old Person Persona:
    1. Runs Keras Neural Intent Classification.
    2. Executes Concurrent Search: FAISS MiniLM RAG (384d) + MongoDB Database + Live Google Web Search.
    3. Synthesizes a polite, solution-first response formatted as Sardar Genji (Setu Avatar).
    """
    prompt = req.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    # 1. Keras Classification & Semantic Vector Analysis
    keras_info = keras_classifier.classify_and_vectorize(prompt)
    detected_category = keras_info.get("category", req.category or "General")

    # 2. Dual Search Pipeline: FAISS MiniLM RAG + MongoDB Database + Google Live Web Search
    dual_res = await dual_check_search_pipeline(
        db=db,
        query=prompt,
        local_context=req.local_context,
        category=detected_category
    )

    response_text = dual_res.get("response", "")
    database_matches = dual_res.get("database_matches", [])
    google_matches = dual_res.get("google_matches", [])
    sources = dual_res.get("sources", [])

    return {
        "response": response_text,
        "query": prompt,
        "category": detected_category,
        "source": "Dual Search (FAISS MiniLM RAG + Google Web)",
        "sources": sources,
        "database_matches": database_matches,
        "faiss_matches": database_matches,
        "google_matches": google_matches,
        "database_match": dual_res.get("database_match", {"found": len(database_matches) > 0}),
        "google_match": dual_res.get("google_match", {"found": len(google_matches) > 0}),
        "local_match": dual_res.get("local_match", {"found": len(database_matches) > 0}),
        "persona": dual_res.get("persona", f"{ELDER_NAME} ({ELDER_ROLE})"),
        "faiss_engine": dual_res.get("faiss_engine", "FAISS IndexFlatIP (384d MiniLM)"),
        "keras_metadata": {
            "category": detected_category,
            "confidence": keras_info.get("confidence", 0.85),
            "vector_norm": keras_info.get("vector_norm", 1.0)
        }
    }

@router.post("/api/chat/stream")
async def process_chat_stream(
    req: StreamChatRequest,
    db: Optional[AsyncIOMotorDatabase] = Depends(get_optional_database)
):
    """
    Streaming AI Pipeline Endpoint using FAISS MiniLM RAG + Google Search.
    """
    prompt = req.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    keras_info = keras_classifier.classify_and_vectorize(prompt)
    detected_category = keras_info.get("category", "General")

    dual_res = await dual_check_search_pipeline(
        db=db,
        query=prompt,
        category=detected_category
    )
    response_text = dual_res.get("response", f"Verified knowledge response for '{prompt}'.")

    async def stream_generator():
        words = response_text.split(" ")
        for i, word in enumerate(words):
            suffix = " " if i < len(words) - 1 else ""
            yield f"{word}{suffix}"
            await asyncio.sleep(0.02)

    return StreamingResponse(stream_generator(), media_type="text/plain")

@router.post("/api/ai/query")
async def execute_orchestrated_query(req: OrchestratedQueryRequest):
    """
    Cost-Controlled 3-Tier AI Orchestrator Endpoint:
    Decision Tree: Cache -> FAISS MiniLM RAG -> Escalated OpenRouter AI.
    """
    result = await answer_query(
        user_id=req.user_id or "anonymous_user",
        query=req.query,
        rag_threshold=req.rag_threshold if req.rag_threshold is not None else 0.55,
        cache_ttl_seconds=req.cache_ttl_seconds if req.cache_ttl_seconds is not None else 3600
    )
    return result

@router.get("/api/ai/metrics")
def get_ai_cost_and_traffic_metrics():
    """
    Returns AI cost control metrics:
    - Cache hit percentage
    - RAG hit percentage
    - AI escalation percentage
    - Total token consumption and estimated cost in INR
    """
    return get_orchestrator_metrics()

@router.post("/api/ai/cache/clear")
def clear_ai_query_cache():
    """Clears the AI query in-memory TTL cache."""
    clear_query_cache()
    return {"status": "success", "message": "In-memory AI query cache cleared."}


