import urllib.request
import json
import time
import uuid

BASE_URL = "http://127.0.0.1:8000"

def request(path, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    url = f"{BASE_URL}{path}"
    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        res_body = e.read().decode("utf-8")
        return e.code, json.loads(res_body) if res_body else {}

def run_all_tests():
    print("=== LIVE BACKEND SUITE VERIFICATION ===")
    
    # 1. Health Check
    status, res = request("/health")
    assert status == 200 and res.get("status") == "ok", f"Health check failed: {status} {res}"
    print("[PASS] GET /health -> 200 OK")

    # 2. Register New User
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    password = "TestPassword123!"
    reg_payload = {
        "email": unique_email,
        "password": password,
        "full_name": "Test User",
        "role": "contributor",
        "preferred_language": "en"
    }
    status, reg_res = request("/auth/register", method="POST", data=reg_payload)
    assert status == 201, f"Registration failed: {status} {reg_res}"
    print(f"[PASS] POST /auth/register -> 201 Created (User: {unique_email})")
    
    access_token = reg_res.get("access_token")
    assert access_token, "No access_token returned on register"
    
    auth_headers = {"Authorization": f"Bearer {access_token}"}

    # 3. Login
    login_payload = {"email": unique_email, "password": password}
    status, login_res = request("/auth/login", method="POST", data=login_payload)
    assert status == 200 and "access_token" in login_res, f"Login failed: {status} {login_res}"
    print("[PASS] POST /auth/login -> 200 OK")

    # 4. Get Current User (/users/me)
    status, me_res = request("/users/me", headers=auth_headers)
    assert status == 200 and me_res.get("email") == unique_email, f"Get user profile failed: {status} {me_res}"
    print(f"[PASS] GET /users/me -> 200 OK (Full name: {me_res.get('full_name')})")

    # 5. Create Knowledge Entry
    entry_payload = {
        "title": "Traditional Organic Farming Techniques",
        "description": "Comprehensive guide on natural soil enrichment and crop rotation.",
        "category": "agriculture",
        "language": "en",
        "content_type": "text"
    }
    status, entry_res = request("/knowledge", method="POST", data=entry_payload, headers=auth_headers)
    assert status == 201, f"Create knowledge entry failed: {status} {entry_res}"
    entry_id = entry_res.get("id")
    print(f"[PASS] POST /knowledge -> 201 Created (Entry ID: {entry_id})")

    # 6. List Knowledge Entries
    status, list_res = request("/knowledge")
    assert status == 200 and isinstance(list_res, list), f"List knowledge entries failed: {status} {list_res}"
    print(f"[PASS] GET /knowledge -> 200 OK (Entries count: {len(list_res)})")

    # 7. Semantic / Keyword Search
    status, search_res = request("/search/semantic?q=farming")
    assert status == 200 and "results" in search_res, f"Search failed: {status} {search_res}"
    print(f"[PASS] GET /search/semantic?q=farming -> 200 OK (Found {search_res.get('count')} results)")

    # 8. Mentors Listing
    status, mentors_res = request("/mentors")
    assert status == 200 and "mentors" in mentors_res, f"Mentors list failed: {status} {mentors_res}"
    print(f"[PASS] GET /mentors -> 200 OK (Mentors count: {mentors_res.get('count')})")

    # 9. Learning Paths Listing
    status, lp_res = request("/learning-paths")
    assert status == 200 and isinstance(lp_res, list), f"Learning paths list failed: {status} {lp_res}"
    print(f"[PASS] GET /learning-paths -> 200 OK (Paths count: {len(lp_res)})")

    # 10. Communities Listing
    status, comm_res = request("/communities")
    assert status == 200 and isinstance(comm_res, list), f"Communities list failed: {status} {comm_res}"
    print(f"[PASS] GET /communities -> 200 OK (Communities count: {len(comm_res)})")

    print("\nALL 10 LIVE BACKEND ENDPOINTS PASSED PERFECTLY!")

if __name__ == "__main__":
    run_all_tests()
