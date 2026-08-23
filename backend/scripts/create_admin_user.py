import asyncio
import sys
import os
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database import connect_to_mongo, close_mongo_connection, get_database
from app.core.security import get_password_hash

async def create_admin():
    connect_to_mongo()
    db = get_database()
    email = "nitesh@gmail.com"
    plain_password = "123456n"
    hashed_pwd = get_password_hash(plain_password)
    
    existing = await db["users"].find_one({"email": email})
    if existing:
        print(f"User {email} exists. Updating to admin role and setting password...")
        await db["users"].update_one(
            {"email": email},
            {"$set": {
                "hashed_password": hashed_pwd,
                "role": "admin",
                "name": existing.get("name", "Nitesh"),
                "preferred_language": existing.get("preferred_language", "en"),
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        print("Updated user to admin successfully.")
    else:
        print(f"Creating new admin user: {email}...")
        admin_doc = {
            "name": "Nitesh",
            "email": email,
            "hashed_password": hashed_pwd,
            "role": "admin",
            "preferred_language": "en",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        res = await db["users"].insert_one(admin_doc)
        print(f"Admin user created with ID: {res.inserted_id}")
    
    user = await db["users"].find_one({"email": email})
    print("Verified User in DB:")
    print("ID:", str(user["_id"]))
    print("Name:", user.get("name"))
    print("Email:", user.get("email"))
    print("Role:", user.get("role"))
    
    close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(create_admin())
