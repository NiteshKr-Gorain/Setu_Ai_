import os
import json
import logging
import asyncio
from typing import Optional
from anthropic import AsyncAnthropic, RateLimitError, APITimeoutError, APIConnectionError, InternalServerError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.config import settings

logger = logging.getLogger(__name__)

class SummarizationError(Exception):
    pass

def _build_system_prompt(category: str) -> str:
    category_context = ""
    normalized = category.lower() if category else "general"
    
    if "healthcare" in normalized:
        category_context = (
            "The content belongs to the Healthcare category. "
            "Preserve safety considerations. Avoid giving unsupported medical conclusions. "
            "Highlight precautions, clinical safety, patient care protocols, and real-world procedures."
        )
    elif "agriculture" in normalized:
        category_context = (
            "The content belongs to the Agriculture category. "
            "Highlight practical field conditions, timing, environmental constraints, crop/soil methods, and farming operations."
        )
    elif "engineering" in normalized:
        category_context = (
            "The content belongs to the Engineering category. "
            "Highlight troubleshooting, maintenance, safety protocols, design decisions, and operational lessons."
        )
    elif "education" in normalized:
        category_context = (
            "The content belongs to the Education category. "
            "Highlight teaching methods, student outcomes, learning challenges, and practical classroom strategies."
        )
    elif "business" in normalized:
        category_context = (
            "The content belongs to the Business category. "
            "Highlight decisions, risks, customer lessons, operations, and financial implications."
        )
    elif "technology" in normalized:
        category_context = (
            "The content belongs to the Technology category. "
            "Highlight implementation lessons, software architecture, debugging, limitations, and maintainability."
        )
    else:
        category_context = (
            "The content belongs to the General/other category. "
            "Focus on preserving valuable lessons, warnings, decisions, and practical steps."
        )

    system_prompt = (
        "You are a knowledge-preservation assistant. Your goal is to summarize practical experience accurately.\n"
        "Preserve important warnings, procedures, decisions, and lessons. Avoid inventing facts.\n"
        f"Category Context: {category_context}\n\n"
        "Guidelines:\n"
        "1. Produce a concise summary of exactly 2 to 4 sentences.\n"
        "2. Extract exactly 3 to 6 distinct practical key insights.\n"
        "3. Each key insight must:\n"
        "   - Be useful and specific.\n"
        "   - Contain a complete thought.\n"
        "   - Avoid repeating the summary.\n"
        "   - Avoid duplicate insights.\n"
        "   - Avoid vague statements such as 'knowledge is important.'\n"
        "   - Be grounded only in the supplied source text.\n"
        "4. Return ONLY valid JSON. Return no markdown. Return no code fences. Return no introductory sentence.\n"
        "5. The JSON structure MUST be exactly:\n"
        "{\n"
        "  \"summary\": \"string\",\n"
        "  \"key_insights\": [\"string\"]\n"
        "}"
    )
    return system_prompt

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((
        RateLimitError,
        APITimeoutError,
        APIConnectionError,
        InternalServerError
    )),
    reraise=True
)
async def _call_anthropic_api(client: AsyncAnthropic, system_prompt: str, user_prompt: str) -> str:
    response = await client.messages.create(
        model=settings.SUMMARIZATION_MODEL,
        max_tokens=1000,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}]
    )
    if not response.content:
        raise SummarizationError("Empty response content from Anthropic API.")
    
    text_content = ""
    for block in response.content:
        if getattr(block, "type", None) == "text" and hasattr(block, "text"):
            text_content += block.text
        elif isinstance(block, str):
            text_content += block
    return text_content

def _clean_json_string(raw_str: str) -> str:
    cleaned = raw_str.strip()
    
    # Strip markdown code fences if present
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
        
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
        
    return cleaned.strip()

async def summarize_content(text: str, category: Optional[str]) -> dict:
    """
    Summarize content and extract key insights using Anthropic Claude.
    """
    # 1. Input Validation
    if not isinstance(text, str):
        raise SummarizationError("Input text must be a string.")
        
    stripped_text = text.strip()
    if not stripped_text:
        raise SummarizationError("Input text cannot be empty or whitespace only.")
        
    # Normalize category safely for prompt context
    normalized_category = category.strip() if (category and isinstance(category, str)) else "General"
    if not normalized_category:
        normalized_category = "General"
        
    # 2. Long Text Handling (truncation)
    if len(stripped_text) > 15000:
        logger.warning(f"Input text length ({len(stripped_text)}) exceeded 15,000 character limit. Truncating.")
        # TODO: Implement hierarchical or chunked summarization in a future phase.
        stripped_text = stripped_text[:15000] + "\n\n[Content truncated because it exceeded the current summarization limit.]"
        
    # Initialize AsyncAnthropic client
    api_key = settings.ANTHROPIC_API_KEY
    if not api_key:
        raise SummarizationError("Anthropic API key is not configured.")
        
    client = AsyncAnthropic(api_key=api_key)
    system_prompt = _build_system_prompt(normalized_category)
    
    try:
        raw_response = await _call_anthropic_api(client, system_prompt, stripped_text)
    except Exception as e:
        logger.error(f"Anthropic API call failed after retries: {str(e)}", exc_info=True)
        raise SummarizationError("AI summarization could not be completed. Please try again later.")
        
    # 3. JSON Parsing (Defensive)
    cleaned_response = _clean_json_string(raw_response)
    try:
        parsed_data = json.loads(cleaned_response)
    except Exception as parse_err:
        # Log the raw model response server-side (ensuring we do not expose API keys)
        logger.error(f"Failed to parse JSON response from Claude: {parse_err}. Raw response: {raw_response}")
        raise SummarizationError("AI summarization could not be completed. Please try again later.")
        
    # 4. Validate Parsed Output
    if not isinstance(parsed_data, dict):
        logger.error(f"Parsed response is not a JSON object: {parsed_data}")
        raise SummarizationError("AI summarization could not be completed. Please try again later.")
        
    summary = parsed_data.get("summary")
    if not summary or not isinstance(summary, str) or not summary.strip():
        logger.error("Parsed response is missing 'summary' field or it is empty.")
        raise SummarizationError("AI summarization could not be completed. Please try again later.")
        
    raw_insights = parsed_data.get("key_insights")
    if raw_insights is None or not isinstance(raw_insights, list):
        logger.error("Parsed response is missing 'key_insights' field or it is not a list.")
        raise SummarizationError("AI summarization could not be completed. Please try again later.")
        
    # Clean and validate insights
    cleaned_insights = []
    seen = set()
    for item in raw_insights:
        if isinstance(item, str) and item.strip():
            val = item.strip()
            if val not in seen:
                seen.add(val)
                cleaned_insights.append(val)
                
    if not cleaned_insights:
        logger.error("No valid non-empty insights found after cleaning.")
        raise SummarizationError("AI summarization could not be completed. Please try again later.")
        
    # Cap to maximum of 6 insights
    if len(cleaned_insights) > 6:
        cleaned_insights = cleaned_insights[:6]
        
    return {
        "summary": summary.strip(),
        "key_insights": cleaned_insights
    }
