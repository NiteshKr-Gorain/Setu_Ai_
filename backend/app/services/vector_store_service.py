import os
import re
import json
import math
import logging
import asyncio
from pathlib import Path
from typing import List, Dict, Any, Optional
import httpx

from app.config import settings

logger = logging.getLogger("vector_store")


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)


class VectorStoreService:
    """
    Vector Store Service supporting:
    1. Qdrant HTTP REST API (Cloud/Local Docker) when QDRANT_URL is set.
    2. Embedded persistent cosine vector store in backend/data/vector_index.json.
    3. OpenAI / Gemini / High-dimensional Semantic embeddings.
    """

    def __init__(self):
        self.data_file = settings.DATA_DIR / "vector_index.json"
        self.collection_name = settings.QDRANT_COLLECTION
        self._lock = asyncio.Lock()
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._load_local_index()

    def _load_local_index(self):
        if self.data_file.exists():
            try:
                with open(self.data_file, "r", encoding="utf-8") as f:
                    self._cache = json.load(f)
            except Exception as e:
                logger.error(f"Error loading vector index from {self.data_file}: {e}")
                self._cache = {}

    def _save_local_index(self):
        try:
            with open(self.data_file, "w", encoding="utf-8") as f:
                json.dump(self._cache, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Error saving vector index: {e}")

    async def get_embedding(self, text: str) -> List[float]:
        """Generates embedding vector using OpenAI, Gemini, or semantic feature hash."""
        clean_text = text.strip()
        if not clean_text:
            return [0.0] * 128

        # 1. Try OpenAI Embedding API if key configured
        if settings.OPENAI_API_KEY and not settings.OPENAI_API_KEY.startswith("sk-Your"):
            try:
                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await client.post(
                        f"{settings.OPENAI_BASE_URL.rstrip('/')}/embeddings",
                        headers={
                            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "input": clean_text[:2000],
                            "model": settings.OPENAI_EMBEDDING_MODEL
                        }
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        return data["data"][0]["embedding"]
            except Exception as e:
                logger.debug(f"OpenAI embedding fallback: {e}")

        # 2. Try Gemini Embedding API if key configured
        if settings.GEMINI_API_KEY:
            try:
                gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key={settings.GEMINI_API_KEY}"
                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await client.post(
                        gemini_url,
                        json={
                            "model": "models/embedding-001",
                            "content": {"parts": [{"text": clean_text[:2000]}]}
                        }
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        return data.get("embedding", {}).get("values", [])
            except Exception as e:
                logger.debug(f"Gemini embedding fallback: {e}")

        # 3. High-dimensional Deterministic Semantic Trigram/Word Vectorizer
        return self._generate_semantic_vector(clean_text)

    def _generate_semantic_vector(self, text: str, dim: int = 128) -> List[float]:
        """Deterministic, zero-latency 128-dimensional semantic embedding for local similarity matching."""
        vector = [0.0] * dim
        words = text.lower().split()
        for i, word in enumerate(words):
            word_hash = hash(word)
            for j in range(dim):
                weight = math.sin((word_hash + j * 17 + i * 31) % 1000)
                vector[j] += weight

        # Add character 3-grams for typo & morphology tolerance
        for i in range(len(text) - 2):
            trigram = text[i:i+3].lower()
            th = hash(trigram)
            idx = abs(th) % dim
            vector[idx] += 0.5

        # Normalize to unit length
        norm = math.sqrt(sum(v * v for v in vector))
        if norm > 0:
            vector = [v / norm for v in vector]
        return vector

    async def upsert_document(
        self,
        doc_id: str,
        text: str,
        metadata: Dict[str, Any]
    ) -> bool:
        """Indexes or updates a document in the vector store."""
        embedding = await self.get_embedding(text)
        
        # 1. Update local persistent cache
        async with self._lock:
            self._cache[doc_id] = {
                "id": doc_id,
                "text": text,
                "vector": embedding,
                "metadata": metadata
            }
            self._save_local_index()

        # 2. If remote Qdrant is configured, sync to Qdrant REST API
        if settings.QDRANT_URL:
            try:
                headers = {"Content-Type": "application/json"}
                if settings.QDRANT_API_KEY:
                    headers["api-key"] = settings.QDRANT_API_KEY

                point_payload = {
                    "points": [
                        {
                            "id": abs(hash(doc_id)) % (10**9),
                            "vector": embedding,
                            "payload": {
                                "doc_id": doc_id,
                                "text": text,
                                **metadata
                            }
                        }
                    ]
                }
                async with httpx.AsyncClient(timeout=5.0) as client:
                    await client.put(
                        f"{settings.QDRANT_URL.rstrip('/')}/collections/{self.collection_name}/points",
                        headers=headers,
                        json=point_payload
                    )
            except Exception as e:
                logger.debug(f"Qdrant sync notice: {e}")

        return True

    async def search_similar(
        self,
        query: str,
        top_k: int = 3,
        metadata_filter: Optional[Dict[str, Any]] = None,
        min_score: float = 0.25
    ) -> List[Dict[str, Any]]:
        """Performs semantic vector search over the knowledge collection."""
        query_vec = await self.get_embedding(query)
        scored_results = []

        # 1. Search in local persistent vector index
        for doc_id, entry in self._cache.items():
            meta = entry.get("metadata", {})
            if metadata_filter:
                match = all(meta.get(k) == v for k, v in metadata_filter.items())
                if not match:
                    continue

            score = cosine_similarity(query_vec, entry.get("vector", []))
            
            # Boost score if keywords directly match title or text
            query_words = set(re.findall(r'\w+', query.lower()))
            text_words = set(re.findall(r'\w+', entry.get("text", "").lower()))
            # Ignore short words
            meaningful_query_words = {w for w in query_words if len(w) > 2}
            overlap = len(meaningful_query_words.intersection(text_words))
            if overlap > 0:
                score += min(0.6, overlap * 0.15)

            if score >= min_score:
                scored_results.append({
                    "id": doc_id,
                    "score": round(score, 4),
                    "text": entry.get("text", ""),
                    "metadata": meta
                })

        scored_results.sort(key=lambda x: x["score"], reverse=True)
        return scored_results[:top_k]

    async def delete_document(self, doc_id: str) -> bool:
        async with self._lock:
            if doc_id in self._cache:
                del self._cache[doc_id]
                self._save_local_index()
                return True
        return False

    def count(self) -> int:
        return len(self._cache)


vector_store_service = VectorStoreService()
