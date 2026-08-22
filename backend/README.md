# Knowledge Preservation Platform - Backend Phase 1

This is the backend API for Phase 1 of the **Knowledge Preservation Platform**. It provides a robust, asynchronous REST API built using FastAPI, MongoDB (via Motor), and Pydantic v2. It includes user registration, authentication (JWT), profiles, and basic CRUD operations for knowledge entries (text-only).

---

## Tech Stack
- **Python**: 3.11+ (Tested on Python 3.13)
- **FastAPI**: Modern, high-performance web framework for APIs.
- **MongoDB**: Document database.
- **Motor**: Async Python driver for MongoDB.
- **Pydantic v2**: Data validation and settings management.
- **python-jose & passlib**: Secure JWT authentication and bcrypt password hashing.

---

## Folder Structure
```
backend/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── models/
│   │   ├── user.py
│   │   └── knowledge_entry.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── users.py
│   │   └── knowledge.py
│   ├── core/
│   │   ├── security.py
│   │   └── dependencies.py
│   └── services/
│       ├── auth_service.py
│       └── knowledge_service.py
├── .env.example
├── requirements.txt
└── README.md
```

---

## Setup Instructions

### Prerequisites
- Python 3.11+ installed.
- MongoDB running locally (default: `mongodb://localhost:27017`) or a remote MongoDB Atlas connection string.

### 1. Initialize Virtual Environment
Navigate to the `backend` directory and run:
```bash
python -m venv venv
```
Activate the virtual environment:
- **Windows (PowerShell)**:
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
- **Windows (CMD)**:
  ```cmd
  .\venv\Scripts\activate.bat
  ```
- **macOS / Linux**:
  ```bash
  source venv/bin/activate
  ```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Update the `.env` file with your database URI and a secure JWT secret key.

### 4. Running the Dev Server
Run the dev server using Uvicorn:
```bash
uvicorn app.main:app --reload
```
The server will start at `http://127017:8000` (or `http://127.0.0.1:8000`).

---

## API Documentation & Testing
FastAPI automatically generates interactive Swagger documentation.
- Open your browser and navigate to: **`http://127.0.0.1:8000/docs`**
- Click **Authorize** at the top right, enter your JWT access token if testing protected routes, or use the registration/login endpoints to generate a token first.

---

## Endpoints

### 1. Health Check
- **`GET /health`**
  - Description: Check backend service status.
  - Response:
    ```json
    { "status": "ok" }
    ```

### 2. Authentication
- **`POST /auth/register`**
  - Description: Create a new user account.
  - Request Body:
    ```json
    {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "password": "securepassword",
      "role": "contributor"
    }
    ```
  - Response:
    ```json
    {
      "user": {
        "id": "64b0f023ac952b1b36c7a31b",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role": "contributor",
        "created_at": "2026-07-15T10:00:00Z"
      },
      "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsIn...",
      "token_type": "bearer"
    }
    ```

- **`POST /auth/login`**
  - Description: Authenticate and get tokens.
  - Request Body:
    ```json
    {
      "email": "jane@example.com",
      "password": "securepassword"
    }
    ```
  - Response:
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsIn...",
      "token_type": "bearer"
    }
    ```

- **`POST /auth/refresh`**
  - Description: Exchange refresh token for a new access token.
  - Request Body:
    ```json
    {
      "refresh_token": "eyJhbGciOiJIUzI1NiIsIn..."
    }
    ```
  - Response:
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
      "token_type": "bearer"
    }
    ```

### 3. Users (Protected)
- **`GET /users/me`**
  - Description: Get authenticated user details.
  - Headers: `Authorization: Bearer <access_token>`
  - Response:
    ```json
    {
      "id": "64b0f023ac952b1b36c7a31b",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "contributor",
      "created_at": "2026-07-15T10:00:00Z"
    }
    ```

### 4. Knowledge Entries
- **`POST /knowledge` (Protected)**
  - Description: Create a new knowledge entry (defaults to "draft").
  - Headers: `Authorization: Bearer <access_token>`
  - Request Body:
    ```json
    {
      "title": "Traditional Farming Techniques",
      "description": "A guide on soil rotation and natural irrigation methods.",
      "category": "Agriculture"
    }
    ```
  - Response:
    ```json
    {
      "id": "64b0f0a4ac952b1b36c7a31c",
      "contributor_id": "64b0f023ac952b1b36c7a31b",
      "title": "Traditional Farming Techniques",
      "description": "A guide on soil rotation and natural irrigation methods.",
      "category": "Agriculture",
      "status": "draft",
      "created_at": "2026-07-15T10:05:00Z",
      "updated_at": "2026-07-15T10:05:00Z"
    }
    ```

- **`GET /knowledge` (Public)**
  - Description: List knowledge entries with filtering and pagination.
  - Query Params:
    - `category`: e.g. `Agriculture` (Optional)
    - `contributor_id`: e.g. `64b0f023ac952b1b36c7a31b` (Optional)
    - `skip`: default `0` (Optional)
    - `limit`: default `20` (Optional)
  - Response:
    ```json
    [
      {
        "id": "64b0f0a4ac952b1b36c7a31c",
        "contributor_id": "64b0f023ac952b1b36c7a31b",
        "title": "Traditional Farming Techniques",
        "description": "A guide on soil rotation and natural irrigation methods.",
        "category": "Agriculture",
        "status": "draft",
        "created_at": "2026-07-15T10:05:00Z",
        "updated_at": "2026-07-15T10:05:00Z"
      }
    ]
    ```

- **`GET /knowledge/{id}` (Public)**
  - Description: Retrieve a single entry.
  - Response:
    ```json
    {
      "id": "64b0f0a4ac952b1b36c7a31c",
      "contributor_id": "64b0f023ac952b1b36c7a31b",
      "title": "Traditional Farming Techniques",
      "description": "A guide on soil rotation and natural irrigation methods.",
      "category": "Agriculture",
      "status": "draft",
      "created_at": "2026-07-15T10:05:00Z",
      "updated_at": "2026-07-15T10:05:00Z"
    }
    ```

- **`PUT /knowledge/{id}` (Protected)**
  - Description: Update own knowledge entry.
  - Headers: `Authorization: Bearer <access_token>`
  - Request Body:
    ```json
    {
      "title": "Advanced Soil Techniques",
      "category": "Agriculture"
    }
    ```
  - Response:
    ```json
    {
      "id": "64b0f0a4ac952b1b36c7a31c",
      "contributor_id": "64b0f023ac952b1b36c7a31b",
      "title": "Advanced Soil Techniques",
      "description": "A guide on soil rotation and natural irrigation methods.",
      "category": "Agriculture",
      "status": "draft",
      "created_at": "2026-07-15T10:05:00Z",
      "updated_at": "2026-07-15T10:10:00Z"
    }
    ```

- **`DELETE /knowledge/{id}`** (Protected)
  - Description: Delete own knowledge entry.
  - Headers: `Authorization: Bearer <access_token>`
  - Response: HTTP 204 No Content

---

## Phase 3A - Speech-to-Text & Document Extraction

This phase adds capabilities for:
- Automatic speech-to-text transcription of audio and video files.
- Text extraction from documents (`.txt`, `.pdf`, `.docx`).
- Saving the resulting transcript/text in the database.

### 1. Configuration Settings
You must configure the following environment variables in `.env`:
* **`OPENAI_API_KEY`**: Your OpenAI API secret key.
* **`WHISPER_MODEL`**: The OpenAI Whisper model to use (default: `whisper-1`).

### 2. System Level Dependency: FFmpeg
Processing video files requires extracting their audio track. For this to work, **FFmpeg** must be installed at the operating system level:

- **Windows**:
  - Using Winget: `winget install Gyan.FFmpeg`
  - Using Chocolatey: `choco install ffmpeg`
- **Linux (Ubuntu/Debian)**:
  ```bash
  sudo apt-get update
  sudo apt-get install ffmpeg
  ```
- **macOS**:
  ```bash
  brew install ffmpeg
  ```

### 3. File Limits & Limitations
* **Audio Size Limit**: Audio/video files over 25 MB are rejected.
* **Chunking**: Chunking is not implemented in this phase and will be added later (Phase 3.5).
* **Summarization & Insights**: Summarization and key-insight generation are implemented in Phase 3B.

---

## Phase 3B - AI Summarization & Key Insights

This phase introduces AI-powered summarization and key-insight extraction using Anthropic Claude.

### 1. Features
1. **Anthropic Claude Integration**: Uses Claude for generating concise summaries and key insights.
2. **Category-Aware Prompting**: Automatically adapts system guidelines for Healthcare, Agriculture, Engineering, Education, Business, Technology, or General entries.
3. **Defensive Parsing & Validation**: Cleanly handles model markdown responses and enforces structural constraints (e.g. 2-4 sentences summary, 3-6 distinct insights).
4. **Reprocessing & Reuse**: Already generated transcripts are reused to prevent duplicate transcription costs.
5. **Partial Progress Integrity**: Summarization failures do not delete the generated transcripts.

### 2. Configuration Settings
You must configure the following environment variables in `.env`:
* **`ANTHROPIC_API_KEY`**: Your Anthropic API secret key.
* **`SUMMARIZATION_MODEL`**: The Anthropic model to use (default: `claude-sonnet-4-6`).

### 3. Limitations & Future Scope
* **Truncation**: Source text longer than 15,000 characters is truncated to the first 15,000 characters before summarization. The complete original transcript remains fully stored in MongoDB.
* **Chunking**: Chunked or hierarchical summarization is deferred to a later phase (TODO).
* **Retry Control**: Phase 3C introduces a public retry endpoint, atomic processing-slot acquisition, status tracking, and stale recovery.

---

## Phase 3C - Processing Controls, Tracking & Retry

This phase introduces strong background processing controls, stage/attempt tracking, concurrency control, and a public retry endpoint.

### 1. Features
1. **Processing-Stage Tracking**: Tracks current processing steps (`queued`, `preparing_source`, `transcribing`, `extracting_document`, `summarizing`, `saving_results`, `completed`, `failed`).
2. **Attempt Counter & Limit**: Increments processing attempt count, up to a maximum defined by `MAX_PROCESSING_ATTEMPTS` (default: 3).
3. **Atomic Concurrency Lock**: Atomically acquires the processing slot using MongoDB's `find_one_and_update` to prevent duplicate concurrent runs.
4. **Stale Recovery**: Identifies processing jobs that are stuck or stale (inactive for longer than `PROCESSING_STALE_MINUTES`, default: 30) and allows retrying them.
5. **Partial Progress Preservation**: Reuses previously generated transcripts on retry, keeping them intact even if the summarization fails later.
6. **Public Retry Endpoint**: Exposes `POST /knowledge/{entry_id}/retry` which schedules retry for failed or stale entries belonging to the authenticated user.

### 2. Configuration Settings
You must configure the following environment variables in `.env`:
* **`MAX_PROCESSING_ATTEMPTS`**: The maximum allowed processing/retry runs (default: `3`).
* **`PROCESSING_STALE_MINUTES`**: The number of minutes before a job is considered stale (default: `30`).

### 3. Example Retry Request & Response
- **Endpoint**: `POST /knowledge/{entry_id}/retry` (No Request Body)
- **Response (202 Accepted)**:
```json
{
  "message": "Retry scheduled successfully.",
  "entry_id": "example-id",
  "status": "processing",
  "processing_stage": "preparing_source",
  "processing_attempts": 2
}
```

---

## Phase 4A - Semantic Search & Embeddings

This phase introduces semantic search using OpenAI text embeddings, local cosine-similarity fallbacks, MongoDB Atlas Vector Search integrations, and an automated embedding backfill script.

### 1. Features
1. **OpenAI Text Embeddings**: Uses `text-embedding-3-small` (1536 dimensions) to generate semantic vectors.
2. **Local Vector Search (Fallback)**: When Atlas Vector Search is disabled (`USE_ATLAS_VECTOR_SEARCH=False`), performs memory-mapped O(n) cosine similarity search using `numpy` over candidates from MongoDB.
3. **Atlas Vector Search**: Enables `$vectorSearch` query stage when `USE_ATLAS_VECTOR_SEARCH=True`.
4. **Keyword Fallback**: Automatically falls back to keyword-based text search if no completed entries have generated embeddings.
5. **Non-Critical Enrichment**: Embedding failures do not fail the complete run; knowledge entries will complete successfully even if the embedding API fails.
6. **Hidden Embeddings**: Embedding vectors are internal and never returned by any API endpoint.

### 2. Configuration Settings
You must configure the following environment variables in `.env`:
* **`EMBEDDING_MODEL`**: The OpenAI embedding model to use (default: `text-embedding-3-small`).
* **`EMBEDDING_DIMENSIONS`**: The number of dimensions for the model (default: `1536`).
* **`USE_ATLAS_VECTOR_SEARCH`**: Toggle Atlas Vector Search aggregator (default: `False`).
* **`ATLAS_VECTOR_INDEX_NAME`**: Atlas search index name (default: `knowledge_embedding_index`).
* **`LOCAL_VECTOR_CANDIDATE_LIMIT`**: Max candidate limit loaded for local cosine scoring (default: `2000`).

### 3. MongoDB Atlas Index JSON Definition
Create index named `ATLAS_VECTOR_INDEX_NAME` manually in MongoDB Atlas:
```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "status"
    },
    {
      "type": "filter",
      "path": "category"
    }
  ]
}
```

### 4. Running the Embedding Backfill Script
Generate embeddings for legacy entries missing them using the following command from the `backend` directory:
```bash
python scripts/backfill_embeddings.py
```

---

## Phase 4B - Mentorship Requests & Profiles

This phase introduces mentorship functionality to the platform, including mentor profiles, discovery and filtering, and mentorship request lifecycle management.

### 1. Features
1. **Mentor Profiles**: Users can register themselves as mentors with custom bios, years of experience, availability, contact preferences, and expertise categories.
2. **Mentor Discovery**: Paginated public listing endpoint with category and experience filters, sorted stably by experience, rating, and creation date.
3. **Mentorship Requests**: Authenticated learners can send mentorship requests to mentors with custom messages.
4. **Duplicate Protection**: Partial unique index ensures a learner can have at most one pending request to the same mentor at any given time.
5. **Decisions**: Mentors can accept or decline incoming requests atomically. Out-of-bounds state transitions or access are securely protected.
6. **No Chat/Booking**: Placeholders for rating count, average rating, and contact preferences are ready for future phases.

### 2. Endpoints
- **`POST /mentors/profile`**: Create or update your mentor profile.
- **`GET /mentors`**: Discover mentors.
- **`GET /mentors/{user_id}`**: Get a mentor's profile detail.
- **`POST /mentors/{mentor_user_id}/request`**: Send a mentorship request.
- **`GET /mentors/requests/incoming`**: Get incoming requests (mentors only).
- **`GET /mentors/requests/outgoing`**: Get outgoing requests (learners).
- **`PUT /mentors/requests/{request_id}`**: Accept/decline a request.

### 3. Example Request/Response

#### Create Profile
`POST /mentors/profile`
```json
{
  "bio": "Electrical engineer with practical experience in MCC maintenance, motor protection, transformer testing, and industrial troubleshooting.",
  "expertise_categories": ["Engineering", "Technology"],
  "years_of_experience": 4,
  "availability": "Available on weekends between 10 AM and 4 PM.",
  "contact_preference": "platform_message"
}
```

#### Mentorship Request
`POST /mentors/{mentor_user_id}/request`
```json
{
  "message": "I would like guidance on safe MCC maintenance and diagnosing repeated motor overload trips."
}
```

#### Mentor Decision
`PUT /mentors/requests/{request_id}`
```json
{
  "status": "accepted"
}
```

---

## Phase 4C - Verification Reviews & Trust Scores

This phase introduces accuracy checking and verification scoring to knowledge entries, including trust levels, duplicate review protection, self-verification restrictions, and automatic recomputations.

### 1. Features
1. **Verification Trust Levels**: Exactly `verified`, `needs_review`, and `disputed`.
2. **Self-Verification Protection**: Contributors are prohibited from reviewing their own entries, returning HTTP `403`.
3. **One Review Per reviewer Per Entry**: Reviewed via atomic upserts and compound unique indexes. Re-submitting updates the existing review.
4. **Race-Safe Trust Score**: Recalculated dynamically from database count aggregates on every update/insert, ensuring consistency across concurrent requests.
5. **No Weighted Reputation**: Simple average score: `verified_count / total_count`. Defaults to `0.0` for entries without verifications.
6. **Deletion Cascading**: Automatically deletes related verification documents on knowledge entry deletion.

### 2. Endpoints
- **`POST /knowledge/{entry_id}/verify`**: Submit or update your verification review.
- **`GET /knowledge/{entry_id}/verifications`**: List verifications for an entry.

### 3. Example Request/Response

#### Submit Review
`POST /knowledge/{entry_id}/verify`
```json
{
  "trust_level": "verified",
  "comment": "The described motor-protection checks align with practical industrial maintenance procedures."
}
```

#### List Reviews
`GET /knowledge/{entry_id}/verifications`
```json
{
  "count": 1,
  "skip": 0,
  "limit": 20,
  "trust_score": 1.0,
  "verification_count": 1,
  "verifications": [
    {
      "id": "verification-id",
      "entry_id": "knowledge-entry-id",
      "reviewer_id": "reviewer-user-id",
      "reviewer_name": "Satyam Verma",
      "trust_level": "verified",
      "comment": "The described motor-protection checks align with practical industrial maintenance procedures.",
      "created_at": "2026-07-17T14:30:00Z",
      "updated_at": null
    }
  ]
}
```

---

## Phase 4.5A - On-the-Fly Translation & Cache Invalidation

This phase introduces translation services using the Anthropic Claude API for on-the-fly rendering of content in the user's preferred language, incorporating translation caching and invalidate logic.

### 1. Features
1. **User Preferred Language**: Users store a `preferred_language` code (ISO 639-1) defaulting to `"en"`, editable via `PATCH /users/me`.
2. **Translation Service**: Translates title, summary, and key insights utilizing the Anthropic Claude API and retry logic.
3. **Internal Cache**: Translations are saved inside knowledge entries under the internal field `translations: dict[str, dict] = {}`.
4. **Cache Invalidation**: On read, `source_updated_at` stored in translations is validated against `knowledge_entry.updated_at`. Stale translations automatically trigger regeneration.
5. **Robust Fallbacks**: Non-critical translation failures fall back to original language text.

### 2. Supported Language Codes
- Simple ISO-639-1 lowercase exactly 2-character strings (e.g. `en`, `hi`, `es`, `fr`, `de`, `ja`).
- Invalid codes (e.g. `english`, `Hindi`, `eng`) yield HTTP `400` Bad Request.

### 3. Usage
- **Details endpoint**: `GET /knowledge/{id}?lang=hi`
- **List endpoint**: `GET /knowledge?lang=hi` (Translates `completed` entries only).

---

## Phase 4.5B - Learning Paths

This phase introduces structured learning paths consisting of ordered sequences of completed knowledge entries.

### 1. Features
1. **Creation Validation**: Rejects draft, failed, processing, or deleted entries.
2. **Order Preservation**: Maintains strict ordering of entry sequences inside learning paths.
3. **Safety Fallback**: Skips later deleted entries from the entries endpoint without failing.
4. **Creator Authorization**: Enforces that only the creator can update or delete a learning path.
5. **Translation Reuse**: Reuses Phase 4.5A translation parameters (`?lang=`) to render entries on-the-fly.

### 2. Endpoints
- **`POST /learning-paths`**: Create a learning path.
- **`GET /learning-paths`**: List learning paths with category filter and pagination.
- **`GET /learning-paths/{id}`**: Get metadata details of a learning path.
- **`GET /learning-paths/{id}/entries`**: Get ordered list of completed knowledge entries (supports `?lang=`).
- **`PUT /learning-paths/{id}`**: Update learning path metadata or ordered entry sequence.
- **`DELETE /learning-paths/{id}`**: Delete a learning path.

---

## Phase 4.5C - Communities

This phase introduces community groups, memberships, admin controls, and community-bound knowledge entries.

### 1. Features
1. **Creation**: Admin automatically set as community creator and first member.
2. **Membership**: Join (public communities only) and Leave operations. Admins cannot leave own community without transferring ownership (returns HTTP `400`).
3. **Visibility**: Supports `public` and `private` visibilities.
4. **Knowledge Association**: Optional `community_id` in knowledge creation. Deleting a community sets related entries' `community_id` references to `null`.
5. **Translation Reuse**: Reuses Phase 4.5A's `?lang=` parameters on the community knowledge endpoint.

### 2. Endpoints
- **`POST /communities`**: Create community.
- **`GET /communities`**: List communities with visibility and category filtering.
- **`GET /communities/{id}`**: Details (metadata only, no member list).
- **`POST /communities/{id}/join`**: Join public community.
- **`POST /communities/{id}/leave`**: Leave community (admin restricted).
- **`PUT /communities/{id}`**: Update community metadata (admin only).
- **`DELETE /communities/{id}`**: Delete community (admin only). Nullifies knowledge entries' references.
- **`GET /communities/{id}/knowledge`**: List associated knowledge entries (supports `?lang=`).




