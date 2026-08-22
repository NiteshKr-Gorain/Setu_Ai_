# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-07-19

### Added
- Environment-driven `frontend/.env` variables.
- Dynamic **Mentor Profile Settings** tab in the user profile page (`Profile.jsx`) enabling mentors to build profiles and accept/decline learner requests.

### Changed
- Configured FastAPI CORS origins to permit requests from `http://127.0.0.1:5173`.
- Enhanced client-side error extraction (`client.js`) to parse validation detail objects/arrays from FastAPI.
- Aligned semantic search listing results unpacking to handle the `{results: [...]}` API response.
- Normalized the `/mentors` API client list handler to extract paginated mentor collections.
- Corrected verification request body schema alignment to match backend `VerificationCreate` model fields.
