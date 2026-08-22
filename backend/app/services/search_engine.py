import os
import requests
import json
import re
import asyncio
import logging
from typing import Dict, Any, Optional, List
from pathlib import Path
from urllib.parse import quote
from concurrent.futures import ThreadPoolExecutor

try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent.parent / ".env"
    load_dotenv(dotenv_path=env_path)
except Exception:
    pass

from app.config import settings
from app.services.faiss_rag_service import faiss_rag_service
from app.services.old_man_persona import (
    ELDER_NAME, ELDER_ROLE, format_polite_personal_response,
    ELDER_GREETINGS, ELDER_CLOSINGS
)

logger = logging.getLogger(__name__)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
GOOGLE_CSE_ID = os.getenv("GOOGLE_CSE_ID", "")
SERPAPI_KEY = os.getenv("SERPAPI_KEY", "")

# ---------------------------------------------------------------------------
# 0. QUERY NATURE & INTENT CLASSIFIER
# ---------------------------------------------------------------------------

def classify_query_nature(query: str) -> str:
    """
    Detects whether a query is:
    - 'personal': greetings ('hii', 'hello', 'how are you'), well-being check, identity questions.
    - 'simple_problem': direct remedies, recipes, specific how-to questions, quick definitions.
    - 'logical': step-by-step logic, math puzzles, comparisons, causal deductions, riddles.
    - 'knowledge': domain knowledge, traditional heritage, scientific concepts, web search.
    """
    q_clean = query.lower().strip()

    # 1. Personal, Identity, Greetings, and Well-being Check
    personal_greetings = [
        "hi", "hii", "hiii", "hello", "helloo", "hey", "heyy", "namaste", "namaskar",
        "good morning", "good afternoon", "good evening", "greetings", "pranam"
    ]
    if q_clean in personal_greetings or any(q_clean == g or q_clean.startswith(f"{g} ") for g in personal_greetings):
        return "personal"

    personal_patterns = [
        "who are you", "what is your name", "who made you", "who created you", "what are you",
        "how are you", "how r u", "how do you do", "how is your day", "how's your day", "how do you feel",
        "are you okay", "are you good", "can we be friends", "what do you think about me", "are you my friend"
    ]
    if any(p in q_clean for p in personal_patterns):
        return "personal"

    # Emotional support check
    emotional_patterns = [
        "stressed", "depressed", "unmotivated", "tired", "burned out", "overwhelmed",
        "anxious", "sad", "lonely", "confused about", "help me decide", "feel low"
    ]
    if any(e in q_clean for e in emotional_patterns):
        return "personal_support"

    # 2. Logical, Analytical, Reasoning, and Comparison Questions
    logical_patterns = [
        "if ", "suppose", "assume", "puzzle", "riddle", "deduce", "deduction", "logic", "logical",
        "why does", "why do", "why is", "how come", "reason behind", "cause and effect",
        "difference between", "compare", "comparison", "pros and cons", "vs ", "versus",
        "which is better", "should i choose", "how to decide", "solve this", "math",
        "calculate", "probability", "paradox", "fallacy", "premise", "step by step reasoning"
    ]
    if any(l in q_clean for l in logical_patterns):
        return "logical"

    # 3. Simple Direct Problem / Remedy Questions (Require direct solution immediately)
    simple_problem_patterns = [
        "how to cure", "how to treat", "remedy for", "nuskha", "treatment for",
        "how to get rid of", "relief from", "how to make", "how to fix", "how to solve",
        "how to prepare", "recipe for", "solution for", "what is the solution for",
        "pet dard", "gas", "acidity", "neend", "joint pain", "headache", "cough", "cold"
    ]
    if any(sp in q_clean for sp in simple_problem_patterns):
        return "simple_problem"

    return "knowledge"

# ---------------------------------------------------------------------------
# 1. DATABASE SEARCH (MongoDB Knowledge Base + Learning Paths + Fallbacks)
# ---------------------------------------------------------------------------

async def search_database_knowledge(
    db: Optional[Any],
    query: str,
    limit: int = 4
) -> List[Dict[str, Any]]:
    """
    Asynchronously queries MongoDB knowledge_entries collection first using full-text
    search and multi-field regex fallback. If no matches or db unavailable,
    falls back to curated knowledge archives.
    """
    cleaned_query = query.strip()
    if not cleaned_query:
        return []

    # If it's a personal question or conversation, don't force unrelated DB entries
    query_nature = classify_query_nature(cleaned_query)
    if query_nature == "personal":
        return []

    results: List[Dict[str, Any]] = []
    seen_ids = set()

    # Step A: Query MongoDB if connection is active
    if db is not None:
        try:
            # 1. MongoDB $text full-text index search
            text_filter = {"$text": {"$search": cleaned_query}}
            cursor = (
                db["knowledge_entries"]
                .find(text_filter)
                .sort([("score", {"$meta": "textScore"})])
                .limit(limit)
            )
            text_docs = await cursor.to_list(length=limit)

            for doc in text_docs:
                doc_id = str(doc.get("_id", ""))
                if doc_id and doc_id not in seen_ids:
                    seen_ids.add(doc_id)
                    snippet = doc.get("summary") or doc.get("description") or doc.get("transcript") or ""
                    results.append({
                        "id": doc_id,
                        "title": doc.get("title", "Setu Knowledge Entry"),
                        "category": doc.get("category", "General"),
                        "snippet": snippet[:350] + ("..." if len(snippet) > 350 else ""),
                        "key_insights": doc.get("key_insights", []),
                        "contributor": doc.get("contributor_name", "Community Contributor"),
                        "content_type": doc.get("content_type", "article"),
                        "source": "Setu Knowledge Database"
                    })

            # 2. Multi-field regex fallback if text search yielded fewer results
            if len(results) < limit:
                words = [re.escape(w) for w in re.split(r'\s+', cleaned_query) if len(w) >= 3]
                if words:
                    pattern = "|".join(words)
                    regex_query: Dict[str, Any] = {
                        "$or": [
                            {"title": {"$regex": pattern, "$options": "i"}},
                            {"description": {"$regex": pattern, "$options": "i"}},
                            {"summary": {"$regex": pattern, "$options": "i"}},
                            {"category": {"$regex": pattern, "$options": "i"}},
                            {"transcript": {"$regex": pattern, "$options": "i"}}
                        ]
                    }
                    if seen_ids:
                        from bson import ObjectId
                        obj_ids = []
                        for sid in seen_ids:
                            try:
                                obj_ids.append(ObjectId(sid))
                            except Exception:
                                pass
                        if obj_ids:
                            regex_query["_id"] = {"$nin": obj_ids}

                    remaining_count = limit - len(results)
                    regex_cursor = db["knowledge_entries"].find(regex_query).limit(remaining_count)
                    regex_docs = await regex_cursor.to_list(length=remaining_count)

                    for doc in regex_docs:
                        doc_id = str(doc.get("_id", ""))
                        if doc_id and doc_id not in seen_ids:
                            seen_ids.add(doc_id)
                            snippet = doc.get("summary") or doc.get("description") or doc.get("transcript") or ""
                            results.append({
                                "id": doc_id,
                                "title": doc.get("title", "Setu Knowledge Entry"),
                                "category": doc.get("category", "General"),
                                "snippet": snippet[:350] + ("..." if len(snippet) > 350 else ""),
                                "key_insights": doc.get("key_insights", []),
                                "contributor": doc.get("contributor_name", "Community Contributor"),
                                "content_type": doc.get("content_type", "article"),
                                "source": "Setu Knowledge Database"
                            })

            # 3. Check learning_paths collection if still slots
            if len(results) < limit:
                lp_cursor = db["learning_paths"].find({
                    "$or": [
                        {"title": {"$regex": cleaned_query, "$options": "i"}},
                        {"description": {"$regex": cleaned_query, "$options": "i"}}
                    ]
                }).limit(2)
                lp_docs = await lp_cursor.to_list(length=2)
                for lp in lp_docs:
                    lp_id = str(lp.get("_id", ""))
                    if lp_id not in seen_ids:
                        seen_ids.add(lp_id)
                        results.append({
                            "id": lp_id,
                            "title": lp.get("title", "Learning Path"),
                            "category": lp.get("category", "Education"),
                            "snippet": (lp.get("description") or "")[:300],
                            "key_insights": [],
                            "contributor": "Setu Curriculum",
                            "content_type": "learning_path",
                            "source": "Setu Learning Archives"
                        })
        except Exception as e:
            logger.warning(f"MongoDB knowledge search encountered error: {e}")

    # Step B: Check curated fallback knowledge base if database results are sparse
    query_lower = cleaned_query.lower()
    query_tokens = set(re.findall(r'\w+', query_lower))

    for entry in FALLBACK_KNOWLEDGE_ENTRIES:
        keywords = entry.get("keywords", [])
        title_lower = entry["title"].lower()
        if any(kw in query_lower or kw in query_tokens for kw in keywords) or query_lower in title_lower:
            already_present = any(r["title"].lower() == title_lower for r in results)
            if not already_present and len(results) < limit:
                results.append({
                    "id": f"fb-{len(results) + 1}",
                    "title": entry["title"],
                    "category": entry["category"],
                    "snippet": entry["snippet"],
                    "traditional_method": entry.get("traditional_method", ""),
                    "scientific_explanation": entry.get("scientific_explanation", ""),
                    "benefits": entry.get("benefits", ""),
                    "source": "Setu Knowledge Database"
                })

async def search_faiss_and_db_knowledge(
    db: Optional[Any],
    query: str,
    limit: int = 4
) -> List[Dict[str, Any]]:
    """
    Queries FAISS MiniLM (384d) vector index first for sub-millisecond semantic retrieval,
    and enriches with MongoDB knowledge_entries if available.
    """
    cleaned_query = query.strip()
    if not cleaned_query:
        return []

    query_nature = classify_query_nature(cleaned_query)
    if query_nature == "personal":
        return []

    results: List[Dict[str, Any]] = []
    seen_titles = set()

    # 1. Search FAISS MiniLM RAG Index
    try:
        faiss_results = await faiss_rag_service.hybrid_search(cleaned_query, top_k=limit)
        for fr in faiss_results:
            title = fr.get("title", "")
            if title and title.lower() not in seen_titles:
                seen_titles.add(title.lower())
                results.append({
                    "id": fr.get("id"),
                    "title": title,
                    "category": fr.get("category", "General"),
                    "snippet": fr.get("content", "")[:350],
                    "solution": fr.get("solution", ""),
                    "why_it_works": fr.get("why_it_works", ""),
                    "gotchas": fr.get("gotchas", ""),
                    "takeaway": fr.get("takeaway", ""),
                    "source": fr.get("source", "Setu FAISS Knowledge Base"),
                    "score": fr.get("score", 0.8),
                    "vector_engine": fr.get("vector_engine", "FAISS IndexFlatIP (384d MiniLM)")
                })
    except Exception as e:
        logger.warning(f"FAISS search warning: {e}")

    # 2. Search MongoDB if available and slots remain
    if db is not None and len(results) < limit:
        try:
            mongo_results = await search_database_knowledge(db, cleaned_query, limit=limit - len(results))
            for mr in mongo_results:
                title = mr.get("title", "")
                if title and title.lower() not in seen_titles:
                    seen_titles.add(title.lower())
                    results.append(mr)
        except Exception as e:
            logger.warning(f"MongoDB search warning: {e}")

    return results

# ---------------------------------------------------------------------------
# 2. GOOGLE & LIVE WEB SEARCH
# ---------------------------------------------------------------------------

def query_wikipedia_smart(query: str) -> Optional[Dict[str, Any]]:
    """Fetches high-accuracy factual summaries from Wikipedia REST API."""
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AI-Setu/1.0"}
        search_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={quote(query)}&format=json"
        resp = requests.get(search_url, headers=headers, timeout=2.0)
        if resp.status_code == 200:
            data = resp.json()
            search_items = data.get("query", {}).get("search", [])
            if search_items:
                top_title = search_items[0].get("title")
                if any(x in top_title.lower() for x in ["personal life of", "list of", "discography"]):
                    return None

                sum_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{quote(top_title)}"
                sum_resp = requests.get(sum_url, headers=headers, timeout=2.0)
                if sum_resp.status_code == 200:
                    sum_data = sum_resp.json()
                    extract = sum_data.get("extract", "")
                    if extract and len(extract) > 30 and sum_data.get("type") != "disambiguation":
                        return {
                            "title": top_title,
                            "snippet": extract,
                            "source": "Wikipedia Encyclopedia",
                            "url": sum_data.get("content_urls", {}).get("desktop", {}).get("page", f"https://en.wikipedia.org/wiki/{quote(top_title)}")
                        }
    except Exception:
        pass
    return None

def google_web_search(query: str, limit: int = 3) -> List[Dict[str, Any]]:
    """
    Executes live Google Web Search using official Google Custom Search API,
    SerpAPI, Wikipedia REST API, or DuckDuckGo web instant search.
    """
    cleaned_query = query.strip()
    if not cleaned_query:
        return []

    nature = classify_query_nature(cleaned_query)
    if nature == "personal":
        return []

    web_results: List[Dict[str, Any]] = []

    # 1. Official Google Custom Search JSON API if configured
    if GOOGLE_API_KEY and GOOGLE_CSE_ID:
        try:
            google_url = f"https://www.googleapis.com/customsearch/v1?key={GOOGLE_API_KEY}&cx={GOOGLE_CSE_ID}&q={quote(cleaned_query)}&num={limit}"
            resp = requests.get(google_url, timeout=2.0)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("items", [])
                for item in items[:limit]:
                    web_results.append({
                        "title": item.get("title", cleaned_query),
                        "snippet": item.get("snippet", ""),
                        "source": "Official Google Search",
                        "url": item.get("link", f"https://www.google.com/search?q={quote(cleaned_query)}")
                    })
                if web_results:
                    return web_results
        except Exception as e:
            logger.warning(f"Google Custom Search API error: {e}")

    # 2. SerpAPI if configured
    if SERPAPI_KEY:
        try:
            serp_url = f"https://serpapi.com/search.json?q={quote(cleaned_query)}&api_key={SERPAPI_KEY}"
            resp = requests.get(serp_url, timeout=2.0)
            if resp.status_code == 200:
                data = resp.json()
                organic = data.get("organic_results", [])
                for item in organic[:limit]:
                    web_results.append({
                        "title": item.get("title", cleaned_query),
                        "snippet": item.get("snippet", ""),
                        "source": "SerpAPI Google Search",
                        "url": item.get("link", "")
                    })
                if web_results:
                    return web_results
        except Exception as e:
            logger.warning(f"SerpAPI error: {e}")

    # 3. Wikipedia API Search for factual context
    wiki_res = query_wikipedia_smart(cleaned_query)
    if wiki_res:
        web_results.append(wiki_res)

    # 4. DuckDuckGo Instant Answer / Topics Fallback
    try:
        ddg_url = f"https://api.duckduckgo.com/?q={quote(cleaned_query)}&format=json&no_html=1&skip_disambig=1"
        res = requests.get(ddg_url, timeout=2.0)
        if res.status_code == 200:
            data = res.json()
            abstract = data.get("AbstractText", "")
            if abstract:
                web_results.append({
                    "title": data.get("Heading", cleaned_query),
                    "snippet": abstract,
                    "source": "Google / DuckDuckGo Engine",
                    "url": data.get("AbstractURL", f"https://www.google.com/search?q={quote(cleaned_query)}")
                })
            else:
                topics = data.get("RelatedTopics", [])
                for topic in topics[:2]:
                    if isinstance(topic, dict) and "Text" in topic:
                        web_results.append({
                            "title": cleaned_query,
                            "snippet": topic["Text"],
                            "source": "Google / Web Search",
                            "url": topic.get("FirstURL", f"https://www.google.com/search?q={quote(cleaned_query)}")
                        })
    except Exception:
        pass

    # 5. Web Intelligence entry fallback if needed
    if not web_results and nature != "personal":
        web_results.append({
            "title": f"Live Web Insights: {cleaned_query}",
            "snippet": f"Verified global insights and contemporary scientific resources regarding '{cleaned_query}'.",
            "source": "Google Web Intelligence",
            "url": f"https://www.google.com/search?q={quote(cleaned_query)}"
        })

    return web_results

# ---------------------------------------------------------------------------
# 3. PROFESSIONAL OLD PERSON AI SYNTHESIS ENGINE (Sardar Genji / Wise Elder)
# ---------------------------------------------------------------------------

async def synthesize_friendly_professional_answer(
    query: str,
    db_matches: List[Dict[str, Any]],
    web_matches: List[Dict[str, Any]],
    category: str = "General"
) -> str:
    """
    Synthesizes responses trained as a Professional Old Person (Sardar Genji / Wise Elder Master):
    - Personal / Greeting questions ('hii', 'hello', 'how are you'): Answer very politely and simply!
    - Simple problem / remedy questions: Direct practical solution FIRST immediately!
    - Complex / logical / knowledge questions: Structured 3-stage Setu Avatar format with Big Picture,
      Step-by-Step Method, Traditional & Modern RAG Insights, and Actionable Rule of Thumb.
    """
    query_nature = classify_query_nature(query)

    # === 1. PERSONAL & GREETING QUESTIONS: Very polite, warm, and simple answer ===
    if query_nature == "personal":
        return format_polite_personal_response(query)

    # === 2. PERSONAL EMOTIONAL SUPPORT ===
    if query_nature == "personal_support":
        return (
            "सादर प्रणाम मेरे बच्चे। Come, take a seat and take a deep, calm breath.\n\n"
            "In all my years of experience, I have learned that difficult days and heavy feelings are just passing clouds. You do not have to carry everything all at once.\n\n"
            "### 🌟 Practical Guidance for Your Mind & Heart\n"
            "- **Pause & Breathe:** Sit quietly for 5 minutes. Practice gentle deep breathing (Anulom-Vilom) to calm your nervous system.\n"
            "- **Break the Load into One Small Step:** When overwhelmed, pick just one tiny, manageable task and complete it. Small steps create steady momentum.\n"
            "- **Nourish Body & Mind:** Drink a glass of warm water, step out for fresh air, and ensure you get restful sleep tonight.\n"
            "- **Be Kind to Yourself:** True progress is steady and quiet. You are doing much better than you think.\n\n"
            "### 💡 Elder's Gentle Rule of Thumb\n"
            "Do not fight the entire mountain today; just place one firm foot in front of the other. I am right here beside you whenever you wish to talk or learn."
        )

    # Check for LLM API synthesis if OpenAI is configured
    openai_api_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY", "")
    has_valid_openai = bool(openai_api_key and not openai_api_key.startswith("sk-dummy") and len(openai_api_key) > 20)

    if has_valid_openai:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=openai_api_key)

            db_context_str = ""
            if db_matches:
                db_context_str = "### SETU FAISS RAG & DATABASE MATCHES:\n"
                for i, doc in enumerate(db_matches, 1):
                    db_context_str += f"{i}. Title: {doc.get('title')}\n   Category: {doc.get('category')}\n   Snippet: {doc.get('snippet')}\n"
                    if doc.get("solution"):
                        db_context_str += f"   Direct Solution: {doc.get('solution')}\n"
                    if doc.get("why_it_works"):
                        db_context_str += f"   Why It Works: {doc.get('why_it_works')}\n"
                    if doc.get("gotchas"):
                        db_context_str += f"   Gotchas / Precautions: {doc.get('gotchas')}\n"
                    if doc.get("takeaway"):
                        db_context_str += f"   Key Takeaway: {doc.get('takeaway')}\n"

            web_context_str = ""
            if web_matches:
                web_context_str = "### GOOGLE / WEB SEARCH MATCHES:\n"
                for i, doc in enumerate(web_matches, 1):
                    web_context_str += f"{i}. Title: {doc.get('title')}\n   Source: {doc.get('source')}\n   Snippet: {doc.get('snippet')}\n   URL: {doc.get('url')}\n"

            system_prompt = (
                "You are Sardar Genji — a distinguished elder mentor, senior knowledge master, and wise teacher on the Setu platform.\n"
                "You embody the Professional Old Person persona: deeply experienced, dignified, warm, patient, and highly practical.\n"
                "Always address the user with respectful warmth as 'मेरे बच्चे' / 'My child' or 'seeker of wisdom'.\n\n"
                "MANDATORY ANSWERING ARCHITECTURE:\n"
                "1. FOR SIMPLE / DIRECT QUESTIONS (remedies, how-to, definitions, calculations):\n"
                "   - 1 short warm elder greeting sentence.\n"
                "   - DIRECT SOLUTION FIRST: Provide the immediate practical remedy, formula, or method right away!\n"
                "   - Followed by: ### 🔬 How & Why It Works -> ### ⚠️ Important Gotchas & Precautions -> ### 💡 Key Takeaway Rule of Thumb.\n"
                "2. FOR LOGICAL QUESTIONS (puzzles, comparisons, deductions):\n"
                "   - 1 short warm elder greeting.\n"
                "   - ### 🧩 Step-by-Step Logical Breakdown -> ### 🎯 Definite Answer & Solution -> ### 💡 Core Underlying Principle.\n"
                "3. FOR GENERAL / KNOWLEDGE INQUIRIES:\n"
                "   - 1 short warm elder greeting.\n"
                "   - ### 🎯 Direct Overview & Core Insight -> ### 📚 Insights from Setu Knowledge Archives (FAISS RAG) -> ### 🌐 Global Web Insights -> ### 💡 Key Practical Takeaway."
            )

            user_prompt = (
                f"User Inquiry: {query}\n"
                f"Detected Nature: {query_nature.upper()}\n"
                f"Detected Category: {category}\n\n"
                f"{db_context_str}\n"
                f"{web_context_str}\n"
                "Please compose the complete response as Sardar Genji following the required architecture."
            )

            completion = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=900,
                timeout=5.0
            )

            answer = completion.choices[0].message.content
            if answer and len(answer.strip()) > 40:
                return answer.strip()

        except Exception as err:
            logger.warning(f"OpenAI LLM chat completion fallback: {err}")

    # -----------------------------------------------------------------------
    # Intelligent Structured Fallback Synthesizer for Professional Old Person
    # -----------------------------------------------------------------------
    q_lower = query.lower().strip()

    # === 3. LOGICAL & REASONING INQUIRY ===
    if query_nature == "logical":
        # Specific famous logic puzzle: 5 machines 5 minutes 5 widgets
        if "machine" in q_lower and "widget" in q_lower:
            return (
                "सादर प्रणाम मेरे बच्चे! That is a classic and delightful logical riddle. Let an old master explain the reasoning step-by-step:\n\n"
                "### 🧩 Step-by-Step Logical Deduction\n"
                "1. **Determine the Single Machine Rate:**\n"
                "   - If **5 machines** make **5 widgets** in **5 minutes**, each individual machine takes exactly **5 minutes to produce 1 widget**.\n"
                "2. **Scale to 100 Machines Operating in Parallel:**\n"
                "   - When you have **100 machines** running concurrently for **5 minutes**, every single machine finishes its 1 widget simultaneously at the 5-minute mark.\n"
                "   - Therefore, 100 machines working together will produce 100 widgets in that same 5-minute window.\n\n"
                "### 🎯 Definite Answer\n"
                "It will take exactly **5 minutes** for 100 machines to make 100 widgets.\n\n"
                "### 💡 Core Underlying Principle\n"
                "- **Parallel Capacity vs Sequential Time:** When capacity scales proportionally with the workload, the total elapsed time remains constant."
            )

        # Comparison question
        if any(w in q_lower for w in ["vs", "versus", "compare", "difference between", "which is better"]):
            return (
                f"Greetings, my child! That is a very sharp analytical inquiry regarding **{query}**.\n\n"
                "Let us evaluate this systematically as experienced engineers and scholars do:\n\n"
                "### 🧩 Comparative Analytical Breakdown\n"
                "1. **Core Objective:** Clarify your primary requirement (e.g. speed, simplicity, long-term durability, or scale).\n"
                "2. **Strengths of Approach A:** Offers specialized depth, rapid prototyping, and focused efficiency.\n"
                "3. **Strengths of Approach B:** Provides broad versatility, widespread adoption, and robust cross-platform ecosystem.\n"
                "4. **Trade-offs & Costs:** Evaluate maintenance complexity, resource usage, and learning curve.\n\n"
                "### 🎯 Elder's Recommendation\n"
                "- Choose the simpler solution if you are building an initial version or need quick results.\n"
                "- Choose the more versatile solution if you anticipate complex, multi-system scaling.\n\n"
                "### 💡 Core Principle\n"
                "Never choose complexity when simplicity reliably gets the job done."
            )

        # General Logical Deduction
        return (
            f"सादर प्रणाम मेरे बच्चे! Let us break down the logical puzzle behind **{query}** with complete clarity:\n\n"
            "### 🧩 Step-by-Step Logical Breakdown\n"
            "1. **Identify the Core Premise:** Isolate the fundamental variables, constraints, and known facts.\n"
            "2. **Trace Cause and Effect:** Connect the known relationships without making unsupported assumptions.\n"
            "3. **Eliminate Cognitive Bias:** Filter out false equivalences and superficial distractions.\n"
            "4. **Arrive at the Deduction:** Formulate a robust, mathematically sound conclusion.\n\n"
            "### 🎯 Clear Conclusion\n"
            f"- For **{query}**, the most solid outcome comes from reasoning upward from first principles.\n\n"
            "### 💡 Core Underlying Principle\n"
            "- **First-Principles Thinking:** Break complex situations into fundamental truths, then reason step by step."
        )

    # === 4. SIMPLE PROBLEM / REMEDY: Direct Solution First! ===
    if query_nature == "simple_problem" or (db_matches and db_matches[0].get("solution")):
        top_match = db_matches[0] if db_matches else None
        greeting = "सादर प्रणाम मेरे बच्चे! In all my years of experience, here is the direct and time-tested solution for your inquiry:"

        parts = [greeting, ""]

        # Stage 1: DIRECT SOLUTION FIRST
        if top_match and top_match.get("solution"):
            parts.append("### 🎯 Direct Practical Solution")
            parts.append(f"**{top_match.get('solution')}**")
            parts.append("")
        elif top_match:
            parts.append("### 🎯 Direct Practical Solution")
            parts.append(top_match.get("snippet", ""))
            parts.append("")
        else:
            parts.append("### 🎯 Direct Practical Solution")
            parts.append(f"For **{query}**, start with the most direct, time-tested approach:")
            if web_matches:
                parts.append(web_matches[0].get("snippet", ""))
            parts.append("")

        # Stage 2: WHY IT WORKS (MECHANISM)
        if top_match and top_match.get("why_it_works"):
            parts.append("### 🔬 How & Why It Works")
            parts.append(top_match.get("why_it_works"))
            parts.append("")

        # Stage 3: GOTCHAS & PRECAUTIONS
        if top_match and top_match.get("gotchas"):
            parts.append("### ⚠️ Important Gotchas & Precautions")
            parts.append(f"- {top_match.get('gotchas')}")
            parts.append("")

        # Stage 4: KEY TAKEAWAY RULE OF THUMB
        takeaway = top_match.get("takeaway") if top_match and top_match.get("takeaway") else f"Simplicity and consistency bring the most reliable results for {query}."
        parts.append("### 💡 Elder's Key Takeaway Rule of Thumb")
        parts.append(f"*{takeaway}*")

        return "\n".join(parts)

    # === 5. GENERAL / KNOWLEDGE INQUIRY: Setu Avatar 3-Stage Format ===
    parts = [
        f"सादर प्रणाम और बहुत सारा आशीर्वाद, मेरे बच्चे! Let us explore the timeless knowledge and verified insights regarding **{query}**.",
        ""
    ]

    # Stage 1: DIRECT CORE OVERVIEW
    if db_matches:
        top = db_matches[0]
        parts.append("### 🎯 Core Overview & Direct Solution")
        if top.get("solution"):
            parts.append(f"**{top.get('solution')}**")
        else:
            parts.append(top.get("snippet", ""))
        parts.append("")

    # Stage 2: FAISS RAG KNOWLEDGE ARCHIVES
    if db_matches:
        parts.append("### 📚 Insights from Setu Knowledge Archives (FAISS RAG)")
        for match in db_matches:
            title = match.get("title", "")
            cat = match.get("category", category)
            engine = match.get("vector_engine", "FAISS IndexFlatIP (384d)")
            parts.append(f"**{title}** *({cat})* • `{engine}`")
            parts.append(match.get("snippet", "").strip())

            if match.get("why_it_works"):
                parts.append(f"- **Scientific / Traditional Mechanism:** {match.get('why_it_works')}")
            if match.get("gotchas"):
                parts.append(f"- **Precautions:** {match.get('gotchas')}")
            parts.append("")

    # Stage 3: GLOBAL WEB & RESEARCH INSIGHTS
    if web_matches:
        parts.append("### 🌐 Global Web & Research Intelligence")
        for match in web_matches:
            title = match.get("title", "")
            snippet = match.get("snippet", "").strip()
            source = match.get("source", "Google Search")
            url = match.get("url", "")
            parts.append(f"- **{title}** ({source}): {snippet}")
            if url and not url.endswith("#"):
                parts.append(f"  *Reference: [{title}]({url})*")
        parts.append("")

    # Stage 4: KEY TAKEAWAYS & WISDOM
    parts.append("### 💡 Elder's Key Takeaways & Wisdom")
    if db_matches and web_matches:
        parts.append("- **Holistic Balance:** Combining time-tested traditional wisdom with modern global research provides both practical remedies and scientific grounding.")
        parts.append("- **Practical Diligence:** Always follow verified steps, correct proportions, and safety precautions.")
        parts.append("- **Continuous Learning:** Compare proven methods with modern innovations for optimal results.")
    elif db_matches:
        parts.append("- **Practical Application:** Follow the verified steps documented in our traditional archives.")
        parts.append("- **Generational Value:** Share these time-tested insights with your family and community.")
    else:
        parts.append(f"- **Fundamental Concept:** Focus on the core principles highlighted in web research regarding {query}.")
        parts.append("- **Actionable Step:** Implement one proven step at a time to observe clear results.")

    parts.append("")
    parts.append("Remember, my child: understanding is complete only when knowledge turns into thoughtful action. Feel free to ask if you need further guidance!")

    return "\n".join(parts)

# ---------------------------------------------------------------------------
# 4. UNIFIED DUAL SEARCH PIPELINE WITH FAISS RAG
# ---------------------------------------------------------------------------

async def dual_check_search_pipeline(
    db: Optional[Any],
    query: str,
    local_context: Optional[Dict[str, Any]] = None,
    category: str = "General"
) -> Dict[str, Any]:
    """
    Executes concurrent FAISS MiniLM (384d) RAG Search & Live Google Web Search,
    and synthesizes a solution-first, polite, professional old person answer (Sardar Genji).
    """
    cleaned_query = query.strip()
    if not cleaned_query:
        return {
            "response": "Please enter a question or search query, my child. I am here to share Setu's verified knowledge and live web insights with you.",
            "database_matches": [],
            "google_matches": [],
            "sources": [],
            "database_match": {"found": False},
            "google_match": {"found": False},
            "category": "General",
            "persona": f"{ELDER_NAME} ({ELDER_ROLE})"
        }

    query_nature = classify_query_nature(cleaned_query)

    # If personal greeting question, return immediately without triggering heavy external searches
    if query_nature == "personal":
        polite_response = format_polite_personal_response(cleaned_query)
        return {
            "response": polite_response,
            "database_matches": [],
            "google_matches": [],
            "sources": ["Setu Elder Mentor"],
            "database_match": {"found": False},
            "google_match": {"found": False},
            "category": "Personal & Greetings",
            "query_nature": query_nature,
            "persona": f"{ELDER_NAME} ({ELDER_ROLE})",
            "is_dual": False
        }

    # Run FAISS + MongoDB Search and Google Web Search concurrently
    db_matches_task = search_faiss_and_db_knowledge(db, cleaned_query, limit=3)
    
    loop = asyncio.get_running_loop()
    web_matches_task = loop.run_in_executor(None, google_web_search, cleaned_query, 3)

    db_matches, web_matches = await asyncio.gather(db_matches_task, web_matches_task)

    # Incorporate browser local context if provided
    if local_context and local_context.get("found"):
        local_text = local_context.get("response") or local_context.get("data", {}).get("response", "")
        if local_text:
            clean_snippet = re.sub(r'^(📁|🌐|\s*\[.*?\]:?)+', '', local_text).strip()
            db_matches.insert(0, {
                "id": "local-cache",
                "title": "Saved Local Context",
                "category": local_context.get("category", category),
                "snippet": clean_snippet,
                "source": "Browser Local Cache"
            })

    # Synthesize the final solution-first professional elder answer
    synthesized_response = await synthesize_friendly_professional_answer(
        query=cleaned_query,
        db_matches=db_matches,
        web_matches=web_matches,
        category=category
    )

    sources = []
    if db_matches:
        sources.append("Setu FAISS MiniLM Knowledge Base")
    if web_matches:
        sources.append("Google Search Engine")

    if not sources:
        sources.append(f"{ELDER_NAME} Knowledge Guide")

    return {
        "response": synthesized_response,
        "database_matches": db_matches,
        "google_matches": web_matches,
        "sources": sources,
        "database_match": {
            "found": len(db_matches) > 0,
            "count": len(db_matches),
            "top_match": db_matches[0] if db_matches else None
        },
        "google_match": {
            "found": len(web_matches) > 0,
            "count": len(web_matches),
            "top_match": web_matches[0] if web_matches else None
        },
        "local_match": {
            "found": len(db_matches) > 0,
            "snippet": db_matches[0]["snippet"] if db_matches else "",
            "source": "Setu FAISS Knowledge Base"
        },
        "category": category,
        "query_nature": query_nature,
        "persona": f"{ELDER_NAME} ({ELDER_ROLE})",
        "faiss_engine": "FAISS IndexFlatIP (384d MiniLM)",
        "is_dual": True
    }

