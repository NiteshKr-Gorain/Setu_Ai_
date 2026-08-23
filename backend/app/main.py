import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection, get_database
from app.routers import auth, users, knowledge, search, mentors, verification, learning_paths, communities, ai, avatar, admin, passport, presence, rfid
from app.services.rag_service import rag_service

# Configure basic logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Avatar Knowledge Base & Vector Store
    try:
        await rag_service.initialize()
        logger.info("Avatar Knowledge Base & Vector Store initialized successfully.")
    except Exception as rag_err:
        logger.warning(f"Avatar RAG initialization notice: {rag_err}")

    # Setup database connection
    connect_to_mongo()
    db = get_database()
    try:
        # Ping MongoDB to verify connection
        await db.command("ping")
        logger.info("Successfully connected and pinged MongoDB!")
        
        # Create MongoDB text index if it doesn't exist
        index_name = await db["knowledge_entries"].create_index(
            [
                ("title", "text"),
                ("description", "text"),
                ("transcript", "text"),
                ("summary", "text")
            ],
            name="knowledge_entries_text_index"
        )
        logger.info(f"MongoDB text index verified/created: {index_name}")
        
        # Create Mentor indexes safely
        try:
            await db["mentor_profiles"].create_index("user_id", unique=True, name="unique_mentor_user_id")
            await db["mentor_profiles"].create_index("expertise_categories", name="mentor_expertise_index")
            await db["mentor_profiles"].create_index("years_of_experience", name="mentor_experience_index")
            logger.info("Mentor profile indexes verified/created.")
        except Exception as idx_err:
            logger.warning(f"Non-critical: mentor_profiles index creation encountered an issue: {idx_err}")

        try:
            await db["mentor_requests"].create_index("learner_id", name="request_learner_id_index")
            await db["mentor_requests"].create_index("mentor_id", name="request_mentor_id_index")
            await db["mentor_requests"].create_index("status", name="request_status_index")
            await db["mentor_requests"].create_index("created_at", name="request_created_at_index")
            await db["mentor_requests"].create_index(
                [("learner_id", 1), ("mentor_id", 1)],
                unique=True,
                partialFilterExpression={"status": "pending"},
                name="unique_pending_request_index"
            )
            logger.info("Mentor request indexes verified/created.")
        except Exception as idx_err:
            logger.warning(f"Non-critical: mentor_requests index creation encountered an issue: {idx_err}")
            
        # Create Verification indexes safely
        try:
            await db["knowledge_verifications"].create_index(
                [("entry_id", 1), ("reviewer_id", 1)],
                unique=True,
                name="unique_entry_reviewer_verification"
            )
            await db["knowledge_verifications"].create_index(
                [("entry_id", 1), ("created_at", -1)],
                name="entry_created_at_verification"
            )
            await db["knowledge_verifications"].create_index(
                [("entry_id", 1), ("trust_level", 1)],
                name="entry_trust_level_verification"
            )
            logger.info("Verification indexes verified/created.")
        except Exception as idx_err:
            logger.warning(f"Non-critical: knowledge_verifications index creation encountered an issue: {idx_err}")
            
        # Create Learning Path indexes safely
        try:
            await db["learning_paths"].create_index("creator_id", name="learning_path_creator_id_index")
            await db["learning_paths"].create_index("category", name="learning_path_category_index")
            await db["learning_paths"].create_index("created_at", name="learning_path_created_at_index")
            logger.info("Learning path indexes verified/created.")
        except Exception as idx_err:
            logger.warning(f"Non-critical: learning_paths index creation encountered an issue: {idx_err}")
            
        # Create Communities indexes safely
        try:
            await db["communities"].create_index("admin_id", name="community_admin_id_index")
            await db["communities"].create_index("category", name="community_category_index")
            await db["communities"].create_index("visibility", name="community_visibility_index")
            await db["communities"].create_index("created_at", name="community_created_at_index")
            await db["communities"].create_index("members", name="community_members_index")
            logger.info("Community indexes verified/created.")
        except Exception as idx_err:
            logger.warning(f"Non-critical: communities index creation encountered an issue: {idx_err}")

        # Create Passport, Versions & Audit indexes
        try:
            await db["knowledge_entries"].create_index(
                "passport_id",
                unique=True,
                partialFilterExpression={"passport_id": {"$exists": True}},
                name="unique_passport_id"
            )
            await db["knowledge_versions"].create_index(
                [("entry_id", 1), ("version_number", 1)],
                unique=True,
                name="unique_entry_version"
            )
            await db["knowledge_versions"].create_index(
                [("entry_id", 1), ("content_hash", 1)],
                name="entry_hash_index"
            )
            await db["knowledge_audit_trail"].create_index(
                [("entry_id", 1), ("created_at", 1)],
                name="entry_timeline_index"
            )
            logger.info("Passport and Version ledger indexes verified/created.")
        except Exception as idx_err:
            logger.warning(f"Non-critical: passport indexes creation encountered an issue: {idx_err}")
        
        # Create RFID & Smart Card indexes
        try:
            await db["rfid_tags"].create_index(
                "tag_uid",
                unique=True,
                name="unique_rfid_tag_uid"
            )
            await db["rfid_tags"].create_index("user_id", name="rfid_user_id_index")
            await db["rfid_tags"].create_index("entry_id", name="rfid_entry_id_index")
            await db["rfid_tags"].create_index("tag_type", name="rfid_tag_type_index")
            await db["rfid_scan_logs"].create_index([("timestamp", -1)], name="rfid_scan_logs_timestamp")
            await db["rfid_scan_logs"].create_index("tag_uid", name="rfid_scan_logs_tag_uid")
            logger.info("RFID Smart Card and Artifact indexes verified/created.")
        except Exception as idx_err:
            logger.warning(f"Non-critical: rfid indexes creation encountered an issue: {idx_err}")

        # Atlas Vector Search index reminder
        if settings.USE_ATLAS_VECTOR_SEARCH:
            logger.warning(
                f"Atlas Vector Search is enabled. Ensure the configured vector index '{settings.ATLAS_VECTOR_INDEX_NAME}' "
                "exists manually in MongoDB Atlas before using semantic search."
            )
    except Exception as e:
        logger.critical(f"Database setup or connection ping failed: {e}")
        
    yield
    
    # Clean up and close connection
    close_mongo_connection()

app = FastAPI(
    title="Knowledge Preservation Platform API",
    description="Backend API for the Knowledge Preservation Platform (Phase 2)",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS origins (allow local dev + any deployed frontend origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Bearer tokens in Authorization header do not require cookies/credentials
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(knowledge.router)
app.include_router(search.router)
app.include_router(mentors.router)
app.include_router(verification.router)
app.include_router(learning_paths.router)
app.include_router(communities.router)
app.include_router(ai.router)
app.include_router(avatar.router)
app.include_router(passport.router)
app.include_router(admin.router)
app.include_router(presence.router)
app.include_router(rfid.router)




@app.get("/health", tags=["health"])
async def health_check():
    """
    Perform a health check on the application.
    """
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)


