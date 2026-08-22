import asyncio
import logging
import numpy as np
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config import settings
from app.services.embedding_service import generate_embedding

logger = logging.getLogger(__name__)

def score_and_sort_candidates(candidates: List[Dict[str, Any]], query_embedding: List[float], limit: int) -> List[Dict[str, Any]]:
    """
    Compute cosine similarity for candidates using numpy in a background thread.
    Safely handles zero vectors, NaNs, infinities, and dimension mismatches.
    """
    query_vec = np.array(query_embedding, dtype=np.float32)
    query_norm = np.linalg.norm(query_vec)
    if query_norm == 0:
        return []
        
    scored_results = []
    for doc in candidates:
        emb = doc.get("embedding")
        if not emb or not isinstance(emb, list):
            continue
            
        try:
            doc_vec = np.array(emb, dtype=np.float32)
            if doc_vec.shape != query_vec.shape:
                continue  # Skip invalid dimensions
                
            doc_norm = np.linalg.norm(doc_vec)
            if doc_norm == 0:
                similarity = 0.0
            else:
                similarity = float(np.dot(query_vec, doc_vec) / (query_norm * doc_norm))
                
            if np.isnan(similarity) or np.isinf(similarity):
                similarity = 0.0
        except Exception as e:
            logger.warning(f"Error computing similarity for doc {doc.get('_id')}: {e}")
            continue  # Skip malformed documents
            
        # Prepare response document: drop embedding vector
        res_doc = {k: v for k, v in doc.items() if k != "embedding"}
        res_doc["id"] = str(res_doc["_id"])
        if "_id" in res_doc:
            del res_doc["_id"]
        if "contributor_id" in res_doc:
            res_doc["contributor_id"] = str(res_doc["contributor_id"])
            
        res_doc["semantic_score"] = round(similarity, 4)
        scored_results.append(res_doc)
        
    # Sort descending by score
    scored_results.sort(key=lambda x: x["semantic_score"], reverse=True)
    return scored_results[:limit]

async def semantic_search(
    db: AsyncIOMotorDatabase,
    query: str,
    category: Optional[str] = None,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Perform semantic search on completed knowledge entries.
    Falls back to keyword search if no embeddings exist yet.
    """
    # 1. Input Validation
    cleaned_query = query.strip() if query else ""
    if not cleaned_query:
        raise ValueError("Search query cannot be empty or whitespace only.")
        
    if limit < 1:
        limit = 1
    elif limit > 50:
        limit = 50
        
    # 2. Check for Keyword Fallback criteria
    # If no completed entries have embeddings in the database, fall back to keyword search
    has_embeddings_count = await db["knowledge_entries"].count_documents({
        "status": "completed",
        "embedding": {"$exists": True, "$ne": None}
    })
    
    if has_embeddings_count == 0:
        logger.info("No documents with embeddings found. Falling back to keyword search.")
        return await _keyword_search_fallback(db, cleaned_query, category, limit)
        
    # Generate query embedding
    query_embedding = await generate_embedding(cleaned_query)
    
    # 3. Atlas Vector Search Path
    if settings.USE_ATLAS_VECTOR_SEARCH:
        logger.info("Performing Atlas Vector Search...")
        # Reminder logged at startup.
        
        filter_doc = {"status": "completed"}
        if category:
            filter_doc["category"] = category
            
        vector_search_stage = {
            "$vectorSearch": {
                "index": settings.ATLAS_VECTOR_INDEX_NAME,
                "path": "embedding",
                "queryVector": query_embedding,
                "numCandidates": limit * 10,
                "limit": limit,
                "filter": filter_doc
            }
        }
        
        project_stage = {
            "$project": {
                "embedding": 0,
                "semantic_score": {"$meta": "vectorSearchScore"}
            }
        }
        
        pipeline = [vector_search_stage, project_stage]
        cursor = db["knowledge_entries"].aggregate(pipeline)
        raw_results = await cursor.to_list(length=limit)
        
        results = []
        for doc in raw_results:
            doc["id"] = str(doc["_id"])
            if "_id" in doc:
                del doc["_id"]
            if "contributor_id" in doc:
                doc["contributor_id"] = str(doc["contributor_id"])
            results.append(doc)
        return results
        
    # 4. Local Vector Search Path (Fallback)
    else:
        logger.info("Performing Local Cosine Similarity Search...")
        
        # Build filter
        filter_doc = {
            "status": "completed",
            "embedding": {"$exists": True, "$ne": None}
        }
        if category:
            filter_doc["category"] = category
            
        # Projection to load necessary fields and drop embedding if needed
        # We need embedding in candidates to score it, but project out others
        projection = {
            "embedding": 1,
            "title": 1,
            "summary": 1,
            "key_insights": 1,
            "category": 1,
            "content_type": 1,
            "contributor_id": 1,
            "created_at": 1,
            "updated_at": 1,
            "status": 1
        }
        
        cursor = (
            db["knowledge_entries"]
            .find(filter_doc, projection)
            .limit(settings.LOCAL_VECTOR_CANDIDATE_LIMIT)
        )
        candidates = await cursor.to_list(length=settings.LOCAL_VECTOR_CANDIDATE_LIMIT)
        
        # O(n) local fallback scoring and sorting in background thread
        results = await asyncio.to_thread(
            score_and_sort_candidates,
            candidates,
            query_embedding,
            limit
        )
        return results

async def _keyword_search_fallback(
    db: AsyncIOMotorDatabase,
    query: str,
    category: Optional[str],
    limit: int
) -> List[Dict[str, Any]]:
    """
    Keyword-search fallback based on MongoDB text index.
    """
    search_query = {"$text": {"$search": query}, "status": "completed"}
    if category:
        search_query["category"] = category
        
    projection = {
        "score": {"$meta": "textScore"},
        "title": 1,
        "summary": 1,
        "key_insights": 1,
        "category": 1,
        "content_type": 1,
        "contributor_id": 1,
        "created_at": 1,
        "updated_at": 1,
        "status": 1
    }
    
    cursor = (
        db["knowledge_entries"]
        .find(search_query, projection)
        .sort([("score", {"$meta": "textScore"})])
        .limit(limit)
    )
    raw_results = await cursor.to_list(length=limit)
    
    results = []
    for doc in raw_results:
        doc["id"] = str(doc["_id"])
        if "_id" in doc:
            del doc["_id"]
        if "contributor_id" in doc:
            doc["contributor_id"] = str(doc["contributor_id"])
            
        # Map text score to semantic_score for uniform structure
        doc["semantic_score"] = float(doc.get("score", 0.0))
        if "score" in doc:
            del doc["score"]
        results.append(doc)
        
    return results
