import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.models.avatar_schemas import LifeEventItem, LifeEventType
from app.services.storage_service import storage_service

logger = logging.getLogger("life_cycle")


class LifeCycleService:
    """
    Manages Setu Avatar's progression, experiences, digital growth, and milestone events.
    """

    async def record_event(
        self,
        event_type: LifeEventType,
        description: str,
        importance: float = 0.8,
        metadata: Optional[Dict[str, Any]] = None,
        source: str = "conversation"
    ) -> LifeEventItem:
        """Records a new life experience in Setu Avatar's persistent life log."""
        event = await storage_service.add_life_event(
            event_type=event_type,
            description=description,
            importance=importance,
            metadata=metadata,
            source=source
        )
        logger.info(f"Setu Avatar Life Event recorded: [{event_type.value}] {description}")
        return event

    async def evaluate_interaction_milestones(self, user_id: str, user_message: str, response: str):
        """Checks if interaction triggers major avatar life events (first talk, milestone, etc.)."""
        stats = await storage_service.get_avatar_stats()
        interaction_count = stats.get("totalInteractions", 0)

        # 1. First Conversation Ever
        if interaction_count == 1:
            await self.record_event(
                event_type=LifeEventType.FIRST_CONVERSATION,
                description=f"Engaged in first live conversation with human participant ({user_id}).",
                importance=0.95,
                metadata={"userId": user_id, "first_query": user_message[:60]}
            )

        # 2. Significant Milestone Check
        if interaction_count in [10, 50, 100, 500, 1000]:
            await self.record_event(
                event_type=LifeEventType.MILESTONE,
                description=f"Reached digital maturity milestone: {interaction_count} total knowledge exchanges.",
                importance=0.90,
                metadata={"interaction_count": interaction_count}
            )

    async def get_life_events(self, limit: int = 25) -> List[LifeEventItem]:
        return await storage_service.get_life_events(limit=limit)

    async def get_stats(self) -> Dict[str, Any]:
        return await storage_service.get_avatar_stats()


life_cycle_service = LifeCycleService()
