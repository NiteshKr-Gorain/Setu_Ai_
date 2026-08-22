"""
OpenRouter Client Module for SETU Backend.
Provides unified, resilient access to LLMs via OpenRouter's OpenAI-compatible API
with automatic retry-with-backoff, token usage parsing, streaming support, and model tier routing.
"""
import os
import json
import asyncio
import logging
from typing import List, Dict, Any, Optional, Tuple, AsyncGenerator
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

# Base OpenRouter Chat Endpoint
OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions"

# Model tiers config dict mapping task types to OpenRouter model slugs
MODEL_TIERS = {
    "simple": "openai/gpt-4o-mini",          # cheap, high-volume tasks
    "reasoning": "anthropic/claude-sonnet-4", # complex reasoning, used sparingly
    "fallback": "meta-llama/llama-3.1-8b-instruct"  # cheapest fallback
}

class OpenRouterException(Exception):
    """Base exception for OpenRouter operations."""
    pass

class OpenRouterAuthError(OpenRouterException):
    """Raised when API key is invalid or unauthorized (HTTP 401/403)."""
    pass

class OpenRouterRateLimitError(OpenRouterException):
    """Raised when rate limits are exceeded (HTTP 429) after exhausted retries."""
    pass

class OpenRouterAPIError(OpenRouterException):
    """Raised for server or downstream API failures."""
    def __init__(self, message: str, status_code: Optional[int] = None, response_body: Optional[str] = None):
        super().__init__(message)
        self.status_code = status_code
        self.response_body = response_body

def get_model_for_tier(tier: str = "simple") -> str:
    """
    Returns the OpenRouter model slug corresponding to a requested task tier.
    Falls back to 'simple' tier if tier name is not recognized.
    """
    return MODEL_TIERS.get(str(tier).lower().strip(), MODEL_TIERS["simple"])

def _get_api_key(override_key: Optional[str] = None) -> str:
    """Retrieves and validates the active OpenRouter API key."""
    key = (override_key or getattr(settings, "OPENROUTER_API_KEY", "") or os.getenv("OPENROUTER_API_KEY", "")).strip()
    if not key:
        raise OpenRouterAuthError("OPENROUTER_API_KEY is not configured in settings or environment.")
    return key

def _build_headers(api_key: str) -> Dict[str, str]:
    """Constructs required headers for OpenRouter requests."""
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://setu.ai",
        "X-Title": "SETU Knowledge Preservation Platform"
    }

async def call_openrouter(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    max_tokens: int = 500,
    temperature: float = 0.3,
    api_key: Optional[str] = None,
    client: Optional[httpx.AsyncClient] = None,
    max_retries: int = 3,
    initial_backoff: float = 0.5,
    timeout: float = 60.0
) -> Tuple[str, Dict[str, int]]:
    """
    Executes an OpenAI-compatible completion request to OpenRouter.
    
    Args:
        messages: List of chat message dicts (e.g. [{"role": "user", "content": "..."}])
        model: OpenRouter model slug (defaults to MODEL_TIERS["simple"])
        max_tokens: Maximum tokens in generated completion
        temperature: Sampling temperature
        api_key: Optional API key override
        client: Optional pre-configured httpx.AsyncClient
        max_retries: Maximum retry attempts for transient 5xx/429 errors
        initial_backoff: Initial delay in seconds before exponential backoff
        timeout: Request timeout in seconds
        
    Returns:
        Tuple of (assistant_text, usage_dict) where usage_dict has:
        {"prompt_tokens": int, "completion_tokens": int, "total_tokens": int}
        
    Raises:
        OpenRouterAuthError: When API key is missing or invalid (HTTP 401)
        OpenRouterRateLimitError: When rate limit is exceeded (HTTP 429) after retries
        OpenRouterAPIError: On other non-transient API errors or exhausted retries
    """
    effective_key = _get_api_key(api_key)
    effective_model = model or MODEL_TIERS["simple"]
    headers = _build_headers(effective_key)

    payload = {
        "model": effective_model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": False
    }

    should_close_client = False
    if client is None:
        client = httpx.AsyncClient(timeout=timeout)
        should_close_client = True

    try:
        last_exception = None
        for attempt in range(1, max_retries + 1):
            try:
                response = await client.post(
                    OPENROUTER_CHAT_URL,
                    json=payload,
                    headers=headers
                )

                # Handle 401 Unauthorized immediately without retry
                if response.status_code == 401:
                    logger.error("OpenRouter authentication failed (401 Unauthorized).")
                    raise OpenRouterAuthError("Invalid or unauthorized OpenRouter API key.")

                # Handle 429 Rate Limit
                if response.status_code == 429:
                    retry_after = float(response.headers.get("Retry-After", initial_backoff * (2 ** (attempt - 1))))
                    logger.warning(
                        f"OpenRouter rate limit hit (429). Attempt {attempt}/{max_retries}. Backing off {retry_after}s..."
                    )
                    if attempt == max_retries:
                        raise OpenRouterRateLimitError(
                            f"OpenRouter rate limit exceeded after {max_retries} attempts: {response.text}"
                        )
                    await asyncio.sleep(retry_after)
                    continue

                # Handle 5xx Server Errors (Transient)
                if response.status_code >= 500:
                    backoff = initial_backoff * (2 ** (attempt - 1))
                    logger.warning(
                        f"OpenRouter server error ({response.status_code}). Attempt {attempt}/{max_retries}. Retrying in {backoff}s..."
                    )
                    if attempt == max_retries:
                        raise OpenRouterAPIError(
                            f"OpenRouter 5xx error after {max_retries} attempts: {response.text}",
                            status_code=response.status_code,
                            response_body=response.text
                        )
                    await asyncio.sleep(backoff)
                    continue

                # Handle other 4xx client errors
                if 400 <= response.status_code < 500:
                    raise OpenRouterAPIError(
                        f"OpenRouter client error ({response.status_code}): {response.text}",
                        status_code=response.status_code,
                        response_body=response.text
                    )

                # Success case: Parse response JSON
                data = response.json()
                choices = data.get("choices", [])
                if not choices:
                    raise OpenRouterAPIError("OpenRouter returned empty choices in response payload.")

                content = choices[0].get("message", {}).get("content", "")
                raw_usage = data.get("usage", {})
                usage = {
                    "prompt_tokens": int(raw_usage.get("prompt_tokens", 0)),
                    "completion_tokens": int(raw_usage.get("completion_tokens", 0)),
                    "total_tokens": int(raw_usage.get("total_tokens", 0))
                }

                return content, usage

            except (httpx.NetworkError, httpx.TimeoutException) as net_err:
                last_exception = net_err
                backoff = initial_backoff * (2 ** (attempt - 1))
                logger.warning(
                    f"OpenRouter network/timeout error ({net_err}). Attempt {attempt}/{max_retries}. Retrying in {backoff}s..."
                )
                if attempt == max_retries:
                    raise OpenRouterAPIError(
                        f"OpenRouter network connection failed after {max_retries} attempts: {net_err}"
                    )
                await asyncio.sleep(backoff)

        if last_exception:
            raise OpenRouterAPIError(f"OpenRouter request failed: {last_exception}")
        raise OpenRouterAPIError("OpenRouter call failed after maximum retries.")

    finally:
        if should_close_client:
            await client.aclose()

async def call_openrouter_stream(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    max_tokens: int = 500,
    temperature: float = 0.3,
    api_key: Optional[str] = None,
    client: Optional[httpx.AsyncClient] = None,
    timeout: float = 60.0
) -> AsyncGenerator[str, None]:
    """
    Streams completion text chunks from OpenRouter as an asynchronous generator.
    
    Yields:
        str: Text delta chunks as they arrive from the stream.
    """
    effective_key = _get_api_key(api_key)
    effective_model = model or MODEL_TIERS["simple"]
    headers = _build_headers(effective_key)

    payload = {
        "model": effective_model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": True
    }

    should_close_client = False
    if client is None:
        client = httpx.AsyncClient(timeout=timeout)
        should_close_client = True

    try:
        async with client.stream(
            "POST",
            OPENROUTER_CHAT_URL,
            json=payload,
            headers=headers
        ) as response:
            if response.status_code == 401:
                raise OpenRouterAuthError("Invalid or unauthorized OpenRouter API key.")
            if response.status_code == 429:
                raise OpenRouterRateLimitError("OpenRouter rate limit exceeded on stream.")
            if response.status_code != 200:
                body = await response.aread()
                raise OpenRouterAPIError(
                    f"OpenRouter streaming failed with status {response.status_code}: {body.decode(errors='ignore')}",
                    status_code=response.status_code
                )

            async for line in response.aiter_lines():
                if not line or not line.startswith("data:"):
                    continue
                data_str = line[len("data:"):].strip()
                if data_str == "[DONE]":
                    break
                try:
                    chunk = json.loads(data_str)
                    delta = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                    if delta:
                        yield delta
                except json.JSONDecodeError:
                    continue
    finally:
        if should_close_client:
            await client.aclose()
