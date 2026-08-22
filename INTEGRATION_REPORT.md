# Frontend-Backend Integration Report

This report summarizes the integration process connecting the React + Vite frontend to the FastAPI + MongoDB backend for the Setu Knowledge Preservation Platform.

---

## 1. Project Specifications

* **Backend URL:** `http://localhost:8000` (or `http://127.0.0.1:8000`)
* **Frontend URL:** `http://localhost:5173` (or `http://127.0.0.1:5173`)

### Start Commands
* **Backend:**
  ```powershell
  cd backend
  .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
  ```
* **Frontend:**
  ```powershell
  cd frontend
  npm run dev
  ```

---

## 2. Environment Variables Configuration

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8000
```

### Backend (`backend/.env`)
```env
MONGO_URI=mongodb://...
MONGO_DB_NAME=knowledge_preservation_db
JWT_SECRET_KEY=...
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
OPENAI_API_KEY=...
WHISPER_MODEL=whisper-1
ANTHROPIC_API_KEY=...
SUMMARIZATION_MODEL=claude-sonnet-4-6
MAX_PROCESSING_ATTEMPTS=3
PROCESSING_STALE_MINUTES=30
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
USE_ATLAS_VECTOR_SEARCH=False
ATLAS_VECTOR_INDEX_NAME=knowledge_embedding_index
LOCAL_VECTOR_CANDIDATE_LIMIT=2000
```

---

## 3. Integration Map

| Frontend Feature | Frontend API Function | Backend Endpoint | Request Payload | Response Shape |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication (Register)** | `register` (`auth.js`) | `POST /auth/register` | `UserCreate` (JSON) | `{"user": UserOut, "access_token": "", "refresh_token": "", "token_type": "bearer"}` |
| **Authentication (Login)** | `login` (`auth.js`) | `POST /auth/login` | `UserLogin` (JSON) | `{"access_token": "", "refresh_token": "", "token_type": "bearer"}` |
| **Get Logged-in User** | `getMe` (`auth.js`) | `GET /users/me` | None (Bearer Token) | `UserOut` (JSON) |
| **List Knowledge Entries** | `listKnowledge` (`knowledge.js`) | `GET /knowledge` | Query Params (`category`, `contributor_id`, `lang`, `community_id`) | `List[KnowledgeEntryOut]` |
| **Semantic / Fallback Search** | `listKnowledge` (`knowledge.js`) | `GET /search/semantic` | Query Params (`q`, `category`, `limit`) | `{"query": "", "search_type": "semantic", "count": 0, "results": [...]}` |
| **Create Knowledge Entry** | `createKnowledgeEntry` (`knowledge.js`) | `POST /knowledge` | `KnowledgeEntryCreate` (JSON) | `KnowledgeEntryOut` (JSON) |
| **Upload Entry File** | `uploadKnowledgeFile` (`knowledge.js`) | `POST /knowledge/{id}/upload` | `Multipart/Form-Data` (`file`, `content_type`) | `KnowledgeEntryOut` (JSON) |
| **Get Entry Status** | `getKnowledgeStatus` (`knowledge.js`) | `GET /knowledge/{id}/status` | None | `{id, status, processing_stage, can_retry, ...}` |
| **Retry Entry Processing** | `retryKnowledgeProcessing` (`knowledge.js`) | `POST /knowledge/{id}/retry` | None | `{message, entry_id, status, ...}` |
| **List Mentors** | `listMentors` (`mentors.js`) | `GET /mentors` | Query Params (`category`, `min_experience`) | `{"count": 0, "skip": 0, "limit": 20, "mentors": [...]}` |
| **Submit Verification** | `submitVerification` (`verification.js`) | `POST /knowledge/{id}/verify` | `VerificationCreate` (JSON) | `VerificationOut` (JSON) |

---

## 4. Mismatches Fixed & Changes Made

### A. CORS Configuration
* **File Modified:** [main.py](file:///c:/Users/satya/OneDrive/Documents/setuva/backend/app/main.py)
* **Change:** Added `"http://127.0.0.1:5173"` to CORS `origins` to prevent CORS issues when local requests route via `127.0.0.1` instead of `localhost`.

### B. Client Error Formatting
* **File Modified:** [client.js](file:///c:/Users/satya/OneDrive/Documents/setuva/frontend/src/api/client.js)
* **Change:** Improved the error parser so that Pydantic/FastAPI validation detail arrays/objects are converted into flat, human-readable strings (e.g. `body.password: String should have at least 6 characters`) instead of displaying `[object Object]`.

### C. Search Array Integration
* **File Modified:** [knowledge.js](file:///c:/Users/satya/OneDrive/Documents/setuva/frontend/src/api/knowledge.js)
* **Change:** Modified `listKnowledge` to extract the nested `results` array from semantic search responses, matching the expected array shape of callers like `Library.jsx`.

### D. Mentor Listing & Request UI
* **Files Modified:**
  * [mentors.js](file:///c:/Users/satya/OneDrive/Documents/setuva/frontend/src/api/mentors.js) — Extracted `.mentors` from the paginated `/mentors` wrapper.
  * [Profile.jsx](file:///c:/Users/satya/OneDrive/Documents/setuva/frontend/src/components/Profile.jsx) — Added a new tab **"Mentor Profile Settings"** allowing contributors to manage their expertise profile, accept/decline incoming requests, and check outgoing requests.

### E. Verification Payload
* **File Modified:** [verification.js](file:///c:/Users/satya/OneDrive/Documents/setuva/frontend/src/api/verification.js)
* **Change:** Aligned the verify request body to the backend's `VerificationCreate` schema (removed `knowledge_entry_id` from the payload, stripped whitespace, and passed `null` instead of empty strings).

---

## 5. Verification Status

### Verified Through Code Inspection & API Logging
* **CORS Settings:** Verified that standard request headers (Authorization, Content-Type) are allowed.
* **JWT Storage:** Handled using `localStorage` token keys under the existing `setu_access_token` and `setu_refresh_token` scheme.
* **Environment-driven URLs:** Ensured that `BASE_URL` uses Vite's `import.meta.env.VITE_API_URL` variable.
* **Auto-refresh Flow:** Supported via `/auth/refresh` on the backend and mapped inside the API client request interceptors.

### Verification of Live Services
* Both frontend and backend start correctly and communicate seamlessly.
