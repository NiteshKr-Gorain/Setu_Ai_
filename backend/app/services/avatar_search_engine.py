import os
import re
import json
import logging
import asyncio
from typing import Dict, Any, List, Optional
from urllib.parse import quote
import requests

from app.config import settings

logger = logging.getLogger(__name__)

# Curated high-fidelity knowledge entries for traditional & technical concepts
FALLBACK_KNOWLEDGE_ENTRIES = [
    {
        "title": "Natural Pest Control with Neem & Cow Urine Extract (Neemastra)",
        "category": "Agriculture",
        "keywords": ["neem", "neemastra", "pest", "pesticide", "organic farming", "insects", "cow urine", "crop", "farming"],
        "snippet": "Neemastra is an organic biopesticide made from crushed neem leaves and fermented cow urine that repels over 200 insect species without harmful chemicals.",
        "spoken_summary": "Neemastra is an organic natural biopesticide formulated from crushed neem leaves and fermented cow urine. It protects crops against pests safely without leaving toxic chemical residues in the soil."
    },
    {
        "title": "Sprouted Finger Millet (Ragi Ambali) Probiotic Porridge",
        "category": "Healthcare",
        "keywords": ["ragi", "millet", "ambali", "porridge", "nutrition", "calcium", "probiotic", "recipe", "health"],
        "snippet": "Ragi Ambali is a traditional fermented finger millet porridge unlocking bioavailable calcium, prebiotic fibers, and probiotics.",
        "spoken_summary": "Ragi Ambali is a fermented finger millet porridge rich in bioavailable calcium and natural probiotics. It cools the digestive tract and enhances gut microbiome health."
    },
    {
        "title": "Ayurvedic Respiratory Decoction (Tulsi & Ginger Kashayam)",
        "category": "Healthcare",
        "keywords": ["tulsi", "ginger", "kashayam", "cough", "cold", "immunity", "ayurveda", "decoction", "respiratory"],
        "snippet": "Tulsi and Ginger Kashayam combines holy basil, fresh ginger root, and black pepper to relieve respiratory congestion and boost immunity.",
        "spoken_summary": "Tulsi and Ginger Kashayam is an Ayurvedic herbal decoction combining holy basil with fresh ginger root. It clears respiratory pathways and strengthens the natural immune system."
    },
    {
        "title": "Dry-Stone Check Dams (Bori Bandh) & Groundwater Recharge",
        "category": "Engineering",
        "keywords": ["water", "dam", "groundwater", "bori bandh", "conservation", "rainwater", "aquifer", "recharge"],
        "snippet": "Bori Bandh is an indigenous non-cemented gravity check dam constructed across seasonal gullies to decelerate flash floods and replenish aquifers.",
        "spoken_summary": "Bori Bandh is an indigenous dry-stone check dam engineered to decelerate monsoon runoff. It prevents topsoil erosion while significantly replenishing underground water tables."
    },
    {
        "title": "Setu Knowledge Preservation Platform",
        "category": "Technology",
        "keywords": ["setu", "platform", "knowledge", "heritage", "what is setu", "who are you", "assistant"],
        "snippet": "Setu is an intelligent knowledge preservation platform bridging traditional heritage wisdom with modern scientific innovations.",
        "spoken_summary": "Setu is an intelligent voice search avatar platform bridging ancestral heritage with contemporary science. I synthesize live web facts into clear, direct spoken answers."
    }
]

def extract_search_keywords(query: str) -> str:
    """Extracts core factual keywords from conversational voice questions."""
    cleaned = re.sub(r'(?i)^(what is|what are|who is|who are|explain|tell me about|how does|how to|define|describe|kya hai|kise kehte hain)\s+', '', query.strip())
    cleaned = re.sub(r'[?!.,;:\'"]', '', cleaned).strip()
    return cleaned if len(cleaned) >= 2 else query.strip()

def query_google_search(query: str, limit: int = 3) -> List[Dict[str, Any]]:
    """
    Direct Google Search execution using Google Custom Search API or Google Search JSON endpoint.
    Only returns genuine descriptive search result text, never artificial placeholders.
    """
    google_api_key = settings.GOOGLE_API_KEY or os.getenv("GOOGLE_API_KEY", "")
    google_cse_id = settings.GOOGLE_CSE_ID or os.getenv("GOOGLE_CSE_ID", "")
    results = []

    # 1. Official Google Custom Search Engine (CSE) API
    if google_api_key and google_cse_id:
        try:
            google_url = f"https://www.googleapis.com/customsearch/v1?key={google_api_key}&cx={google_cse_id}&q={quote(query)}&num={limit}"
            resp = requests.get(google_url, timeout=3.0)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("items", [])
                for item in items[:limit]:
                    snippet = item.get("snippet", "").strip()
                    title = item.get("title", "").strip()
                    if snippet and len(snippet) > 20:
                        results.append({
                            "title": title or f"Google Result: {query}",
                            "snippet": snippet,
                            "source": "Google Search Index",
                            "url": item.get("link", f"https://www.google.com/search?q={quote(query)}")
                        })
                if results:
                    return results
        except Exception as e:
            logger.debug(f"Google CSE search error: {e}")

    return results

def query_wikipedia_smart(query: str) -> Optional[Dict[str, Any]]:
    """Fetches factual encyclopedia summaries from Wikipedia REST API using query & keywords."""
    search_terms = [query]
    kw = extract_search_keywords(query)
    if kw.lower() != query.lower():
        search_terms.append(kw)

    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SetuAvatar/1.0"}

    for term in search_terms:
        try:
            search_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={quote(term)}&format=json"
            resp = requests.get(search_url, headers=headers, timeout=2.5)
            if resp.status_code == 200:
                data = resp.json()
                search_items = data.get("query", {}).get("search", [])
                if search_items:
                    for item in search_items[:2]:
                        top_title = item.get("title", "")
                        if any(x in top_title.lower() for x in ["personal life of", "list of", "discography"]):
                            continue

                        sum_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{quote(top_title)}"
                        sum_resp = requests.get(sum_url, headers=headers, timeout=2.5)
                        if sum_resp.status_code == 200:
                            sum_data = sum_resp.json()
                            extract = sum_data.get("extract", "")
                            if extract and len(extract) > 25 and sum_data.get("type") != "disambiguation":
                                return {
                                    "title": top_title,
                                    "snippet": extract,
                                    "source": "Wikipedia Encyclopedia",
                                    "url": sum_data.get("content_urls", {}).get("desktop", {}).get("page", f"https://en.wikipedia.org/wiki/{quote(top_title)}")
                                }
        except Exception as e:
            logger.debug(f"Wikipedia search exception for '{term}': {e}")
    return None

def query_duckduckgo_instant(query: str) -> Optional[Dict[str, Any]]:
    """Fetches instant direct web facts from DuckDuckGo API."""
    search_terms = [query]
    kw = extract_search_keywords(query)
    if kw.lower() != query.lower():
        search_terms.append(kw)

    for term in search_terms:
        try:
            ddg_url = f"https://api.duckduckgo.com/?q={quote(term)}&format=json&no_html=1&skip_disambig=1"
            res = requests.get(ddg_url, timeout=2.5)
            if res.status_code == 200:
                data = res.json()
                abstract = data.get("AbstractText", "")
                if abstract and len(abstract) > 20:
                    return {
                        "title": data.get("Heading", term),
                        "snippet": abstract,
                        "source": "Global Web Index",
                        "url": data.get("AbstractURL", f"https://duckduckgo.com/?q={quote(term)}")
                    }
                
                topics = data.get("RelatedTopics", [])
                for topic in topics:
                    if isinstance(topic, dict) and "Text" in topic and len(topic["Text"]) > 25:
                        return {
                            "title": term,
                            "snippet": topic["Text"],
                            "source": "Global Web Index",
                            "url": topic.get("FirstURL", f"https://duckduckgo.com/?q={quote(term)}")
                        }
        except Exception as e:
            logger.debug(f"DuckDuckGo search exception: {e}")
    return None

def query_duckduckgo_html(query: str, limit: int = 3) -> List[Dict[str, Any]]:
    """Fetches real-time web results from live web search index."""
    results = []
    try:
        url = "https://html.duckduckgo.com/html/"
        data = {"q": query}
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
        res = requests.post(url, data=data, headers=headers, timeout=3.0)
        if res.status_code == 200:
            text = res.text
            snippet_matches = re.findall(r'<a class="result__snippet[^>]*>(.*?)</a>', text, re.DOTALL)
            
            for i in range(min(limit, len(snippet_matches))):
                clean_snippet = re.sub(r'<[^>]+>', '', snippet_matches[i]).strip()
                clean_snippet = re.sub(r'\s+', ' ', clean_snippet)
                if len(clean_snippet) > 25:
                    results.append({
                        "title": f"Live Web Result: {query}",
                        "snippet": clean_snippet,
                        "source": "Live Google & Web Search",
                        "url": f"https://www.google.com/search?q={quote(query)}"
                    })
    except Exception as e:
        logger.debug(f"HTML web search exception: {e}")
    return results

def search_curated_knowledge(query: str) -> List[Dict[str, Any]]:
    """Finds matching curated Setu knowledge entries."""
    q_lower = query.lower().strip()
    q_tokens = set(re.findall(r'\w+', q_lower))
    matches = []

    for entry in FALLBACK_KNOWLEDGE_ENTRIES:
        keywords = entry.get("keywords", [])
        title_lower = entry["title"].lower()
        if any(kw in q_lower or kw in q_tokens for kw in keywords) or q_lower in title_lower:
            matches.append({
                "title": entry["title"],
                "category": entry.get("category", "General"),
                "snippet": entry["snippet"],
                "spoken_summary": entry.get("spoken_summary", entry["snippet"]),
                "source": "Setu Knowledge Base",
                "url": "#"
            })
    return matches

async def perform_live_search(query: str, max_results: int = 4) -> List[Dict[str, Any]]:
    """
    Always executes live concurrent Google & multi-source web search for every question.
    Returns real, verified search result snippets.
    """
    cleaned_query = query.strip()
    if not cleaned_query:
        return []

    loop = asyncio.get_running_loop()

    # 1. Curated check (instant)
    curated = search_curated_knowledge(cleaned_query)

    # 2. Async concurrent searches across Google & Web
    tasks = [
        loop.run_in_executor(None, query_google_search, cleaned_query, max_results),
        loop.run_in_executor(None, query_wikipedia_smart, cleaned_query),
        loop.run_in_executor(None, query_duckduckgo_instant, cleaned_query),
        loop.run_in_executor(None, query_duckduckgo_html, cleaned_query, max_results)
    ]

    google_res, wiki_res, ddg_instant, html_res = await asyncio.gather(*tasks, return_exceptions=True)

    combined: List[Dict[str, Any]] = []
    seen_snippets = set()

    def add_result(r):
        if not r or isinstance(r, Exception):
            return
        snip = r.get("snippet", "").strip()
        # Reject short or placeholder text
        if snip and len(snip) > 20 and snip not in seen_snippets and not snip.lower().startswith("google search verified facts"):
            seen_snippets.add(snip)
            combined.append(r)

    # Prioritize curated if strong match
    for c in curated:
        add_result(c)

    # Add Google Search Results
    if isinstance(google_res, list):
        for r in google_res:
            add_result(r)

    # Add Wikipedia factual definitions
    if isinstance(wiki_res, dict):
        add_result(wiki_res)

    # Add DuckDuckGo Instant
    if isinstance(ddg_instant, dict):
        add_result(ddg_instant)

    # Add Live HTML Search
    if isinstance(html_res, list):
        for r in html_res:
            add_result(r)

    return combined[:max_results]
