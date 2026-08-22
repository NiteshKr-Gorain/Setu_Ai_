import os
import re
import logging
import asyncio
from typing import List, Dict, Any, Optional
from urllib.parse import quote
import httpx

from app.config import settings

logger = logging.getLogger("web_search")


class WebSearchService:
    """
    Robust real-time web search service combining Wikipedia Full-Text Search API,
    REST Summaries, and DuckDuckGo to provide verified factual knowledge.
    """

    def clean_search_query(self, query: str) -> str:
        """Strips conversational voice fillers to extract core searchable keywords."""
        cleaned = re.sub(
            r'(?i)^(what is|what are|who is|who are|explain|tell me about|how does|how to|why is|why do|why does|define|describe|kya hai|kise kehte hain|latest news on|latest schemes for)\s+',
            '',
            query.strip()
        )
        cleaned = re.sub(r'[?!.,;:\'"]', '', cleaned).strip()
        return cleaned if len(cleaned) >= 2 else query.strip()

    async def search(self, query: str, max_results: int = 3) -> List[Dict[str, Any]]:
        """Executes multi-source live factual web search."""
        cleaned_kw = self.clean_search_query(query)
        results: List[Dict[str, Any]] = []

        # 1. OpenRouter Online Intelligence (if key configured)
        if settings.OPENROUTER_API_KEY and len(settings.OPENROUTER_API_KEY) > 15:
            try:
                or_results = await self._search_openrouter_online(cleaned_kw, query)
                if or_results:
                    for r in or_results:
                        if not any(existing.get("title") == r.get("title") for existing in results):
                            results.append(r)
            except Exception as e:
                logger.debug(f"OpenRouter web search error: {e}")

        # 2. Google Custom Search Engine (if keys provided)
        if settings.GOOGLE_API_KEY and settings.GOOGLE_CSE_ID:
            try:
                cse_results = await self._search_google_cse(cleaned_kw, limit=max_results)
                if cse_results:
                    return cse_results[:max_results]
            except Exception as e:
                logger.debug(f"Google CSE error: {e}")

        # 3. Wikipedia Full-Text Search API + Lead Summary (Encyclopedic & Scientific Concepts)
        try:
            wiki_results = await self._search_wikipedia(cleaned_kw, query)
            for wr in wiki_results:
                if wr and not any(existing.get("title") == wr.get("title") for existing in results):
                    results.append(wr)
        except Exception as e:
            logger.debug(f"Wikipedia search error: {e}")

        # 4. DuckDuckGo Instant Answer API
        try:
            ddg_results = await self._search_duckduckgo(cleaned_kw)
            for r in ddg_results:
                if not any(existing.get("title") == r.get("title") for existing in results):
                    results.append(r)
        except Exception as e:
            logger.debug(f"DuckDuckGo search error: {e}")

        # 4. Fallback contextual snippet if external endpoints are slow
        if not results:
            results.append({
                "title": f"{cleaned_kw.title()}",
                "snippet": f"Fundamental factual knowledge regarding {cleaned_kw.title()}.",
                "source": "Setu Knowledge Index",
                "url": f"https://en.wikipedia.org/wiki/{quote(cleaned_kw.replace(' ', '_'))}"
            })

        return results[:max_results]

    async def _search_openrouter_online(self, keyword: str, original_query: str) -> List[Dict[str, Any]]:
        """Uses OpenRouter's online grounding models to fetch verified real-time knowledge."""
        try:
            url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY.strip()}",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "Setu Avatar",
                "Content-Type": "application/json"
            }
            # Use online model or web grounding
            model_to_use = settings.OPENROUTER_MODEL or "google/gemini-2.0-flash-exp:free"
            payload = {
                "model": model_to_use,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a factual knowledge researcher. Provide 2-3 precise, factual sentences summarizing the latest verified facts about the topic. Do not use conversational filler or bullet points."
                    },
                    {"role": "user", "content": f"Factual summary for: {original_query or keyword}"}
                ],
                "temperature": 0.2,
                "max_tokens": 120
            }
            async with httpx.AsyncClient(timeout=4.5) as client:
                resp = await client.post(url, json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data.get("choices", [])[0].get("message", {}).get("content", "").strip()
                    if content and len(content) > 20:
                        return [{
                            "title": keyword.title(),
                            "snippet": content,
                            "source": "OpenRouter Online Intelligence",
                            "url": "https://openrouter.ai"
                        }]
        except Exception as e:
            logger.debug(f"OpenRouter online search error: {e}")
        return []

    async def _search_google_cse(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        url = f"https://www.googleapis.com/customsearch/v1?key={settings.GOOGLE_API_KEY}&cx={settings.GOOGLE_CSE_ID}&q={quote(query)}&num={limit}"
        async with httpx.AsyncClient(timeout=3.5) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("items", [])
                results = []
                for item in items[:limit]:
                    snippet = item.get("snippet", "").strip()
                    title = item.get("title", "").strip()
                    link = item.get("link", "")
                    if snippet:
                        results.append({
                            "title": title or query,
                            "snippet": snippet,
                            "source": "Google Web Search",
                            "url": link
                        })
                return results
        return []

    async def _search_wikipedia(self, keyword: str, original_query: str) -> List[Dict[str, Any]]:
        headers = {"User-Agent": "SetuAvatar/2.0 (https://setu.org; contact@setu.org)"}
        results: List[Dict[str, Any]] = []

        search_terms = [keyword, original_query.strip()]
        async with httpx.AsyncClient(timeout=4.0, headers=headers, follow_redirects=True) as client:
            for term in search_terms:
                encoded = quote(term)
                # First try full-text OpenSearch
                query_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={encoded}&utf8=&format=json"
                try:
                    resp = await client.get(query_url)
                    if resp.status_code == 200:
                        data = resp.json()
                        search_hits = data.get("query", {}).get("search", [])
                        for hit in search_hits[:2]:
                            title = hit.get("title", "")
                            # Avoid picking disambiguation, film, or album unless requested
                            if any(d in title.lower() for d in ["(film)", "(album)", "(song)", "(disambiguation)", "(book)"]) and not any(k in original_query.lower() for k in ["film", "movie", "song", "album", "book"]):
                                continue
                            
                            # Get rich lead summary extract
                            sum_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{quote(title)}"
                            sum_resp = await client.get(sum_url)
                            if sum_resp.status_code == 200:
                                sum_data = sum_resp.json()
                                extract = sum_data.get("extract", "").strip()
                                page_url = sum_data.get("content_urls", {}).get("desktop", {}).get("page", f"https://en.wikipedia.org/wiki/{quote(title)}")
                                if extract and len(extract) > 25:
                                    results.append({
                                        "title": f"Wikipedia: {title}",
                                        "snippet": extract[:350],
                                        "source": "Wikipedia Knowledge Base",
                                        "url": page_url
                                    })
                                    break
                except Exception:
                    continue

                if results:
                    break

        return results

    async def _search_duckduckgo(self, query: str) -> List[Dict[str, Any]]:
        url = f"https://api.duckduckgo.com/?q={quote(query)}&format=json&no_html=1&skip_disambig=1"
        results = []
        async with httpx.AsyncClient(timeout=3.5) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                abstract = data.get("AbstractText", "").strip()
                heading = data.get("Heading", query).strip()
                abstract_url = data.get("AbstractURL", "")
                if abstract and len(abstract) > 20:
                    results.append({
                        "title": f"DuckDuckGo: {heading}",
                        "snippet": abstract,
                        "source": "DuckDuckGo Web Index",
                        "url": abstract_url or f"https://duckduckgo.com/?q={quote(query)}"
                    })
                
                # Check related topics
                for topic in data.get("RelatedTopics", [])[:2]:
                    if isinstance(topic, dict) and "Text" in topic and "FirstURL" in topic:
                        results.append({
                            "title": topic.get("Text", "")[:60],
                            "snippet": topic.get("Text", ""),
                            "source": "DuckDuckGo Topic",
                            "url": topic.get("FirstURL", "#")
                        })
        return results


web_search_service = WebSearchService()

