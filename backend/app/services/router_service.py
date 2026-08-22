import re
import json
import logging
from typing import Dict, Any, Optional
import httpx

from app.config import settings
from app.models.avatar_schemas import IntentType

logger = logging.getLogger("query_router")


class QueryRouterService:
    """
    Intelligent Query Router classifying user intent into:
    - CASUAL_CHAT
    - SETU_KNOWLEDGE
    - WEB_SEARCH
    - MEMORY_RECALL
    - HYBRID
    """

    async def route_query(self, query: str, conversation_history: Optional[list] = None) -> IntentType:
        clean_q = query.strip()
        if not clean_q:
            return IntentType.CASUAL_CHAT

        # Fast & Instant Deterministic Heuristic Classifier (< 0.5ms latency)
        return self._heuristic_route(clean_q)


    def _heuristic_route(self, query: str) -> IntentType:
        lower = query.lower()

        # Hybrid: comparison between traditional and modern/government
        has_compare = any(w in lower for w in ["compare", "difference between", "versus", "vs", "combine", "contrast"])
        has_traditional = any(w in lower for w in ["traditional", "setu", "ancient", "indigenous", "ancestral", "heritage"])
        has_current = any(w in lower for w in ["latest", "government", "modern", "recommendation", "current", "scheme", "policy"])
        if (has_compare and (has_traditional or has_current)) or (has_traditional and has_current):
            return IntentType.HYBRID

        # Memory Recall
        if any(w in lower for w in ["do you remember", "remember what", "remember my", "did i tell you", "what is my name", "who am i", "what did i say"]):
            return IntentType.MEMORY_RECALL

        # Casual Chat (Greetings, birthday, pleasantries, small talk)
        is_greeting = re.match(r'(?i)^(hello|hi|hey|greetings|good morning|good afternoon|good evening|namaste|sat sri akal|how are you|who are you|thanks|thank you)\b', lower)
        is_celebration = any(w in lower for w in ["it's my birthday", "my birthday today", "i'm feeling bored", "tell me something interesting", "tell me a joke"])
        if is_celebration or (is_greeting and len(lower.split()) <= 6):
            return IntentType.CASUAL_CHAT

        # Web Search (Latest, news, government schemes, market prices, current events)
        if any(w in lower for w in ["latest", "news", "government scheme", "schemes for farmers", "current price", "today price", "stock", "recent", "weather", "minister", "market rate"]):
            return IntentType.WEB_SEARCH

        # Setu Knowledge / Traditional RAG
        if any(w in lower for w in ["traditional", "farming", "neemastra", "jeevamrutha", "wheat", "bori bandh", "ragi", "ambali", "kashayam", "ayurveda", "indigenous", "knowledge stored in setu", "what did this farmer", "seed preservation", "ancestral", "artisan", "handloom", "heritage"]):
            return IntentType.SETU_KNOWLEDGE

        # Default fallback: casual chat if very short, else Setu Knowledge
        if len(lower.split()) <= 2:
            return IntentType.CASUAL_CHAT
        return IntentType.SETU_KNOWLEDGE


query_router_service = QueryRouterService()
