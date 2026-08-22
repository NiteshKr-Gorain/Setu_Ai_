"""
Unit Tests for Live User State, Heartbeats, Staleness Detection, and Real-Time Presence.
"""
import unittest
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.services.presence_service import (
    resolve_state,
    record_heartbeat,
    get_resolved_user_state,
    get_active_users,
    compute_freshness_string,
    presence_manager,
    STALE_THRESHOLD_SECONDS,
    IDLE_THRESHOLD_SECONDS,
    HEARTBEAT_INTERVAL_SECONDS
)
from app.core.dependencies import get_current_user
from app.database import get_database

class TestLiveUserState(unittest.IsolatedAsyncioTestCase):

    def setUp(self):
        self.mock_user_id = "user_abc_123"
        self.now = datetime(2026, 8, 22, 12, 0, 0, tzinfo=timezone.utc)

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_freshness_string_computation(self):
        """Test human-readable freshness string calculation."""
        self.assertEqual(compute_freshness_string(5), "just now")
        self.assertEqual(compute_freshness_string(25), "25 seconds ago")
        self.assertEqual(compute_freshness_string(120), "2 minutes ago")
        self.assertEqual(compute_freshness_string(7200), "2 hours ago")
        self.assertEqual(compute_freshness_string(172800), "2 days ago")

    def test_resolve_state_none_document(self):
        """Test resolving state for non-existent user."""
        res = resolve_state(None, now=self.now)
        self.assertEqual(res["status"], "offline")
        self.assertTrue(res["is_stale"])
        self.assertEqual(res["freshness"], "Never active")

    def test_resolve_state_active_within_threshold(self):
        """Test resolving state when heartbeat was 15s ago (active)."""
        doc = {
            "user_id": self.mock_user_id,
            "status": "active",
            "current_activity": "browsing_library",
            "current_resource": "article_456",
            "last_confirmed_at": self.now - timedelta(seconds=15)
        }
        res = resolve_state(doc, now=self.now)
        self.assertEqual(res["status"], "active")
        self.assertFalse(res["is_stale"])
        self.assertEqual(res["current_activity"], "browsing_library")
        self.assertEqual(res["freshness"], "15 seconds ago")

    def test_resolve_state_idle_transition(self):
        """Test resolving state when heartbeat was 60s ago (exceeds 45s idle threshold)."""
        doc = {
            "user_id": self.mock_user_id,
            "status": "active",
            "current_activity": "reading_passport",
            "last_confirmed_at": self.now - timedelta(seconds=60)
        }
        res = resolve_state(doc, now=self.now)
        self.assertEqual(res["status"], "idle")
        self.assertFalse(res["is_stale"])
        self.assertEqual(res["freshness"], "1 minute ago")

    def test_resolve_state_stale_overrides_to_offline(self):
        """Test resolving state when heartbeat was 100s ago (exceeds 90s stale threshold)."""
        # Stored status was 'active', but lack of heartbeat forces it to 'offline'
        doc = {
            "user_id": self.mock_user_id,
            "status": "active",
            "current_activity": "editing_knowledge",
            "last_confirmed_at": self.now - timedelta(seconds=100)
        }
        res = resolve_state(doc, now=self.now)
        self.assertEqual(res["status"], "offline")
        self.assertTrue(res["is_stale"])
        self.assertEqual(res["freshness"], "1 minute ago")

    async def test_record_heartbeat_mongodb_upsert(self):
        """Test updating MongoDB user_state and broadcasting state."""
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_collection.update_one = AsyncMock()
        
        updated_doc = {
            "user_id": self.mock_user_id,
            "status": "active",
            "current_activity": "chatting_with_ai",
            "current_resource": "Ayurveda Query",
            "session_id": "tab_xyz",
            "last_confirmed_at": datetime.now(timezone.utc)
        }
        mock_collection.find_one = AsyncMock(return_value=updated_doc)
        mock_db.__getitem__.return_value = mock_collection

        resolved = await record_heartbeat(
            db=mock_db,
            user_id=self.mock_user_id,
            status="active",
            current_activity="chatting_with_ai",
            current_resource="Ayurveda Query",
            session_id="tab_xyz"
        )

        self.assertEqual(mock_collection.update_one.call_count, 1)
        self.assertEqual(resolved["status"], "active")
        self.assertEqual(resolved["current_activity"], "chatting_with_ai")
        self.assertEqual(resolved["session_id"], "tab_xyz")

    async def test_get_active_users_filtering(self):
        """Test filtering active and idle users while excluding stale ones."""
        mock_db = MagicMock()
        mock_collection = MagicMock()
        
        recent_active = {
            "user_id": "u1",
            "status": "active",
            "last_confirmed_at": datetime.now(timezone.utc) - timedelta(seconds=10)
        }
        recent_idle = {
            "user_id": "u2",
            "status": "active",
            "last_confirmed_at": datetime.now(timezone.utc) - timedelta(seconds=50)
        }
        stale_user = {
            "user_id": "u3",
            "status": "active",
            "last_confirmed_at": datetime.now(timezone.utc) - timedelta(seconds=200)
        }

        mock_cursor = MagicMock()
        mock_cursor.to_list = AsyncMock(return_value=[recent_active, recent_idle, stale_user])
        mock_collection.find = MagicMock(return_value=MagicMock(sort=MagicMock(return_value=MagicMock(limit=MagicMock(return_value=mock_cursor)))))
        mock_db.__getitem__.return_value = mock_collection

        active_users = await get_active_users(mock_db)
        user_ids = [u["user_id"] for u in active_users]
        self.assertIn("u1", user_ids)
        self.assertIn("u2", user_ids)
        self.assertNotIn("u3", user_ids)  # Excluded because resolved to 'offline'

    def test_heartbeat_api_endpoint(self):
        """Test POST /api/state/heartbeat and GET /api/state/{user_id} endpoints."""
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_collection.update_one = AsyncMock()
        
        doc = {
            "user_id": self.mock_user_id,
            "status": "active",
            "current_activity": "viewing_passport",
            "current_resource": "SETU-KNOW-1234",
            "last_confirmed_at": datetime.now(timezone.utc)
        }
        mock_collection.find_one = AsyncMock(return_value=doc)
        mock_db.__getitem__.return_value = mock_collection

        app.dependency_overrides[get_database] = lambda: mock_db
        app.dependency_overrides[get_current_user] = lambda: {"_id": self.mock_user_id, "email": "test@setu.ai"}

        client = TestClient(app)

        # 1. Send Heartbeat
        res = client.post("/api/state/heartbeat", json={
            "status": "active",
            "current_activity": "viewing_passport",
            "current_resource": "SETU-KNOW-1234"
        })
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["success"])
        self.assertEqual(body["resolved_state"]["status"], "active")
        self.assertEqual(body["resolved_state"]["current_activity"], "viewing_passport")

        # 2. Get User Presence
        res_get = client.get(f"/api/state/{self.mock_user_id}")
        self.assertEqual(res_get.status_code, 200)
        data = res_get.json()
        self.assertEqual(data["user_id"], self.mock_user_id)
        self.assertEqual(data["status"], "active")
        self.assertIn("seconds_since_confirmed", data)

        app.dependency_overrides.clear()

if __name__ == "__main__":
    unittest.main()
