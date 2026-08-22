"""
Unit Tests for Cost Tracking, Budget Protection, and Admin Usage Layer.
Covers:
  1. Named configuration constants
  2. MongoDB ai_usage_log persistence & get_monthly_spend aggregation
  3. Budget Guard thresholds (<80% normal, 80-100% warning, >=100% fallback degradation)
  4. Per-user daily request quota enforcement
  5. Admin telemetry summary endpoint & role protection
"""
import unittest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.services.cost_control_service import (
    MONTHLY_BUDGET_INR,
    BUDGET_WARNING_THRESHOLD_PCT,
    BUDGET_EXCEEDED_THRESHOLD_PCT,
    USER_DAILY_REQUEST_LIMIT,
    MODEL_PRICING,
    record_ai_usage,
    get_monthly_spend,
    check_user_daily_quota,
    check_budget_and_resolve_tier,
    get_admin_usage_summary,
    answer_query,
    clear_query_cache,
    reset_orchestrator_metrics,
    estimate_cost_inr
)
from app.core.dependencies import get_current_user
from app.database import get_database

class TestBudgetGuardAndCostTracking(unittest.IsolatedAsyncioTestCase):

    def setUp(self):
        clear_query_cache()
        reset_orchestrator_metrics()
        self.mock_user_id = "test-user-42"

    def tearDown(self):
        clear_query_cache()
        reset_orchestrator_metrics()
        app.dependency_overrides.clear()

    def test_named_constants_configuration(self):
        """Verify required budget, threshold, and quota constants are configured."""
        self.assertEqual(MONTHLY_BUDGET_INR, 1500.0)
        self.assertEqual(BUDGET_WARNING_THRESHOLD_PCT, 0.80)
        self.assertEqual(BUDGET_EXCEEDED_THRESHOLD_PCT, 1.00)
        self.assertEqual(USER_DAILY_REQUEST_LIMIT, 30)
        self.assertIn("openai/gpt-4o-mini", MODEL_PRICING)
        self.assertIn("anthropic/claude-sonnet-4", MODEL_PRICING)
        self.assertIn("meta-llama/llama-3.1-8b-instruct", MODEL_PRICING)

    def test_cost_estimation_calculation(self):
        """Test cost calculation in INR using MODEL_PRICING."""
        cost = estimate_cost_inr("openai/gpt-4o-mini", 1000, 1000)
        self.assertAlmostEqual(cost, 0.0645, places=4)

    async def test_record_ai_usage_and_monthly_spend_aggregation(self):
        """Test persisting AI usage document in MongoDB and summing monthly spend."""
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_collection.insert_one = AsyncMock()
        mock_db.__getitem__.return_value = mock_collection

        # Mock aggregation cursor
        mock_cursor = MagicMock()
        mock_cursor.to_list = AsyncMock(return_value=[{"_id": None, "total_spend": 245.50}])
        mock_collection.aggregate = MagicMock(return_value=mock_cursor)

        # 1. Record an AI usage entry
        doc = await record_ai_usage(
            user_id=self.mock_user_id,
            model="openai/gpt-4o-mini",
            prompt_tokens=500,
            completion_tokens=150,
            total_tokens=650,
            estimated_cost_inr=0.035,
            budget_status="normal",
            requested_tier="simple",
            executed_tier="simple",
            db=mock_db
        )

        self.assertEqual(doc["user_id"], self.mock_user_id)
        self.assertEqual(doc["prompt_tokens"], 500)
        self.assertEqual(doc["total_tokens"], 650)
        self.assertEqual(mock_collection.insert_one.call_count, 1)

        # 2. Query monthly spend
        spend = await get_monthly_spend(db=mock_db, month="2026-08")
        self.assertEqual(spend, 245.50)

    async def test_budget_guard_normal_state_under_80_percent(self):
        """Test spend < 80% (₹1200): proceed normally with requested tier."""
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_db.__getitem__.return_value = mock_collection
        mock_cursor = MagicMock()
        mock_cursor.to_list = AsyncMock(return_value=[{"_id": None, "total_spend": 600.0}])
        mock_collection.aggregate = MagicMock(return_value=mock_cursor)

        tier, status, meta = await check_budget_and_resolve_tier(
            user_id=self.mock_user_id,
            requested_tier="reasoning",
            db=mock_db
        )

        self.assertEqual(tier, "reasoning")
        self.assertEqual(status, "normal")
        self.assertEqual(meta["current_spend_inr"], 600.0)
        self.assertEqual(meta["remaining_budget_inr"], 900.0)
        self.assertEqual(meta["utilization_pct"], 40.0)

    async def test_budget_guard_warning_state_80_to_100_percent(self):
        """Test 80% <= spend < 100% (₹1200 - ₹1500): proceed with warning flag."""
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_db.__getitem__.return_value = mock_collection
        mock_cursor = MagicMock()
        mock_cursor.to_list = AsyncMock(return_value=[{"_id": None, "total_spend": 1350.0}])
        mock_collection.aggregate = MagicMock(return_value=mock_cursor)

        tier, status, meta = await check_budget_and_resolve_tier(
            user_id=self.mock_user_id,
            requested_tier="reasoning",
            db=mock_db
        )

        self.assertEqual(tier, "reasoning")
        self.assertEqual(status, "warning")
        self.assertEqual(meta["current_spend_inr"], 1350.0)
        self.assertEqual(meta["remaining_budget_inr"], 150.0)
        self.assertEqual(meta["utilization_pct"], 90.0)

    async def test_budget_guard_exceeded_state_degrades_to_fallback(self):
        """Test spend >= 100% (≥ ₹1500): block reasoning tier and degrade to fallback tier."""
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_db.__getitem__.return_value = mock_collection
        mock_cursor = MagicMock()
        mock_cursor.to_list = AsyncMock(return_value=[{"_id": None, "total_spend": 1580.0}])
        mock_collection.aggregate = MagicMock(return_value=mock_cursor)

        tier, status, meta = await check_budget_and_resolve_tier(
            user_id=self.mock_user_id,
            requested_tier="reasoning",
            db=mock_db
        )

        self.assertEqual(tier, "fallback")
        self.assertEqual(status, "budget_exceeded")
        self.assertEqual(meta["current_spend_inr"], 1580.0)
        self.assertEqual(meta["remaining_budget_inr"], 0.0)

    async def test_per_user_daily_quota_enforcement(self):
        """Test per-user daily request quota limits single user from exhausting budget."""
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_db.__getitem__.return_value = mock_collection

        # Under quota (10 requests made today)
        mock_collection.count_documents = AsyncMock(return_value=10)
        is_ok, count = await check_user_daily_quota(user_id=self.mock_user_id, db=mock_db)
        self.assertTrue(is_ok)
        self.assertEqual(count, 10)

        # At quota (30 requests made today)
        mock_collection.count_documents = AsyncMock(return_value=30)
        is_ok, count = await check_user_daily_quota(user_id=self.mock_user_id, db=mock_db)
        self.assertFalse(is_ok)
        self.assertEqual(count, 30)

        # When quota exceeded, answer_query returns quota limit warning without calling AI
        res = await answer_query(
            user_id=self.mock_user_id,
            query="Unseen question requiring AI escalation",
            db=mock_db,
            rag_threshold=0.99
        )
        self.assertEqual(res["source"], "quota_limit")
        self.assertEqual(res["budget_status"], "quota_exceeded")
        self.assertIn("Daily AI Request Limit Reached", res["answer"])

    async def test_admin_usage_summary_compilation(self):
        """Test get_admin_usage_summary telemetry compilation."""
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_db.__getitem__.return_value = mock_collection

        mock_cursor_spend = MagicMock()
        mock_cursor_spend.to_list = AsyncMock(return_value=[{"_id": None, "total_spend": 320.0}])

        mock_cursor_models = MagicMock()
        mock_cursor_models.to_list = AsyncMock(return_value=[
            {"_id": "openai/gpt-4o-mini", "count": 25},
            {"_id": "anthropic/claude-sonnet-4", "count": 4}
        ])

        mock_collection.aggregate = MagicMock(side_effect=[mock_cursor_spend, mock_cursor_models])

        summary = await get_admin_usage_summary(db=mock_db, month="2026-08")
        self.assertEqual(summary["monthly_budget_inr"], 1500.0)
        self.assertEqual(summary["current_month_spend_inr"], 320.0)
        self.assertEqual(summary["remaining_budget_inr"], 1180.0)
        self.assertEqual(summary["budget_status"], "normal")
        self.assertEqual(summary["request_count_by_model"]["openai/gpt-4o-mini"], 25)
        self.assertIn("telemetry", summary)

    def test_admin_endpoint_role_protection(self):
        """Test GET /api/admin/ai-usage role security guard."""
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_db.__getitem__.return_value = mock_collection

        mock_cursor_spend = MagicMock()
        mock_cursor_spend.to_list = AsyncMock(return_value=[{"_id": None, "total_spend": 100.0}])

        mock_cursor_models = MagicMock()
        mock_cursor_models.to_list = AsyncMock(return_value=[{"_id": "openai/gpt-4o-mini", "count": 5}])

        mock_collection.aggregate = MagicMock(side_effect=[mock_cursor_spend, mock_cursor_models])

        app.dependency_overrides[get_database] = lambda: mock_db
        client = TestClient(app)

        # 1. Non-admin user receives 403 Forbidden
        async def override_non_admin():
            return {"_id": "user1", "email": "user@test.com", "role": "learner"}

        app.dependency_overrides[get_current_user] = override_non_admin
        resp = client.get("/api/admin/ai-usage")
        self.assertEqual(resp.status_code, 403)

        # 2. Admin user receives 200 OK
        async def override_admin():
            return {"_id": "admin1", "email": "admin@setu.ai", "role": "admin"}

        app.dependency_overrides[get_current_user] = override_admin
        resp_admin = client.get("/api/admin/ai-usage")
        self.assertEqual(resp_admin.status_code, 200)
        data = resp_admin.json()
        self.assertEqual(data["monthly_budget_inr"], 1500.0)
        self.assertIn("remaining_budget_inr", data)
        self.assertIn("telemetry", data)

        app.dependency_overrides.clear()

if __name__ == "__main__":
    unittest.main()
