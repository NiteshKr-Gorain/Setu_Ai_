import os
import json
import uuid
import logging
import asyncio
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Optional

from app.config import settings
from app.models.avatar_schemas import (
    Conversation, Message, MemoryItem, MemoryType,
    LifeEventItem, LifeEventType, KnowledgeItem, KnowledgeContribution
)

logger = logging.getLogger("storage_service")


class StorageService:
    def __init__(self):
        self.data_dir = settings.DATA_DIR
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        self.conversations_file = self.data_dir / "conversations.json"
        self.memories_file = self.data_dir / "memories.json"
        self.life_events_file = self.data_dir / "life_events.json"
        self.knowledge_file = self.data_dir / "knowledge.json"
        self.contributions_file = self.data_dir / "contributions.json"
        self.stats_file = self.data_dir / "stats.json"

        self._lock = asyncio.Lock()
        self._init_storage()

    def _read_json(self, path: Path, default: Any) -> Any:
        if not path.exists():
            return default
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading {path}: {e}")
            return default

    def _write_json(self, path: Path, data: Any):
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Error writing to {path}: {e}")

    def _init_storage(self):
        if not self.stats_file.exists():
            initial_stats = {
                "avatarName": "Setu Avatar",
                "role": "AI Knowledge Bridge",
                "createdAt": datetime.now(timezone.utc).isoformat(),
                "totalInteractions": 0,
                "totalMemories": 0,
                "totalKnowledgeLearned": 0,
                "milestones": [
                    "Awakened as Setu AI Knowledge Bridge",
                    "Ready to preserve traditional & generational human wisdom"
                ]
            }
            self._write_json(self.stats_file, initial_stats)

        if not self.life_events_file.exists():
            created_event = {
                "id": str(uuid.uuid4()),
                "type": LifeEventType.AVATAR_CREATED.value,
                "description": "Setu Avatar was born as a persistent AI character dedicated to preserving human and traditional knowledge.",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "source": "system",
                "importance": 1.0,
                "metadata": {"version": "2.0"}
            }
            self._write_json(self.life_events_file, [created_event])

    # ----------------- Conversations & Messages -----------------

    async def get_or_create_conversation(self, conversation_id: Optional[str], user_id: str = "guest_user") -> Conversation:
        async with self._lock:
            convs = self._read_json(self.conversations_file, {})
            cid = conversation_id or f"conv_{user_id}_{datetime.now(timezone.utc).strftime('%Y%m%d')}"
            
            if cid in convs:
                return Conversation(**convs[cid])

            new_conv = Conversation(
                id=cid,
                userId=user_id,
                messages=[],
                createdAt=datetime.now(timezone.utc).isoformat(),
                updatedAt=datetime.now(timezone.utc).isoformat()
            )
            convs[cid] = new_conv.model_dump()
            self._write_json(self.conversations_file, convs)
            return new_conv

    async def add_message(self, conversation_id: str, role: str, content: str, user_id: str = "guest_user") -> Message:
        async with self._lock:
            convs = self._read_json(self.conversations_file, {})
            if conversation_id not in convs:
                convs[conversation_id] = Conversation(
                    id=conversation_id,
                    userId=user_id,
                    messages=[],
                    createdAt=datetime.now(timezone.utc).isoformat(),
                    updatedAt=datetime.now(timezone.utc).isoformat()
                ).model_dump()

            msg = Message(
                id=str(uuid.uuid4()),
                role=role,
                content=content,
                timestamp=datetime.now(timezone.utc).isoformat()
            )
            convs[conversation_id]["messages"].append(msg.model_dump())
            convs[conversation_id]["updatedAt"] = datetime.now(timezone.utc).isoformat()
            self._write_json(self.conversations_file, convs)
            return msg

    async def get_recent_messages(self, conversation_id: str, limit: int = 6) -> List[Message]:
        convs = self._read_json(self.conversations_file, {})
        if conversation_id in convs:
            msgs = convs[conversation_id].get("messages", [])
            return [Message(**m) for m in msgs[-limit:]]
        return []

    # ----------------- Memory Management -----------------

    async def get_user_memories(self, user_id: str, min_importance: float = 0.0) -> List[MemoryItem]:
        all_memories = self._read_json(self.memories_file, [])
        user_mems = [
            MemoryItem(**m) for m in all_memories
            if (m.get("userId") == user_id or m.get("userId") == "global") and m.get("importance", 0.5) >= min_importance
        ]
        return user_mems

    async def add_memory(
        self,
        user_id: str,
        type: MemoryType,
        summary: str,
        importance: float = 0.8,
        source: str = "user_conversation"
    ) -> MemoryItem:
        async with self._lock:
            all_memories = self._read_json(self.memories_file, [])
            
            # Check for duplicate / near-identical existing memory
            for m in all_memories:
                if m.get("userId") == user_id and m.get("summary", "").lower() == summary.strip().lower():
                    m["lastAccessedAt"] = datetime.now(timezone.utc).isoformat()
                    m["accessCount"] = m.get("accessCount", 0) + 1
                    m["importance"] = max(m.get("importance", 0.5), importance)
                    self._write_json(self.memories_file, all_memories)
                    return MemoryItem(**m)

            new_mem = MemoryItem(
                id=f"mem_{uuid.uuid4().hex[:10]}",
                userId=user_id,
                type=type,
                summary=summary.strip(),
                importance=importance,
                source=source,
                createdAt=datetime.now(timezone.utc).isoformat(),
                lastAccessedAt=datetime.now(timezone.utc).isoformat(),
                accessCount=1
            )
            all_memories.append(new_mem.model_dump())
            self._write_json(self.memories_file, all_memories)

            # Update stats
            await self._update_memory_count(len(all_memories))
            return new_mem

    async def delete_memory(self, memory_id: str, user_id: Optional[str] = None) -> bool:
        async with self._lock:
            all_memories = self._read_json(self.memories_file, [])
            before_len = len(all_memories)
            filtered = [
                m for m in all_memories
                if not (m.get("id") == memory_id and (user_id is None or m.get("userId") == user_id))
            ]
            if len(filtered) < before_len:
                self._write_json(self.memories_file, filtered)
                await self._update_memory_count(len(filtered))
                return True
            return False

    async def clear_user_memories(self, user_id: str) -> int:
        async with self._lock:
            all_memories = self._read_json(self.memories_file, [])
            kept = [m for m in all_memories if m.get("userId") != user_id]
            removed = len(all_memories) - len(kept)
            self._write_json(self.memories_file, kept)
            await self._update_memory_count(len(kept))
            return removed

    # ----------------- Life Cycle & Events -----------------

    async def add_life_event(
        self,
        event_type: LifeEventType,
        description: str,
        importance: float = 0.8,
        metadata: Optional[Dict[str, Any]] = None,
        source: str = "conversation"
    ) -> LifeEventItem:
        async with self._lock:
            events = self._read_json(self.life_events_file, [])
            new_event = LifeEventItem(
                id=f"evt_{uuid.uuid4().hex[:10]}",
                type=event_type,
                description=description,
                timestamp=datetime.now(timezone.utc).isoformat(),
                source=source,
                importance=importance,
                metadata=metadata or {}
            )
            events.append(new_event.model_dump())
            self._write_json(self.life_events_file, events)

            # Check for milestones
            stats = self._read_json(self.stats_file, {})
            if len(events) % 10 == 0:
                stats.setdefault("milestones", []).append(f"Recorded {len(events)} major life experiences")
                self._write_json(self.stats_file, stats)

            return new_event

    async def get_life_events(self, limit: int = 30) -> List[LifeEventItem]:
        events = self._read_json(self.life_events_file, [])
        return [LifeEventItem(**e) for e in reversed(events[-limit:])]

    # ----------------- Knowledge Preservation -----------------

    async def save_knowledge_item(self, item: KnowledgeItem) -> KnowledgeItem:
        async with self._lock:
            knowledge_list = self._read_json(self.knowledge_file, [])
            # Update if exists
            updated = False
            for idx, k in enumerate(knowledge_list):
                if k.get("documentId") == item.documentId or k.get("id") == item.id:
                    knowledge_list[idx] = item.model_dump()
                    updated = True
                    break
            if not updated:
                knowledge_list.append(item.model_dump())

            self._write_json(self.knowledge_file, knowledge_list)

            # Update stats
            stats = self._read_json(self.stats_file, {})
            stats["totalKnowledgeLearned"] = len(knowledge_list)
            self._write_json(self.stats_file, stats)
            return item

    async def get_all_knowledge_items(self) -> List[KnowledgeItem]:
        knowledge_list = self._read_json(self.knowledge_file, [])
        return [KnowledgeItem(**k) for k in knowledge_list]

    async def save_knowledge_contribution(self, contrib: KnowledgeContribution) -> KnowledgeContribution:
        async with self._lock:
            contributions = self._read_json(self.contributions_file, [])
            contributions.append(contrib.model_dump())
            self._write_json(self.contributions_file, contributions)
            return contrib

    async def get_knowledge_contributions(self, user_id: Optional[str] = None) -> List[KnowledgeContribution]:
        contributions = self._read_json(self.contributions_file, [])
        if user_id:
            return [KnowledgeContribution(**c) for c in contributions if c.get("userId") == user_id]
        return [KnowledgeContribution(**c) for c in contributions]

    # ----------------- Stats & Metrics -----------------

    async def record_interaction(self, user_id: str):
        async with self._lock:
            stats = self._read_json(self.stats_file, {})
            count = stats.get("totalInteractions", 0) + 1
            stats["totalInteractions"] = count

            if count == 1:
                stats.setdefault("milestones", []).append("First human conversation completed")
                self._write_json(self.stats_file, stats)
                # Release lock before calling add_life_event to prevent deadlock
                pass
            elif count == 10:
                stats.setdefault("milestones", []).append("10th conversation milestone reached")
                self._write_json(self.stats_file, stats)
            elif count == 50:
                stats.setdefault("milestones", []).append("50th conversation milestone reached")
                self._write_json(self.stats_file, stats)
            elif count == 100:
                stats.setdefault("milestones", []).append("100th conversation milestone reached")
                self._write_json(self.stats_file, stats)
            else:
                self._write_json(self.stats_file, stats)

    async def get_avatar_stats(self) -> Dict[str, Any]:
        stats = self._read_json(self.stats_file, {})
        created_str = stats.get("createdAt", datetime.now(timezone.utc).isoformat())
        try:
            created_dt = datetime.fromisoformat(created_str)
            age_days = (datetime.now(timezone.utc) - created_dt).days
        except Exception:
            age_days = 1

        memories = self._read_json(self.memories_file, [])
        knowledge = self._read_json(self.knowledge_file, [])
        convs = self._read_json(self.conversations_file, {})
        unique_users = len(set(c.get("userId", "guest") for c in convs.values()))

        return {
            "avatarName": stats.get("avatarName", "Setu Avatar"),
            "role": stats.get("role", "AI Knowledge Bridge"),
            "createdAt": created_str,
            "ageDays": max(1, age_days),
            "totalInteractions": stats.get("totalInteractions", 0),
            "totalMemories": len(memories),
            "totalKnowledgeLearned": len(knowledge),
            "totalMilestones": len(stats.get("milestones", [])),
            "milestones": stats.get("milestones", []),
            "activeUsersCount": max(1, unique_users)
        }

    async def _update_memory_count(self, count: int):
        stats = self._read_json(self.stats_file, {})
        stats["totalMemories"] = count
        self._write_json(self.stats_file, stats)


# Global singleton storage instance
storage_service = StorageService()
