import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from fastapi.testclient import TestClient
from app.main import app

def test_admin():
    with TestClient(app) as client:
        print("Testing login with nitesh@gmail.com / 123456n...")
        res = client.post("/auth/login", json={"email": "nitesh@gmail.com", "password": "123456n"})
        assert res.status_code == 200, f"Login failed: {res.status_code} {res.text}"
        data = res.json()
        token = data["access_token"]
        print(" [PASS] Login successful! Token acquired.")

        print("Testing /users/me with admin token...")
        me_res = client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res.status_code == 200, f"getMe failed: {me_res.status_code} {me_res.text}"
        user = me_res.json()
        print(" [PASS] User Profile:", user)
        assert user["role"] == "admin", f"Expected admin role, got: {user.get('role')}"
        print(" [PASS] Role confirmed as admin!")

        print("Testing /admin/ai-costs with admin token...")
        admin_res = client.get("/admin/ai-costs", headers={"Authorization": f"Bearer {token}"})
        assert admin_res.status_code == 200, f"admin costs failed: {admin_res.status_code} {admin_res.text}"
        print(" [PASS] Admin AI Costs Endpoint accessible! Current costs:", admin_res.json())

    print("\n*** BACKEND AUTH & ADMIN VERIFICATION 100% SUCCESSFUL! ***")

if __name__ == "__main__":
    test_admin()
