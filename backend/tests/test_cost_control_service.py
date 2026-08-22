"""
Unit Tests for AI Cost-Control & Query Orchestrator Service.
Validates the full decision tree:
  1. Cache hit behavior & zero token usage
  2. FAISS MiniLM RAG grounding and citations
  3. Escalated OpenRouter AI execution with model tier selection
  4. Complexity heuristic classification
  5. Telemetry & cost metrics accounting
"""
import unittest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.cost_control_service import (
    answer_query,
    classify_query_complexity,
    get_cached_query,
    set_cached_query,
    clear_query_cache,
    get_orchestrator_metrics,
    reset_orchestrator_metrics,
    normalize_query_text
)

class TestCostControlOrchestrator(unittest.IsolatedAsyncioTestCase):

    def setUp(self):
        clear_query_cache()
        reset_orchestrator_metrics()

    def tearDown(self):
        clear_query_cache()
        reset_orchestrator_metrics()

    def test_normalize_query_and_cache_keys(self):
        """Test query string normalization and whitespace/punctuation handling."""
        q1 = "  What is Neemastra for crops???  "
        q2 = "what is neemastra for crops"
        self.assertEqual(normalize_query_text(q1), normalize_query_text(q2))

    def test_classify_query_complexity_heuristics(self):
        """Test tunable complexity heuristic function."""
        # Simple factual / lookup queries
        self.assertEqual(classify_query_complexity("What is ragi?"), "simple")
        self.assertEqual(classify_query_complexity("Remedy for cough"), "simple")

        # Queries with reasoning/mechanism trigger keywords
        self.assertEqual(classify_query_complexity("Why does ajwain relieve gas?"), "reasoning")
        self.assertEqual(classify_query_complexity("Explain scientifically how neem oil kills pests"), "reasoning")
        self.assertEqual(classify_query_complexity("Compare drip irrigation versus flood irrigation"), "reasoning")
        self.assertEqual(classify_query_complexity("What is the biochemical mechanism of turmeric?"), "reasoning")

        # Long analytical queries (> 25 words)
        long_query = (
            "I have been trying to cultivate organic black wheat across multiple seasons in heavy clay soil, "
            "but every monsoon the root zone gets waterlogged and leaves turn yellow, so what should I do?"
        )
        self.assertEqual(classify_query_complexity(long_query), "reasoning")

    async def test_decision_tree_rag_grounded_hit(self):
        """Test Step 2: Query matching FAISS knowledge base returns RAG-grounded answer."""
        query = "How to prepare Neemastra organic pest spray?"
        
        result = await answer_query(
            user_id="user-123",
            query=query,
            rag_threshold=0.40
        )

        self.assertEqual(result["source"], "rag")
        self.assertTrue(result["rag_grounded"])
        self.assertTrue(len(result["citations"]) > 0)
        self.assertIn("Neemastra", result["answer"])
        
        # Verify steps log contains cache miss followed by rag hit
        steps = [s["step"] for s in result["steps_log"]]
        self.assertIn("cache_check", steps)
        self.assertIn("rag_search", steps)
        self.assertIn("cache_store", steps)

        # Check metrics
        metrics = get_orchestrator_metrics()
        self.assertEqual(metrics["total_queries"], 1)
        self.assertEqual(metrics["rag_hits"], 1)
        self.assertEqual(metrics["cache_hits"], 0)
        self.assertEqual(metrics["ai_calls"], 0)

    async def test_decision_tree_cache_hit(self):
        """Test Step 1: Subsequent identical/normalized query hits in-memory cache directly."""
        query = "How to prepare Neemastra organic pest spray?"
        
        # Call 1: Populates cache via RAG
        res1 = await answer_query(user_id="user-123", query=query, rag_threshold=0.40)
        self.assertEqual(res1["source"], "rag")

        # Call 2: Must hit in-memory cache with 0 tokens
        res2 = await answer_query(user_id="user-456", query="  how to prepare neemastra organic pest spray?  ")
        self.assertEqual(res2["source"], "cache")
        self.assertEqual(res2["usage"]["total_tokens"], 0)
        self.assertEqual(res2["answer"], res1["answer"])
        
        # Verify step log
        cache_step = next(s for s in res2["steps_log"] if s["step"] == "cache_check")
        self.assertEqual(cache_step["status"], "hit")

        # Metrics verify 1 RAG hit and 1 Cache hit
        metrics = get_orchestrator_metrics()
        self.assertEqual(metrics["total_queries"], 2)
        self.assertEqual(metrics["cache_hits"], 1)
        self.assertEqual(metrics["rag_hits"], 1)
        self.assertEqual(metrics["cache_hit_percentage"], 50.0)

    @patch("app.services.cost_control_service.call_openrouter", new_callable=AsyncMock)
    async def test_decision_tree_ai_escalation_simple_tier(self, mock_call_openrouter):
        """Test Step 3: Unindexed simple query escalates to OpenRouter 'simple' tier."""
        mock_call_openrouter.return_value = (
            "Solar parabolic cookers concentrate sunlight using reflective curves.",
            {"prompt_tokens": 40, "completion_tokens": 15, "total_tokens": 55}
        )

        query = "Tell me about solar cookers."
        result = await answer_query(
            user_id="user-789",
            query=query,
            rag_threshold=0.99  # High threshold to ensure RAG miss
        )

        self.assertEqual(result["source"], "ai")
        self.assertEqual(result["model_tier"], "simple")
        self.assertEqual(result["model_used"], "openai/gpt-4o-mini")
        self.assertEqual(result["usage"]["total_tokens"], 55)
        self.assertIn("Solar parabolic cookers", result["answer"])
        self.assertEqual(mock_call_openrouter.call_count, 1)

        # Check metrics
        metrics = get_orchestrator_metrics()
        self.assertEqual(metrics["total_queries"], 1)
        self.assertEqual(metrics["ai_calls"], 1)
        self.assertEqual(metrics["ai_tiers"]["simple"], 1)

    @patch("app.services.cost_control_service.call_openrouter", new_callable=AsyncMock)
    async def test_decision_tree_ai_escalation_reasoning_tier(self, mock_call_openrouter):
        """Test Step 3: Unindexed complex query escalates to OpenRouter 'reasoning' tier."""
        mock_call_openrouter.return_value = (
            "The biochemical mechanism involves cellular disruption...",
            {"prompt_tokens": 70, "completion_tokens": 35, "total_tokens": 105}
        )

        query = "Explain scientifically the biochemical mechanism of microbial biodegradation in soil."
        result = await answer_query(
            user_id="user-101",
            query=query,
            rag_threshold=0.99
        )

        self.assertEqual(result["source"], "ai")
        self.assertEqual(result["model_tier"], "reasoning")
        self.assertEqual(result["model_used"], "anthropic/claude-sonnet-4")
        self.assertEqual(result["usage"]["total_tokens"], 105)
        self.assertEqual(mock_call_openrouter.call_count, 1)

        # Check metrics
        metrics = get_orchestrator_metrics()
        self.assertEqual(metrics["ai_tiers"]["reasoning"], 1)

if __name__ == "__main__":
    unittest.main()
