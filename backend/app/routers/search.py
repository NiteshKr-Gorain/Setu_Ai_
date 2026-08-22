from typing import List, Optional, Literal
from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_database
from app.models.knowledge_entry import KnowledgeEntryOut, CategoryType

router = APIRouter(prefix="/search", tags=["search"])

@router.get("", response_model=List[KnowledgeEntryOut])
async def search_entries(
    q: Optional[str] = Query(None, description="Search query string"),
    category: Optional[CategoryType] = Query(None, description="Filter by category"),
    content_type: Optional[Literal["text", "voice", "video", "document"]] = Query(None, description="Filter by content type"),
    skip: int = Query(0, ge=0, description="Skip entries for pagination"),
    limit: int = Query(20, ge=1, le=100, description="Limit result count"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Search knowledge entries.

    If query parameter 'q' is provided, performs a text search using MongoDB's $text
    operator and sorts the results by relevance (textScore).
    If 'q' is missing or empty, falls back to a standard filtered listing of entries.
    """
    if q and q.strip():
        # Text search logic
        query = {"$text": {"$search": q}}
        if category:
            query["category"] = category
        if content_type:
            query["content_type"] = content_type

        cursor = (
            db["knowledge_entries"]
            .find(query)
            .sort([("score", {"$meta": "textScore"})])
            .skip(skip)
            .limit(limit)
        )
        results = await cursor.to_list(length=limit)
    else:
        # Fallback logic for normal filtered query
        query = {}
        if category:
            query["category"] = category
        if content_type:
            query["content_type"] = content_type

        cursor = db["knowledge_entries"].find(query).skip(skip).limit(limit)
        results = await cursor.to_list(length=limit)

    return results

@router.get("/semantic")
async def search_semantic(
    q: str = Query(..., description="Search query string"),
    category: Optional[CategoryType] = Query(None, description="Filter by category"),
    limit: int = Query(10, ge=1, le=50, description="Limit result count"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Perform semantic search utilizing OpenAI embeddings.
    """
    import logging
    from fastapi import status, HTTPException
    from app.services.search_service import semantic_search
    from app.services.embedding_service import EmbeddingError

    logger = logging.getLogger(__name__)
    
    try:
        results = await semantic_search(db, query=q, category=category, limit=limit)
        return {
            "query": q,
            "search_type": "semantic",
            "count": len(results),
            "results": results
        }
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except EmbeddingError as emb_err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Embedding service is temporarily unavailable. Please try again later."
        )
    except Exception as e:
        logger.error(f"Semantic search failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Semantic search failed due to an internal error."
        )
