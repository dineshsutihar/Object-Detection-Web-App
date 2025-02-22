import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

MONGO_URL = os.getenv("MONGODB_URL")
DB_NAME = os.getenv("MONGODB_DB_NAME", "yoloAppDb")
COLLECTION_NAME = os.getenv("MONGODB_COLLECTION_NAME", "historyLogs")

if not MONGO_URL:
    logger.error("MONGODB_URL environment variable not set!")
    client = None
    db = None
    collection = None
else:
    try:
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]
        logger.info(f"Connected to MongoDB: {DB_NAME}/{COLLECTION_NAME}")

         # Optional: Create index for faster querying by timestamp
        async def create_indexes():
            await collection.create_index([("timestamp", -1)])
            logger.info("Created timestamp index on history logs collection.")

    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}", exc_info=True)
        client = None
        db = None
        collection = None

async def log_event(event_data: dict):
    if not collection:
        logger.warning("MongoDB collection not available. Skipping log event.")
        return None

    try:
        event_data["timestamp"] = datetime.now(timezone.utc) # Add UTC timestamp
        result = await collection.insert_one(event_data)
        logger.info(f"Logged event to MongoDB with ID: {result.inserted_id}")
        return result.inserted_id
    except Exception as e:
        logger.error(f"Failed to log event to MongoDB: {e}", exc_info=True)
        return None

async def get_history_logs(limit: int = 50, skip: int = 0):
    if not collection:
        logger.warning("MongoDB collection not available. Cannot fetch history.")
        return []
    try:
        cursor = collection.find().sort("timestamp", -1).skip(skip).limit(limit)
        logs = await cursor.to_list(length=limit)
         # Convert ObjectId to string for JSON serialization
        for log in logs:
             if '_id' in log:
                 log['_id'] = str(log['_id'])
        logger.info(f"Fetched {len(logs)} history logs from MongoDB.")
        return logs
    except Exception as e:
        logger.error(f"Failed to fetch history logs from MongoDB: {e}", exc_info=True)
        return []
