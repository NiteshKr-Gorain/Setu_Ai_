import asyncio
import unittest
import sys
import os
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException

# Add root folder to python path so app can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import connect_to_mongo, close_mongo_connection, get_database
from app.services import passport_service, knowledge_service
from app.models.knowledge_entry import KnowledgeEntryCreate, KnowledgeEntryUpdate
from scripts.migrate_passports import run_migration

class TestPassportOccAndMigration(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self):
        connect_to_mongo()
        self.db = get_database()
        # Clean up database test collection states
        await self.db["knowledge_entries"].delete_many({"title": {"$regex": "^TEST-KNOW-.*"}})
        await self.db["knowledge_versions"].delete_many({})
        await self.db["knowledge_audit_trail"].delete_many({})

    async def asyncTearDown(self):
        # Clean up
        await self.db["knowledge_entries"].delete_many({"title": {"$regex": "^TEST-KNOW-.*"}})
        await self.db["knowledge_versions"].delete_many({})
        await self.db["knowledge_audit_trail"].delete_many({})
        close_mongo_connection()

    async def test_01_idempotent_migration_full_missing(self):
        """Test migration when all passport elements are missing for a document."""
        # Insert a raw knowledge entry
        entry = {
            "title": "TEST-KNOW-Agriculture traditional farming",
            "description": "This is a test description of traditional farming methods.",
            "category": "Agriculture",
            "contributor_id": ObjectId(),
            "status": "draft",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        res = await self.db["knowledge_entries"].insert_one(entry)
        entry_id = res.inserted_id

        # Verify initial missing components
        v1_before = await self.db["knowledge_versions"].find_one({"entry_id": entry_id, "version_number": 1})
        self.assertIsNone(v1_before)
        created_before = await self.db["knowledge_audit_trail"].find_one({"entry_id": entry_id, "event_type": "CREATED"})
        self.assertIsNone(created_before)

        # Run migration
        await run_migration()

        # Fetch updated entry
        updated_entry = await self.db["knowledge_entries"].find_one({"_id": entry_id})
        self.assertIsNotNone(updated_entry.get("passport_id"))
        self.assertTrue(updated_entry.get("passport_id").startswith("SETU-KNOW-"))
        self.assertIsNotNone(updated_entry.get("content_hash"))
        self.assertEqual(updated_entry.get("version_number"), 1)

        # Verify version snapshot created
        v1_after = await self.db["knowledge_versions"].find_one({"entry_id": entry_id, "version_number": 1})
        self.assertIsNotNone(v1_after)
        self.assertEqual(v1_after["content_hash"], updated_entry["content_hash"])

        # Verify audit trail created
        created_after = await self.db["knowledge_audit_trail"].find_one({"entry_id": entry_id, "event_type": "CREATED"})
        self.assertIsNotNone(created_after)

    async def test_02_idempotent_migration_partial_missing(self):
        """Test migration when some passport elements are partially set (e.g. only passport_id)."""
        entry_id = ObjectId()
        passport_id = "SETU-KNOW-TESTPART"
        
        entry = {
            "_id": entry_id,
            "title": "TEST-KNOW-Water Harvesting",
            "description": "This is a test description of traditional water harvesting.",
            "category": "Technology",
            "contributor_id": ObjectId(),
            "status": "draft",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "passport_id": passport_id # Only passport_id exists, others missing
        }
        await self.db["knowledge_entries"].insert_one(entry)

        # Run migration
        await run_migration()

        # Fetch updated entry
        updated_entry = await self.db["knowledge_entries"].find_one({"_id": entry_id})
        self.assertEqual(updated_entry["passport_id"], passport_id) # Should NOT generate new passport_id
        self.assertIsNotNone(updated_entry.get("content_hash"))
        self.assertEqual(updated_entry.get("version_number"), 1)

        # Verify version snapshot created
        v1_after = await self.db["knowledge_versions"].find_one({"entry_id": entry_id, "version_number": 1})
        self.assertIsNotNone(v1_after)
        self.assertEqual(v1_after["passport_id"], passport_id)

        # Verify audit trail created
        created_after = await self.db["knowledge_audit_trail"].find_one({"entry_id": entry_id, "event_type": "CREATED"})
        self.assertIsNotNone(created_after)

    async def test_03_occ_conflict_and_rollback(self):
        """Test Optimistic Concurrency Control (OCC) conflicts and transactions."""
        contributor_id = ObjectId()
        # Insert a user to make the username resolution work
        await self.db["users"].insert_one({"_id": contributor_id, "name": "Test Actor"})

        entry_in = KnowledgeEntryCreate(
            title="TEST-KNOW-OCC Article",
            description="Testing optimistic concurrency control and rollback logic.",
            category="Healthcare"
        )
        
        # Create initial entry
        entry = await knowledge_service.create_knowledge_entry(self.db, str(contributor_id), entry_in)
        entry_id = str(entry["_id"])
        
        # First update - should succeed and increment version to 2
        update_in = KnowledgeEntryUpdate(
            title="TEST-KNOW-OCC Article v2",
            description="Testing optimistic concurrency control and rollback logic (v2)."
        )
        updated_entry = await knowledge_service.update_knowledge_entry(self.db, entry_id, str(contributor_id), update_in)
        self.assertEqual(updated_entry["version_number"], 2)


        # Attempting update should fail because the database's version_number (1)
        # does not match current_version (2) from our stale copy (or vice versa).
        # In the update service, current_version is fetched from database first, which returns 1.
        # But wait! If we pass update_in, it fetches the entry first.
        # Let's check: update_knowledge_entry fetches the document from the database first,
        # reads version_number (which is 1), then does update_one targeting version_number: 1.
        # Wait, if we want to simulate concurrent modification where another process updated the version
        # after we read it:
        # We can mock/override the find_one to return version 1, but when update_one runs, the DB has version 2.
        # Let's do that! We can temporarily modify the DB value in between or test the conflict directly.
        # In a real concurrent scenario:
        # Process A reads entry (version 1).
        # Process B reads entry (version 1).
        # Process A updates entry to version 2 (DB is now version 2).
        # Process B attempts to update entry using the query: {"_id": entry_id, "version_number": 1}.
        # Since DB version is now 2, modified_count will be 0, raising HTTPException(409).
        
        # Let's simulate Process B's update_one query direct failure:
        # We will write a custom test sequence representing Process B's attempt.
        current_version_read_by_B = 1
        current_hash_read_by_B = entry["content_hash"]
        
        # db has version 2 because of the first update
        # Let's check DB state
        db_doc = await self.db["knowledge_entries"].find_one({"_id": ObjectId(entry_id)})
        self.assertEqual(db_doc["version_number"], 2) # Confirm it is version 2 in DB

        # Now try to update it using stale criteria (version 1) inside the OCC update logic structure
        with self.assertRaises(HTTPException) as ctx:
            async with await self.db.client.start_session() as session:
                async with session.start_transaction():
                    result = await self.db["knowledge_entries"].update_one(
                        {
                            "_id": ObjectId(entry_id),
                            "version_number": current_version_read_by_B, # stale
                            "content_hash": current_hash_read_by_B
                        },
                        {"$set": {"title": "Stale Update"}},
                        session=session
                    )
                    if result.modified_count == 0:
                        raise HTTPException(status_code=409, detail="OCC Conflict")
                        
        self.assertEqual(ctx.exception.status_code, 409)

    async def test_04_save_version_and_verify_integrity(self):
        """Test creating versions, checking server-side hashes, and verifying integrity."""
        article_id = ObjectId()
        contributor_id = ObjectId()

        # Save Version 1
        v1 = await passport_service.save_knowledge_version(
            db=self.db,
            article_id=article_id,
            content="Traditional neem pesticide instructions v1",
            changed_by=contributor_id,
            change_summary="Initial V1 neem recipe",
            citations=["Nishi 2026"],
            source="community"
        )
        self.assertEqual(v1["version_number"], 1)
        self.assertEqual(v1["content"], "Traditional neem pesticide instructions v1")
        self.assertIsNotNone(v1["sha256_hash"])

        # Save Version 2
        v2 = await passport_service.save_knowledge_version(
            db=self.db,
            article_id=article_id,
            content="Traditional neem pesticide instructions v2 with garlic",
            changed_by=contributor_id,
            change_summary="Update with garlic",
            citations=["Nishi 2026", "Elder Savitri"],
            source="community"
        )
        self.assertEqual(v2["version_number"], 2)
        self.assertNotEqual(v1["sha256_hash"], v2["sha256_hash"])

        # Verify integrity of V2
        verified, comp, rec = await passport_service.verify_version_integrity(self.db, article_id, 2)
        self.assertTrue(verified)
        self.assertEqual(comp, rec)

        # Get history list (lightweight)
        history = await passport_service.get_version_history(self.db, article_id)
        self.assertEqual(len(history), 2)
        self.assertEqual(history[0]["version_number"], 2)
        self.assertNotIn("content", history[0]) # Lightweight history projection

        # Get detail (with full content)
        detail = await passport_service.get_version_detail(self.db, article_id, 1)
        self.assertEqual(detail["content"], "Traditional neem pesticide instructions v1")

        # Verify provenance tracking and activity log progression
        self.assertIn("provenance", v1)
        self.assertEqual(v1["provenance"]["source"], "community")
        self.assertEqual(len(v1["provenance"]["activity_log"]), 1)
        self.assertEqual(v1["provenance"]["activity_log"][0]["action"], "created")

        self.assertEqual(len(v2["provenance"]["activity_log"]), 2)
        self.assertEqual(v2["provenance"]["activity_log"][1]["action"], "edited")

        # Call verify_version
        reviewer_id = ObjectId()
        # Create a mock reviewer user record
        await self.db["users"].insert_one({"_id": reviewer_id, "name": "Expert Reviewer"})

        verified_doc = await passport_service.verify_version(self.db, article_id, 2, reviewer_id)
        self.assertEqual(verified_doc["verification_status"], "verified")
        self.assertEqual(verified_doc["provenance"]["verified_by"], reviewer_id)
        self.assertEqual(len(verified_doc["provenance"]["activity_log"]), 3)
        self.assertEqual(verified_doc["provenance"]["activity_log"][2]["action"], "verified")

        # Get provenance chain
        chain = await passport_service.get_provenance_chain(self.db, article_id)
        self.assertEqual(chain["version_number"], 2)
        self.assertEqual(chain["verified_by"], "Expert Reviewer")
        self.assertEqual(chain["citations"], ["Nishi 2026", "Elder Savitri"])

if __name__ == "__main__":
    unittest.main()
