"""
Unit Tests for OpenRouter Client Module.
Covers success responses, 429 retry-with-backoff, 401 authorization failure, and usage parsing.
"""
import unittest
from unittest.mock import AsyncMock, patch, MagicMock
import httpx
from app.services.openrouter_client import (
    call_openrouter,
    get_model_for_tier,
    OpenRouterAuthError,
    OpenRouterRateLimitError,
    OpenRouterAPIError,
    MODEL_TIERS
)

class TestOpenRouterClient(unittest.IsolatedAsyncioTestCase):
    
    def setUp(self):
        self.mock_messages = [{"role": "user", "content": "Explain neem oil biopesticide."}]
        self.mock_api_key = "sk-or-v1-mock-test-key-12345"

    def test_model_tiers_mapping(self):
        """Test model tiers resolution helper."""
        self.assertEqual(get_model_for_tier("simple"), "openai/gpt-4o-mini")
        self.assertEqual(get_model_for_tier("reasoning"), "anthropic/claude-sonnet-4")
        self.assertEqual(get_model_for_tier("fallback"), "meta-llama/llama-3.1-8b-instruct")
        # Unknown tier defaults to simple
        self.assertEqual(get_model_for_tier("unknown_tier"), "openai/gpt-4o-mini")

    async def test_call_openrouter_success(self):
        """Test successful completion and usage dictionary parsing."""
        mock_response_json = {
            "id": "gen-12345",
            "choices": [
                {
                    "message": {
                        "role": "assistant",
                        "content": "Neem extract acts by disrupting insect growth hormone cycles."
                    }
                }
            ],
            "usage": {
                "prompt_tokens": 18,
                "completion_tokens": 12,
                "total_tokens": 30
            }
        }

        mock_resp = MagicMock(spec=httpx.Response)
        mock_resp.status_code = 200
        mock_resp.json.return_value = mock_response_json

        mock_client = AsyncMock(spec=httpx.AsyncClient)
        mock_client.post.return_value = mock_resp

        content, usage = await call_openrouter(
            messages=self.mock_messages,
            model=MODEL_TIERS["simple"],
            api_key=self.mock_api_key,
            client=mock_client
        )

        self.assertEqual(content, "Neem extract acts by disrupting insect growth hormone cycles.")
        self.assertEqual(usage["prompt_tokens"], 18)
        self.assertEqual(usage["completion_tokens"], 12)
        self.assertEqual(usage["total_tokens"], 30)
        self.assertEqual(mock_client.post.call_count, 1)

    async def test_call_openrouter_429_retry_success(self):
        """Test that transient 429 rate limit errors trigger backoff and retry successfully."""
        resp_429 = MagicMock(spec=httpx.Response)
        resp_429.status_code = 429
        resp_429.headers = {"Retry-After": "0.01"}
        resp_429.text = "Rate limit exceeded"

        resp_200 = MagicMock(spec=httpx.Response)
        resp_200.status_code = 200
        resp_200.json.return_value = {
            "choices": [{"message": {"content": "Success after backoff"}}],
            "usage": {"prompt_tokens": 5, "completion_tokens": 5, "total_tokens": 10}
        }

        mock_client = AsyncMock(spec=httpx.AsyncClient)
        # First 2 attempts return 429, 3rd returns 200
        mock_client.post.side_effect = [resp_429, resp_429, resp_200]

        with patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
            content, usage = await call_openrouter(
                messages=self.mock_messages,
                api_key=self.mock_api_key,
                client=mock_client,
                max_retries=3,
                initial_backoff=0.01
            )

        self.assertEqual(content, "Success after backoff")
        self.assertEqual(mock_client.post.call_count, 3)
        self.assertEqual(mock_sleep.call_count, 2)

    async def test_call_openrouter_429_exhausted_retries(self):
        """Test that exhausted 429 retries raise OpenRouterRateLimitError."""
        resp_429 = MagicMock(spec=httpx.Response)
        resp_429.status_code = 429
        resp_429.headers = {"Retry-After": "0.01"}
        resp_429.text = "Rate limit exceeded persistently"

        mock_client = AsyncMock(spec=httpx.AsyncClient)
        mock_client.post.return_value = resp_429

        with patch("asyncio.sleep", new_callable=AsyncMock):
            with self.assertRaises(OpenRouterRateLimitError):
                await call_openrouter(
                    messages=self.mock_messages,
                    api_key=self.mock_api_key,
                    client=mock_client,
                    max_retries=3,
                    initial_backoff=0.01
                )

        self.assertEqual(mock_client.post.call_count, 3)

    async def test_call_openrouter_401_failure_no_retries(self):
        """Test that a 401 Unauthorized raises OpenRouterAuthError immediately on first attempt."""
        resp_401 = MagicMock(spec=httpx.Response)
        resp_401.status_code = 401
        resp_401.text = "Invalid API Key"

        mock_client = AsyncMock(spec=httpx.AsyncClient)
        mock_client.post.return_value = resp_401

        with self.assertRaises(OpenRouterAuthError):
            await call_openrouter(
                messages=self.mock_messages,
                api_key="bad-invalid-key",
                client=mock_client,
                max_retries=3
            )

        # Ensure no wasteful retries occurred for auth errors
        self.assertEqual(mock_client.post.call_count, 1)

    async def test_call_openrouter_missing_api_key(self):
        """Test error when API key is completely missing in environment/arguments."""
        with patch("app.services.openrouter_client.settings.OPENROUTER_API_KEY", ""):
            with patch.dict("os.environ", {}, clear=True):
                with self.assertRaises(OpenRouterAuthError):
                    await call_openrouter(
                        messages=self.mock_messages,
                        api_key=""
                    )

    async def test_usage_parsing_with_missing_fields(self):
        """Test resilient usage parsing when usage dictionary has missing or null fields."""
        mock_response_json = {
            "choices": [{"message": {"content": "Test content"}}],
            "usage": {
                "total_tokens": "45"
            }
        }
        mock_resp = MagicMock(spec=httpx.Response)
        mock_resp.status_code = 200
        mock_resp.json.return_value = mock_response_json

        mock_client = AsyncMock(spec=httpx.AsyncClient)
        mock_client.post.return_value = mock_resp

        content, usage = await call_openrouter(
            messages=self.mock_messages,
            api_key=self.mock_api_key,
            client=mock_client
        )

        self.assertEqual(content, "Test content")
        self.assertEqual(usage["prompt_tokens"], 0)
        self.assertEqual(usage["completion_tokens"], 0)
        self.assertEqual(usage["total_tokens"], 45)

if __name__ == "__main__":
    unittest.main()
