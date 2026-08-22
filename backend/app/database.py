import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None

db = Database()

def connect_to_mongo():
    """Create MongoDB database connection client."""
    logger.info("Connecting to MongoDB...")
    db.client = AsyncIOMotorClient(settings.MONGO_URI)

def close_mongo_connection():
    """Close MongoDB database connection client."""
    if db.client:
        logger.info("Closing MongoDB connection...")
        db.client.close()

def get_database():
    """FastAPI Dependency for obtaining the MongoDB database instance."""
    if db.client is None:
        raise RuntimeError("Database connection not established.")
    return db.client[settings.MONGO_DB_NAME]

def get_optional_database():
    """FastAPI Dependency for obtaining MongoDB database or None if offline."""
    if db.client is None:
        return None
    try:
        return db.client[settings.MONGO_DB_NAME]
    except Exception:
        return None

