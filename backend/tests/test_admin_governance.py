"""
Comprehensive Unit and Integration Tests for Setu Admin Governance, Moderation & Access Control.
Uses synchronous TestClient with app lifespan.
"""
import unittest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.core.security import create_access_token

class TestAdminGovernanceAndModeration(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Admin JWT token (for nitesh@gmail.com)
        cls.admin_token = create_access_token(data={
            "sub": "admin_test_nitesh_id",
            "email": "nitesh@gmail.com",
            "type": "access"
        })
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}

        # Contributor JWT token
        cls.contrib_token = create_access_token(data={
            "sub": "contrib_test_harbhajan_id",
            "email": "harbhajan@setu.org",
            "type": "access"
        })
        cls.contrib_headers = {"Authorization": f"Bearer {cls.contrib_token}"}

    def test_01_non_admin_forbidden_from_admin_endpoints(self):
        """Verify that regular contributors receive HTTP 403 when accessing admin routes."""
        with TestClient(app) as client:
            res = client.get("/api/admin/overview", headers=self.contrib_headers)
            self.assertEqual(res.status_code, 403)

            res2 = client.get("/api/admin/users", headers=self.contrib_headers)
            self.assertEqual(res2.status_code, 403)

    def test_02_admin_overview_metrics(self):
        """Verify Admin Overview returns platform counts and summary KPIs."""
        with TestClient(app) as client:
            res = client.get("/api/admin/overview", headers=self.admin_headers)
            self.assertEqual(res.status_code, 200)
            data = res.json()

            self.assertIn("total_knowledge_entries", data)
            self.assertIn("pending_review_entries", data)
            self.assertIn("published_entries", data)
            self.assertIn("total_users", data)
            self.assertIsInstance(data["recent_activity"], list)

    def test_03_admin_list_and_moderate_knowledge(self):
        """Test listing knowledge submissions and approving/rejecting them."""
        with TestClient(app) as client:
            # 1. List entries
            list_res = client.get("/api/admin/knowledge", headers=self.admin_headers)
            self.assertEqual(list_res.status_code, 200)
            entries = list_res.json()
            self.assertIsInstance(entries, list)

            if entries:
                test_entry = entries[0]
                entry_id = test_entry["_id"]

                # 2. Admin updates post status
                approve_res = client.put(
                    f"/api/admin/knowledge/{entry_id}/status",
                    json={"status": "completed", "moderation_note": "Verified by Admin Curator"},
                    headers=self.admin_headers
                )
                self.assertEqual(approve_res.status_code, 200)
                self.assertTrue(approve_res.json()["success"])

    def test_04_admin_fast_track_verification(self):
        """Test Admin Fast-Track 100% Verification stamping."""
        with TestClient(app) as client:
            list_res = client.get("/api/admin/knowledge", headers=self.admin_headers)
            self.assertEqual(list_res.status_code, 200)
            entries = list_res.json()

            if entries:
                entry_id = entries[0]["_id"]
                fv_res = client.post(
                    f"/api/admin/knowledge/{entry_id}/fast-verify",
                    headers=self.admin_headers
                )
                self.assertEqual(fv_res.status_code, 200)
                fv_data = fv_res.json()
                self.assertTrue(fv_data["success"])
                self.assertEqual(fv_data["details"]["trust_score"], 1.0)
                self.assertTrue(fv_data["details"]["passport_id"].startswith("SETU-"))

    def test_05_admin_user_permissions_and_post_restriction(self):
        """Test admin listing users and updating user permissions."""
        with TestClient(app) as client:
            # 1. Admin lists users
            users_res = client.get("/api/admin/users", headers=self.admin_headers)
            self.assertEqual(users_res.status_code, 200)
            users = users_res.json()
            self.assertIsInstance(users, list)

            if users:
                user_id = users[0]["_id"]
                # 2. Admin updates permissions
                perm_res = client.put(
                    f"/api/admin/users/{user_id}/permissions",
                    json={"can_post": True, "can_create_community": True},
                    headers=self.admin_headers
                )
                self.assertEqual(perm_res.status_code, 200)
                self.assertTrue(perm_res.json()["success"])

    def test_06_admin_community_feature_toggle(self):
        """Test admin listing communities and toggling featured status."""
        with TestClient(app) as client:
            list_res = client.get("/api/admin/communities", headers=self.admin_headers)
            self.assertEqual(list_res.status_code, 200)
            comms = list_res.json()
            self.assertIsInstance(comms, list)

            if comms:
                comm_id = comms[0]["_id"]
                feat_res = client.put(
                    f"/api/admin/communities/{comm_id}/feature?featured=true",
                    headers=self.admin_headers
                )
                self.assertEqual(feat_res.status_code, 200)
                self.assertTrue(feat_res.json()["success"])

    def test_07_admin_ai_usage_telemetry_subtab(self):
        """Verify the integrated AI usage telemetry endpoint works for admin."""
        with TestClient(app) as client:
            usage_res = client.get("/api/admin/ai-usage", headers=self.admin_headers)
            self.assertEqual(usage_res.status_code, 200)
            data = usage_res.json()
            self.assertIn("monthly_budget_inr", data)
            self.assertIn("telemetry", data)

if __name__ == "__main__":
    unittest.main()
