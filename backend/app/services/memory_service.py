import re
import json
import logging
import asyncio
from typing import List, Dict, Any, Optional
import httpx

from app.config import settings
from app.models.avatar_schemas import MemoryItem, MemoryType
from app.services.storage_service import storage_service

logger = logging.getLogger("memory_service")


class MemoryService:
    """
    Persistent Memory Service for Setu Avatar.
    Extracts, stores, searches, and manages Short-Term, Long-Term, Episodic, and Semantic memories.
    """

    async def extract_and_store_memory(
        self,
        user_message: str,
        avatar_response: str,
        user_id: str = "guest_user"
    ) -> Optional[MemoryItem]:
        """
        Analyzes conversation turn to determine if memorable facts or episodes occurred.
        Stores to persistent memory if importance exceeds threshold.
        """
        user_msg = user_message.strip()
        if len(user_msg.split()) < 3:
            return None

        # Quick heuristic filter: skip pure greetings or generic small talk
        if re.match(r'(?i)^(hello|hi|hey|good morning|good evening|how are you|thanks|thank you|ok|bye)\b', user_msg) and len(user_msg.split()) <= 4:
            return None

        extraction = await self._analyze_memory_content(user_msg, avatar_response)
        
        if extraction.get("shouldRemember") and extraction.get("importance", 0.0) >= settings.MEMORY_IMPORTANCE_THRESHOLD:
            summary = extraction.get("summary", "").strip()
            mem_type_str = extraction.get("memoryType", "EPISODIC_MEMORY")
            try:
                mem_type = MemoryType(mem_type_str)
            except Exception:
                mem_type = MemoryType.EPISODIC_MEMORY

            if summary:
                mem_item = await storage_service.add_memory(
                    user_id=user_id,
                    type=mem_type,
                    summary=summary,
                    importance=float(extraction.get("importance", 0.75)),
                    source="user_conversation"
                )
                logger.info(f"Persistent memory created for {user_id}: [{mem_type.value}] {summary}")
                return mem_item

        return None

    async def _analyze_memory_content(self, user_message: str, avatar_response: str) -> Dict[str, Any]:
        """Uses LLM or rule-based parser to extract structured memory."""
        # 1. Try LLM Extraction if OpenAI Key available
        if settings.OPENAI_API_KEY and not settings.OPENAI_API_KEY.startswith("sk-Your"):
            try:
                system_prompt = (
                    "You are the memory subsystem of Setu Avatar. "
                    "Evaluate if the user's message contains personal facts, preferences, life events, family details, "
                    "or traditional knowledge worth remembering. "
                    "Respond with ONLY a JSON object: "
                    '{"shouldRemember": bool, "memoryType": "LONG_TERM_MEMORY"|"EPISODIC_MEMORY"|"SEMANTIC_MEMORY", "importance": float (0.0 to 1.0), "summary": "concise 3rd person statement"}'
                )
                async with httpx.AsyncClient(timeout=4.0) as client:
                    resp = await client.post(
                        f"{settings.OPENAI_BASE_URL.rstrip('/')}/chat/completions",
                        headers={
                            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": settings.OPENAI_MODEL,
                            "messages": [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": f"User said: \"{user_message}\""}
                            ],
                            "temperature": 0.1,
                            "max_tokens": 150
                        }
                    )
                    if resp.status_code == 200:
                        content = resp.json()["choices"][0]["message"]["content"].strip()
                        # Extract json if wrapped in ```json
                        json_match = re.search(r'\{.*\}', content, re.DOTALL)
                        if json_match:
                            return json.loads(json_match.group(0))
            except Exception as e:
                logger.debug(f"LLM memory extraction fallback: {e}")

        # 2. Rule-based Deterministic Memory Extraction
        return self._heuristic_memory_extraction(user_message)

    def _heuristic_memory_extraction(self, text: str) -> Dict[str, Any]:
        lower = text.lower()

        # Birthday / Celebration
        if "birthday" in lower:
            return {
                "shouldRemember": True,
                "memoryType": "EPISODIC_MEMORY",
                "importance": 0.85,
                "summary": "User celebrated their birthday."
            }

        # Name Introduction
        name_match = re.search(r'(?i)(?:my name is|i am|call me|myself)\s+([A-Z][a-z]+)', text)
        if name_match:
            name = name_match.group(1)
            return {
                "shouldRemember": True,
                "memoryType": "LONG_TERM_MEMORY",
                "importance": 0.95,
                "summary": f"User's name is {name}."
            }

        # Grandfather / Family Traditional Lore
        if any(w in lower for w in ["grandfather", "grandmother", "dada", "nana", "father", "ancestors", "elders", "family"]):
            return {
                "shouldRemember": True,
                "memoryType": "EPISODIC_MEMORY",
                "importance": 0.88,
                "summary": f"User shared family heritage lore: \"{text}\""
            }

        # Location / Home
        loc_match = re.search(r'(?i)(?:i live in|i am from|my hometown is|my village is)\s+([A-Za-z\s]+)', text)
        if loc_match:
            loc = loc_match.group(1).strip()
            return {
                "shouldRemember": True,
                "memoryType": "LONG_TERM_MEMORY",
                "importance": 0.80,
                "summary": f"User is from {loc}."
            }

        # Preferences
        if "i prefer" in lower or "i like" in lower or "i speak" in lower:
            return {
                "shouldRemember": True,
                "memoryType": "LONG_TERM_MEMORY",
                "importance": 0.70,
                "summary": f"User preference: \"{text}\""
            }

        return {"shouldRemember": False, "importance": 0.0, "summary": ""}

    async def retrieve_relevant_memories(
        self,
        query: str,
        user_id: str = "guest_user",
        top_k: int = 3
    ) -> List[MemoryItem]:
        """
        Searches user's persistent memories for contextually relevant entries.
        """
        all_user_memories = await storage_service.get_user_memories(user_id=user_id, min_importance=0.4)
        if not all_user_memories:
            return []

        query_words = set(re.findall(r'\w+', query.lower()))
        # Remove common stop words
        stop_words = {"do", "you", "remember", "what", "i", "told", "about", "me", "the", "a", "an", "is", "my", "to", "did"}
        meaningful_words = query_words - stop_words

        scored_memories = []
        for mem in all_user_memories:
            mem_words = set(re.findall(r'\w+', mem.summary.lower()))
            overlap = len(meaningful_words.intersection(mem_words))
            
            score = (overlap * 0.4) + (mem.importance * 0.4)
            if overlap > 0 or "remember" in query.lower() or "who am i" in query.lower() or "my name" in query.lower():
                scored_memories.append((score, mem))

        scored_memories.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored_memories[:top_k]]


memory_service = MemoryService()
