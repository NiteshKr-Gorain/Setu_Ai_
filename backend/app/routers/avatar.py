import time
import asyncio
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse, StreamingResponse

from app.models.avatar_schemas import (
    AvatarChatRequest, AvatarChatResponse, MemoryCreateRequest,
    KnowledgeContributeRequest, KnowledgeConfirmRequest,
    TTSRequest, STTRequest, AvatarStatsResponse, MemoryType
)
from app.services.avatar_brain_service import avatar_brain_service
from app.services.personality_service import AVATAR_PERSONAS
from app.services.storage_service import storage_service
from app.services.rag_service import rag_service
from app.services.life_cycle_service import life_cycle_service
from app.services.vector_store_service import vector_store_service
from app.services.web_search_service import web_search_service
from app.services.knowledge_learning_service import knowledge_learning_service
from app.services.synthesizer import generate_visemes
from app.services.tts_pronunciation_service import tts_pronunciation_service
from app.services.neural_tts_service import neural_tts_service
from app.services.avatar_custom_knowledge_service import custom_knowledge_service

router = APIRouter(prefix="/api", tags=["avatar"])


# ----------------- 1. System Health & Status -----------------

@router.get("/health")
async def health_check():
    stats = await storage_service.get_avatar_stats()
    return {
        "status": "online",
        "engine": "SETU AI Knowledge Bridge Persistent Avatar Brain",
        "version": "2.0.0",
        "character": "Setu Avatar",
        "vector_store_documents": vector_store_service.count(),
        "total_interactions": stats.get("totalInteractions", 0),
        "total_memories": stats.get("totalMemories", 0),
        "total_knowledge": stats.get("totalKnowledgeLearned", 0),
        "constraints": {
            "max_sentences": 3,
            "max_words": 50,
            "formatting": "Zero markdown / Spoken voice delivery with 60FPS lip-sync visemes"
        }
    }


# ----------------- 2. Personas -----------------

@router.get("/avatar/personas")
def get_personas():
    return {
        "personas": AVATAR_PERSONAS,
        "default": "genji"
    }


# ----------------- 3. Main Avatar Chat (Instant & Progressive Streaming) -----------------

@router.post("/avatar/chat", response_model=AvatarChatResponse)
async def chat_avatar(request: AvatarChatRequest):
    """
    Main Setu Avatar Query & Conversation Endpoint.
    """
    try:
        response = await avatar_brain_service.process_chat(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Avatar Brain processing error: {str(e)}")


@router.post("/avatar/chat-stream")
async def chat_avatar_stream(request: AvatarChatRequest):
    """
    Progressive Real-Time Streaming Endpoint (Server-Sent Events).
    Emits instant acknowledgement and streams answer chunks progressively so user never waits.
    """
    return StreamingResponse(
        avatar_brain_service.process_chat_stream(request),
        media_type="text/event-stream"
    )


# ----------------- 4. Life Cycle & Digital Stats -----------------

@router.get("/avatar/stats", response_model=AvatarStatsResponse)
async def get_avatar_stats():
    """Returns Setu Avatar's digital existence stats, interaction counters, and milestones."""
    stats = await life_cycle_service.get_stats()
    return AvatarStatsResponse(**stats)


@router.get("/avatar/life-events")
async def get_avatar_life_events(limit: int = Query(25, ge=1, le=100)):
    """Returns Setu Avatar's chronological life experiences and milestone events."""
    events = await life_cycle_service.get_life_events(limit=limit)
    return {
        "count": len(events),
        "events": events
    }


# ----------------- 5. Memory System Endpoints -----------------

@router.get("/avatar/memories")
async def get_memories(userId: str = Query("guest_user"), minImportance: float = Query(0.0, ge=0.0, le=1.0)):
    """Retrieves all persistent memories stored for a specific user."""
    mems = await storage_service.get_user_memories(user_id=userId, min_importance=minImportance)
    return {
        "userId": userId,
        "count": len(mems),
        "memories": mems
    }


@router.post("/avatar/memories")
async def create_memory(request: MemoryCreateRequest):
    """Explicitly stores a user memory."""
    mem = await storage_service.add_memory(
        user_id=request.userId,
        type=request.type,
        summary=request.summary,
        importance=request.importance,
        source="user_explicit"
    )
    return {
        "status": "success",
        "memory": mem
    }


@router.delete("/avatar/memories/{memory_id}")
async def delete_memory(memory_id: str, userId: Optional[str] = Query(None)):
    """Deletes a specific memory entry."""
    success = await storage_service.delete_memory(memory_id, user_id=userId)
    if not success:
        raise HTTPException(status_code=404, detail="Memory item not found.")
    return {"status": "success", "message": f"Memory {memory_id} deleted."}


@router.delete("/avatar/memories")
async def clear_user_memories(userId: str = Query(...)):
    """Clears all memories for a given user."""
    removed = await storage_service.clear_user_memories(user_id=userId)
    return {"status": "success", "cleared_count": removed}


# ----------------- 6. Setu Preserved Knowledge & Learning -----------------

@router.get("/avatar/knowledge")
async def get_avatar_knowledge(category: Optional[str] = Query(None)):
    """Lists verified traditional and generational knowledge stored in Setu."""
    items = await storage_service.get_all_knowledge_items()
    if category:
        items = [k for k in items if k.category.lower() == category.lower()]
    return {
        "count": len(items),
        "knowledge": items
    }


@router.post("/avatar/knowledge/contribute")
async def contribute_knowledge(request: KnowledgeContributeRequest):
    """Submits new traditional knowledge from a user for preservation."""
    item = await rag_service.add_verified_knowledge(
        title=request.title,
        category=request.category,
        content=request.content,
        state=request.state or "India",
        district=request.district,
        language=request.language or "English",
        source_type=request.sourceType,
        contributor_id=request.userId
    )
    return {
        "status": "preserved",
        "message": f"Knowledge '{item.title}' successfully preserved in Setu and indexed for RAG search.",
        "item": item
    }


@router.post("/avatar/knowledge/confirm")
async def confirm_user_knowledge(request: KnowledgeConfirmRequest):
    """Confirms and permanently indexes user-taught knowledge into Setu."""
    item = await knowledge_learning_service.confirm_and_preserve_knowledge(
        user_id=request.userId,
        title=request.title,
        category=request.category,
        content=request.content,
        state=request.state,
        district=request.district,
        language=request.language
    )
    return {
        "status": "confirmed_and_indexed",
        "message": "User knowledge confirmed and indexed into Setu vector database.",
        "document": item
    }


# ----------------- 7. Text-To-Speech & Speech-To-Text Endpoints -----------------

@router.post("/avatar/tts")
async def text_to_speech(request: TTSRequest):
    """
    Backend Studio-Grade Neural TTS Endpoint.
    Applies pronunciation processing to text, generates studio-quality audio & lip-sync visemes.
    """
    tts_result = tts_pronunciation_service.process_for_tts(
        request.text,
        language=request.language or "en-IN",
        voice_gender=request.voice_gender or "female"
    )
    visemes = generate_visemes(request.text)
    
    audio_base64 = await neural_tts_service.generate_speech_base64(
        text=request.text,
        language=request.language or "en-IN",
        rate="+0%",
        pitch="+0Hz"
    )

    return {
        "display_text": request.text,
        "tts_text": tts_result["tts_text"],
        "ssml_text": tts_result.get("ssml_text"),
        "audio_base64": audio_base64,
        "language": request.language,
        "visemes": visemes,
        "debug": tts_result.get("debug"),
        "message": "Studio-grade neural speech generated successfully."
    }


@router.post("/avatar/stt")
async def speech_to_text(request: STTRequest):
    """
    Backend Speech-To-Text fallback endpoint.
    """
    return {
        "status": "ready",
        "text": "Transcribed audio query",
        "language": request.language
    }


# ----------------- 8. Custom Knowledge & Avatar Training Endpoints -----------------

@router.get("/avatar/custom-knowledge")
async def get_custom_knowledge():
    """Returns all custom user-trained knowledge items and API key status."""
    items = custom_knowledge_service.get_all()
    api_status = custom_knowledge_service.get_api_key_status()
    return {
        "count": len(items),
        "knowledge": items,
        "api_status": api_status
    }


@router.post("/avatar/custom-knowledge")
async def add_custom_knowledge(data: Dict[str, Any]):
    """Adds a new custom topic and answer directly to train the avatar."""
    topic = data.get("topic", "").strip()
    answer = data.get("answer", "").strip()
    category = data.get("category", "General")
    keywords = data.get("keywords") or []
    language = data.get("language", "en-IN")

    if not topic or not answer:
        raise HTTPException(status_code=400, detail="Topic and answer are required.")

    entry = custom_knowledge_service.add_entry(
        topic=topic,
        answer=answer,
        keywords=keywords,
        category=category,
        language=language
    )
    return {"status": "success", "message": f"Successfully trained avatar on '{topic}'", "entry": entry}


@router.delete("/avatar/custom-knowledge/{item_id}")
async def delete_custom_knowledge(item_id: str):
    """Deletes a custom knowledge entry by ID."""
    success = custom_knowledge_service.delete_entry(item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Knowledge item not found.")
    return {"status": "success", "message": "Knowledge entry removed."}


@router.post("/avatar/custom-knowledge/train-text")
async def train_from_raw_text(data: Dict[str, Any]):
    """Ingests and trains the avatar from a raw document or article text."""
    text = data.get("text", "").strip()
    title = data.get("title", "Custom Document").strip()
    category = data.get("category", "Document").strip()

    if not text or len(text) < 15:
        raise HTTPException(status_code=400, detail="Please provide at least 15 characters of text.")

    entries = custom_knowledge_service.ingest_raw_text(text, title=title, category=category)
    return {
        "status": "success",
        "message": f"Successfully trained avatar with {len(entries)} knowledge entries.",
        "entries": entries
    }


@router.post("/avatar/config/keys")
async def save_api_keys(data: Dict[str, Any]):
    """Saves runtime OpenRouter API key, model selection, or direct keys."""
    openrouter_key = data.get("openrouter_key")
    openrouter_model = data.get("openrouter_model")
    gemini_key = data.get("gemini_key")
    openai_key = data.get("openai_key")
    res = custom_knowledge_service.save_api_keys(
        openrouter_key=openrouter_key,
        openrouter_model=openrouter_model,
        gemini_key=gemini_key,
        openai_key=openai_key
    )
    return {"status": "success", "message": "API Keys and model configured successfully.", "status_info": res}
