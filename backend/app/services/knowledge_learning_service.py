import re
import json
import logging
from typing import Dict, Any, Optional
import httpx

from app.config import settings
from app.models.avatar_schemas import KnowledgeItem, KnowledgeContribution, LifeEventType
from app.services.storage_service import storage_service
from app.services.rag_service import rag_service
from app.services.life_cycle_service import life_cycle_service

logger = logging.getLogger("knowledge_learning")


class KnowledgeLearningService:
    """
    Handles user-taught knowledge detection, extraction, user confirmation,
    vector database embedding insertion, and future RAG indexing.
    """

    async def detect_knowledge_contribution(self, user_message: str) -> Optional[Dict[str, Any]]:
        """
        Detects if the user is sharing indigenous, traditional, farming, artisan, or generational knowledge.
        """
        lower = user_message.lower()
        triggers = [
            "my grandfather taught me", "my grandmother taught me", "traditional method", "traditional technique",
            "seed preservation", "ancestral recipe", "indigenous way", "our village uses", "passed down for generations",
            "traditional farming technique", "herbal preparation", "natural pesticide"
        ]
        
        has_trigger = any(t in lower for t in triggers)
        if not has_trigger:
            return None

        # Extract structured knowledge
        extraction = await self._extract_knowledge_structure(user_message)
        return extraction

    async def _extract_knowledge_structure(self, text: str) -> Dict[str, Any]:
        """Extracts title, category, location, and structured content."""
        if settings.OPENAI_API_KEY and not settings.OPENAI_API_KEY.startswith("sk-Your"):
            try:
                system_prompt = (
                    "Extract traditional/generational knowledge from the user statement. "
                    "Return ONLY JSON: "
                    '{"isKnowledge": bool, "title": str, "category": "Farming"|"Healthcare"|"Craft"|"Heritage", "state": str, "content": str}'
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
                                {"role": "user", "content": text}
                            ],
                            "temperature": 0.1,
                            "max_tokens": 200
                        }
                    )
                    if resp.status_code == 200:
                        content = resp.json()["choices"][0]["message"]["content"].strip()
                        match = re.search(r'\{.*\}', content, re.DOTALL)
                        if match:
                            return json.loads(match.group(0))
            except Exception as e:
                logger.debug(f"LLM knowledge extraction notice: {e}")

        # Heuristic fallback structure
        category = "Farming" if "farm" in text.lower() or "seed" in text.lower() or "crop" in text.lower() else "Heritage & Traditional Knowledge"
        return {
            "isKnowledge": True,
            "title": f"Traditional Practice: {text[:45]}...",
            "category": category,
            "state": "India",
            "content": text.strip()
        }

    async def confirm_and_preserve_knowledge(
        self,
        user_id: str,
        title: str,
        category: str,
        content: str,
        state: Optional[str] = "India",
        district: Optional[str] = None,
        language: str = "English"
    ) -> KnowledgeItem:
        """
        Final step: Stores new knowledge into Knowledge Base, computes embeddings,
        indexes into Qdrant/Vector DB, and logs life cycle milestones.
        """
        # 1. Add to RAG vector database & storage
        item = await rag_service.add_verified_knowledge(
            title=title,
            category=category,
            content=content,
            state=state,
            district=district,
            language=language,
            source_type="User Contributed Heritage",
            contributor_id=user_id
        )

        # 2. Record Life Event
        await life_cycle_service.record_event(
            event_type=LifeEventType.FIRST_KNOWLEDGE_LEARNED,
            description=f"Preserved new generational wisdom: '{title}' shared by contributor {user_id}.",
            importance=0.95,
            metadata={"documentId": item.documentId, "category": category, "title": title}
        )

        logger.info(f"Knowledge preserved and vector-indexed: {item.documentId} - {item.title}")
        return item


knowledge_learning_service = KnowledgeLearningService()
