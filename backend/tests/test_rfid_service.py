"""
Automated Pytest Suite for RFID Smart Card & Physical Artifact Knowledge Tag System.
Tests:
  - RFID UID normalization & sanitization
  - Default demo cards seeding (Harbhajan, Sita Devi, Admin, Seeds, Pottery, Herbs)
  - Tap-to-Login: Passwordless user authentication & JWT token generation
  - Physical Knowledge Passport Tag: Instant artifact retrieval & passport verification
  - Unregistered tag detection & binding workflow
  - Tag-to-User binding & unbinding
  - Tag-to-Knowledge binding
  - Scan history logging & kiosk audit diagnostics
  - FastAPI TestClient REST endpoint verification
"""
import unittest
from datetime import datetime, timezone
from bson import ObjectId
from fastapi.testclient import TestClient

from app.database import connect_to_mongo, close_mongo_connection, get_database
from app.main import app
from app.models.rfid import RFIDScanIn, RFIDBindUserIn, RFIDBindKnowledgeIn
from app.services import rfid_service
from app.core.security import decode_token, create_access_token

class TestRFIDConceptAndServices(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self):
        connect_to_mongo()
        self.db = get_database()
        # Seed default RFID data for deterministic tests
        await rfid_service.seed_default_rfid_tags(self.db)

    async def asyncTearDown(self):
        # Clean up test-specific tags
        await self.db["rfid_tags"].delete_many({"tag_uid": {"$regex": "^TEST-.*"}})
        await self.db["rfid_scan_logs"].delete_many({"tag_uid": {"$regex": "^TEST-.*"}})
        close_mongo_connection()

    def test_01_tag_uid_normalization(self):
        """Test that RFID tag UIDs are cleanly stripped and uppercased."""
        self.assertEqual(rfid_service.normalize_tag_uid("  rfid-setu-123  "), "RFID-SETU-123")
        self.assertEqual(rfid_service.normalize_tag_uid("e28068900000"), "E28068900000")
        self.assertEqual(rfid_service.normalize_tag_uid(""), "")

    async def test_02_user_card_tap_to_login(self):
        """Test scanning a registered user's RFID smart card logs them in and returns tokens."""
        scan_in = RFIDScanIn(
            tag_uid="RFID-SETU-HARBHAJAN",
            device_id="kiosk-punjab-01",
            reader_type="usb_wedge"
        )
        res = await rfid_service.process_rfid_scan(self.db, scan_in)

        self.assertEqual(res.status, "authenticated")
        self.assertEqual(res.action, "login")
        self.assertEqual(res.tag_type, "user_card")
        self.assertIsNotNone(res.auth_data)
        self.assertEqual(res.auth_data.user.name, "Harbhajan Singh")
        self.assertEqual(res.auth_data.user.email, "harbhajan@setu.org")
        self.assertTrue(len(res.auth_data.access_token) > 20)
        self.assertTrue(len(res.auth_data.refresh_token) > 20)

        # Verify decoded JWT payload
        payload = decode_token(res.auth_data.access_token)
        self.assertIsNotNone(payload)
        self.assertEqual(payload.get("email"), "harbhajan@setu.org")

    async def test_03_knowledge_passport_tag_retrieval(self):
        """Test scanning a physical artifact tag returns the verified knowledge passport data."""
        scan_in = RFIDScanIn(
            tag_uid="RFID-KNOW-SEED-01",
            device_id="kiosk-rajasthan-02",
            reader_type="simulator"
        )
        res = await rfid_service.process_rfid_scan(self.db, scan_in)

        self.assertEqual(res.status, "knowledge_retrieved")
        self.assertEqual(res.action, "view_knowledge")
        self.assertEqual(res.tag_type, "knowledge_passport")
        self.assertIsNotNone(res.knowledge_data)
        self.assertIn("Ancestral Seed", res.knowledge_data.title)
        self.assertEqual(res.knowledge_data.category, "Agriculture")
        self.assertEqual(res.knowledge_data.passport_id, "SETU-PASS-SEED-01")
        self.assertEqual(res.knowledge_data.trust_score, 1.0)

    async def test_04_unregistered_tag_detection(self):
        """Test scanning an unknown/unregistered tag returns unregistered status and binding prompt."""
        scan_in = RFIDScanIn(
            tag_uid="TEST-UNREGISTERED-9999",
            device_id="kiosk-test-01"
        )
        res = await rfid_service.process_rfid_scan(self.db, scan_in)

        self.assertEqual(res.status, "unregistered")
        self.assertEqual(res.action, "bind_prompt")
        self.assertEqual(res.tag_uid, "TEST-UNREGISTERED-9999")
        self.assertIsNone(res.auth_data)
        self.assertIsNone(res.knowledge_data)

    async def test_05_bind_user_card_and_login(self):
        """Test dynamically binding a new RFID card to a user and logging in via tap."""
        test_user = await self.db["users"].find_one({"email": "harbhajan@setu.org"})
        self.assertIsNotNone(test_user)

        # Bind new card UID
        bind_in = RFIDBindUserIn(
            tag_uid="TEST-CUSTOM-CARD-777",
            label="Harbhajan's Pocket Keyfob"
        )
        tag_doc = await rfid_service.bind_user_card(
            self.db,
            user_id=str(test_user["_id"]),
            bind_in=bind_in
        )
        self.assertEqual(tag_doc["tag_uid"], "TEST-CUSTOM-CARD-777")
        self.assertEqual(tag_doc["tag_type"], "user_card")

        # Now test scanning this newly bound card
        scan_res = await rfid_service.process_rfid_scan(
            self.db,
            RFIDScanIn(tag_uid="TEST-CUSTOM-CARD-777")
        )
        self.assertEqual(scan_res.status, "authenticated")
        self.assertEqual(scan_res.auth_data.user.name, "Harbhajan Singh")

    async def test_06_bind_knowledge_artifact_tag(self):
        """Test dynamically binding a physical RFID tag to a knowledge entry."""
        entry = await self.db["knowledge_entries"].find_one({"category": "Traditional Knowledge"})
        if not entry:
            entry = await self.db["knowledge_entries"].find_one({})
        self.assertIsNotNone(entry)
        admin = await self.db["users"].find_one({"email": "nitesh@gmail.com"})

        bind_in = RFIDBindKnowledgeIn(
            tag_uid="TEST-ARTIFACT-POT-888",
            entry_id=str(entry["_id"]),
            label="Handcrafted Terracotta Specimen Tag"
        )
        tag_doc = await rfid_service.bind_knowledge_tag(
            self.db,
            user_id=str(admin["_id"]),
            bind_in=bind_in
        )
        self.assertEqual(tag_doc["tag_uid"], "TEST-ARTIFACT-POT-888")
        self.assertEqual(tag_doc["tag_type"], "knowledge_passport")

        # Scan and verify knowledge is retrieved
        scan_res = await rfid_service.process_rfid_scan(
            self.db,
            RFIDScanIn(tag_uid="TEST-ARTIFACT-POT-888")
        )
        self.assertEqual(scan_res.status, "knowledge_retrieved")
        self.assertEqual(scan_res.knowledge_data.title, entry["title"])

    async def test_07_scan_history_logging(self):
        """Test that every scan event is logged in rfid_scan_logs."""
        tag_uid = "TEST-LOG-SCAN-123"
        await rfid_service.process_rfid_scan(
            self.db,
            RFIDScanIn(tag_uid=tag_uid, device_id="kiosk-diagnostic-01")
        )

        logs = await rfid_service.get_rfid_scan_history(self.db, limit=20)
        found = any(l.get("tag_uid") == tag_uid for l in logs)
        self.assertTrue(found, "Scan log was not recorded in rfid_scan_logs collection.")

    async def test_08_delete_rfid_tag(self):
        """Test unbinding and removing an RFID tag."""
        admin = await self.db["users"].find_one({"email": "nitesh@gmail.com"})
        bind_in = RFIDBindUserIn(
            tag_uid="TEST-DELETE-TAG-999",
            label="Temporary Card"
        )
        await rfid_service.bind_user_card(self.db, str(admin["_id"]), bind_in)

        # Delete tag
        deleted = await rfid_service.delete_rfid_tag(
            self.db,
            tag_uid="TEST-DELETE-TAG-999",
            user_id=str(admin["_id"]),
            is_admin=True
        )
        self.assertTrue(deleted)

        # Check that scanning now returns unregistered
        scan_res = await rfid_service.process_rfid_scan(
            self.db,
            RFIDScanIn(tag_uid="TEST-DELETE-TAG-999")
        )
        self.assertEqual(scan_res.status, "unregistered")

    def test_09_fastapi_rfid_rest_endpoints(self):
        """Test the REST API endpoints (/api/rfid/scan and /api/rfid/seed) using TestClient."""
        with TestClient(app) as client:
            # 1. Seed endpoint
            seed_res = client.post("/api/rfid/seed")
            self.assertEqual(seed_res.status_code, 200)
            self.assertTrue(seed_res.json().get("success"))

            # 2. Public Scan endpoint (User tap)
            scan_user = client.post("/api/rfid/scan", json={
                "tag_uid": "RFID-SETU-HARBHAJAN",
                "device_id": "kiosk-test",
                "reader_type": "simulator"
            })
            self.assertEqual(scan_user.status_code, 200)
            data = scan_user.json()
            self.assertEqual(data["status"], "authenticated")
            self.assertEqual(data["action"], "login")
            self.assertIn("Harbhajan Singh", data["auth_data"]["user"]["name"])

            # 3. Public Scan endpoint (Knowledge tap)
            scan_know = client.post("/api/rfid/scan", json={
                "tag_uid": "RFID-KNOW-SEED-01",
                "device_id": "kiosk-test"
            })
            self.assertEqual(scan_know.status_code, 200)
            know_data = scan_know.json()
            self.assertEqual(know_data["status"], "knowledge_retrieved")
            self.assertEqual(know_data["action"], "view_knowledge")
            self.assertIn("Ancestral Seed", know_data["knowledge_data"]["title"])

if __name__ == "__main__":
    unittest.main()
