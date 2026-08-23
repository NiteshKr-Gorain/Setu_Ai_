import sys
import unittest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from app.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
import app.database as database_module
from app.main import app

class TestBackendComprehensive(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        database_module.connect_to_mongo()

    def test_01_config_loading(self):
        """Test configuration loading and default values."""
        self.assertIsNotNone(settings.JWT_SECRET_KEY)
        self.assertEqual(settings.JWT_ALGORITHM, "HS256")
        self.assertEqual(settings.MONGO_DB_NAME, "knowledge_preservation_db")
        print(" [PASS] Config & Environment Settings test passed.")

    def test_02_security_hashing_and_jwt(self):
        """Test password hashing, verification, and JWT creation/decoding."""
        raw_password = "SecurePassword2026!"
        hashed = get_password_hash(raw_password)
        self.assertTrue(verify_password(raw_password, hashed))
        self.assertFalse(verify_password("WrongPassword", hashed))

        payload = {"sub": "user_test_id_123", "email": "test@example.com"}
        token = create_access_token(payload)
        decoded = decode_token(token)
        self.assertEqual(decoded.get("sub"), "user_test_id_123")
        self.assertEqual(decoded.get("email"), "test@example.com")
        self.assertEqual(decoded.get("type"), "access")
        print(" [PASS] Security (Bcrypt & JWT) test passed.")

    def test_03_health_check(self):
        """Test /health endpoint."""
        with TestClient(app) as client:
            response = client.get("/health")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json(), {"status": "ok"})
        print(" [PASS] /health endpoint test passed.")

    def test_04_openapi_schema_and_router_registration(self):
        """Test OpenAPI schema generation and verify router paths."""
        with TestClient(app) as client:
            response = client.get("/openapi.json")
            self.assertEqual(response.status_code, 200)
            schema = response.json()
            paths = schema.get("paths", {})

            expected_routes = [
                "/health",
                "/auth/register",
                "/auth/login",
                "/auth/refresh",
                "/users/me",
                "/knowledge",
                "/search/semantic",
                "/mentors",
                "/learning-paths",
                "/communities",
                "/api/rfid/scan",
                "/api/rfid/seed"
            ]

            for route in expected_routes:
                self.assertIn(route, paths, f"Route '{route}' missing from OpenAPI schema!")
            print(f" [PASS] OpenAPI Schema test passed. Verified {len(paths)} routes registered.")

    def test_05_protected_route_guards(self):
        """Test that unauthenticated requests to protected endpoints return 401."""
        with TestClient(app) as client:
            response = client.get("/users/me")
            self.assertEqual(response.status_code, 401)

            response = client.post("/knowledge", json={})
            self.assertEqual(response.status_code, 401)
        print(" [PASS] Protected route security guards test passed (401 Unauthorized returned).")

    def test_06_payload_validation(self):
        """Test pydantic validation errors on auth endpoints."""
        with TestClient(app) as client:
            response = client.post("/auth/register", json={"email": "invalid-email"})
            self.assertEqual(response.status_code, 422)
        print(" [PASS] Payload validation test passed (422 Unprocessable Entity returned).")

    def test_07_public_query_endpoints(self):
        """Test public GET query endpoints for 200 OK responses."""
        with TestClient(app) as client:
            endpoints = [
                "/knowledge",
                "/mentors",
                "/search/semantic?q=farming",
                "/learning-paths",
                "/communities"
            ]
            for ep in endpoints:
                res = client.get(ep)
                self.assertEqual(res.status_code, 200, f"Endpoint {ep} failed with status {res.status_code}")
        print(" [PASS] All public query endpoints returned HTTP 200 OK.")

    def test_08_text_search_query(self):
        """Test text search endpoint GET /search?q=... for 200 OK response."""
        with TestClient(app) as client:
            res = client.get("/search?q=farming")
            self.assertEqual(res.status_code, 200)
            self.assertIsInstance(res.json(), list)
        print(" [PASS] Text search query endpoint test passed.")

    def test_09_avatar_endpoints(self):
        """Test Avatar endpoints: personas, health, stats, and custom knowledge."""
        with TestClient(app) as client:
            res = client.get("/api/avatar/personas")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertIn("personas", data)
            self.assertTrue(len(data["personas"]) >= 4)
            print(f" [PASS] /api/avatar/personas verified ({len(data['personas'])} personas).")

            res_stats = client.get("/api/avatar/stats")
            self.assertEqual(res_stats.status_code, 200)
            self.assertIn("avatarName", res_stats.json())
            print(" [PASS] /api/avatar/stats verified.")

            res_custom = client.get("/api/avatar/custom-knowledge")
            self.assertEqual(res_custom.status_code, 200)
            self.assertIn("knowledge", res_custom.json())
            print(" [PASS] /api/avatar/custom-knowledge verified.")

            res_health = client.get("/api/health")
            self.assertEqual(res_health.status_code, 200)
            print(" [PASS] /api/health verified.")

    @classmethod
    def tearDownClass(cls):
        database_module.close_mongo_connection()

if __name__ == "__main__":
    unittest.main()

