# Setu Frontend — Backend Integration Notes

This is your original frontend, rewired to talk to the real FastAPI + MongoDB
backend built through **Phase 4.5**. This file documents exactly what's real,
what's still local-only, and what to do next — so nothing here is a black box.

## Setup

```bash
npm install
cp .env.example .env      # edit VITE_API_URL if your backend isn't on localhost:8000
npm run dev
```

Make sure your backend is running (`uvicorn app.main:app --reload`) and CORS
is configured to allow your frontend's dev origin (it already is, per the
Phase 1 prompt — `http://localhost:5173`).

## What's fully wired to the real backend

| Feature | Where | Backend endpoints used |
|---|---|---|
| Register / Login | `SignUp.jsx`, `SignIn.jsx`, `context/AuthContext.jsx` | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `GET /users/me` |
| Session persistence | `api/client.js` | JWT stored in `localStorage`, auto-refreshed on 401 |
| Contribute knowledge | `Contribute.jsx` (**new component** — didn't exist before) | `POST /knowledge`, `POST /knowledge/{id}/upload`, `GET /knowledge/{id}/status` (polled) |
| Browse & search knowledge | `Library.jsx` | `GET /knowledge`, `GET /search/semantic` |
| Knowledge detail view | `Library.jsx` (article detail) | Real `summary`, `key_insights`, `transcript`, `trust_score`, `verification_count` from the entry |
| Mentor discovery | `Community.jsx` — new "Find a Mentor" panel at the top | `GET /mentors`, `POST /mentors/{id}/request` |

## What's local-only (not backend-persisted)

- **Profile fields**: `bio`, `location`, `phone`, `skills`, `avatar` — the
  backend (Phases 1-4.5) only stores `name`, `email`, `role`, and
  `preferred_language` on the user record. Editing these in Profile updates
  local app state for the session but won't survive a reload. **To fix**:
  add these columns + a `PUT /users/me` endpoint on the backend, then update
  `patchLocalProfile` in `context/AuthContext.jsx` to call it.
- **Bookmarks** (Library) — client-side only, no backend bookmarks table exists.
- **"Community Stories" feed, comments, and chat** (`Community.jsx`, below the
  new mentor panel) — this was already mock data in the original frontend
  (hardcoded `initialStories`, fake `chatMessages`) and stays mock, because
  the backend has no posts/comments/messaging API. It's kept for visual
  continuity. Real mentor discovery (the panel above it) works end-to-end.

## What was removed or changed intentionally

- Removed the 28-item hardcoded demo array in `Library.jsx` — replaced with
  live data from `/knowledge` and `/search/semantic`.
- Removed curated cover images per entry (backend entries don't have one) —
  replaced with category-themed gradient/emoji placeholders
  (`utils/categoryVisuals.js`). Swap these for real thumbnails once you add
  image support to entries.
- Disabled the "Continue with Google/GitHub" buttons on Sign In/Up — they
  previously just faked a login by calling `onViewChange('profile')` without
  any auth happening. Left disabled with a tooltip rather than wired to fake
  auth, since that would be misleading now that real auth exists.
- `AuthModal.jsx` was dead code (unused anywhere) — left in place but still unused.

## New files

- `src/api/client.js` — fetch wrapper, JWT handling, auto-refresh
- `src/api/auth.js`, `knowledge.js`, `mentors.js`, `communities.js`, `learningPaths.js`, `verification.js` — one file per backend resource
- `src/context/AuthContext.jsx` — app-wide auth state
- `src/components/Contribute.jsx` — the knowledge contribution flow (new)
- `src/utils/categoryVisuals.js` — category placeholder art

## Suggested next steps

1. **Profile persistence** — add the missing user columns + `PUT /users/me` (small backend addition).
2. **Learning paths & communities UI** — the API clients (`api/learningPaths.js`, `api/communities.js`) are ready; no UI consumes them yet. Good next screens to build.
3. **Verification UI** — `api/verification.js` is ready; add a "Verify this entry" action to the Library detail view.
4. **Replace the mock Community feed** — once you're ready for Phase 5/6, decide whether "Community Stories" becomes real posts backed by `/knowledge` entries tagged to a community, or gets removed in favor of the real mentor/community screens.
5. Verified this all builds cleanly with `npm run build` before packaging — re-run that after any further changes.
