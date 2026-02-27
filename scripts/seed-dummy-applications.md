# Seed Dummy Candidates / Applications for Testing

Use this to get **more than 20** candidates and applications so you can verify the dashboard and Candidates page show the full list.

## Option 1: Backend must accept `limit` and `page`

The frontend now sends **`limit=1000`** (and `page=1`) on:

- **GET /api/recruiter/applications** — used by Dashboard and Candidates page.
- **GET /api/recruiter/candidates** — used when loading candidates.

If your backend was defaulting to 20, ensure it **honors** query params:

- `limit` — max items per page (we send 1000).
- `page` — page number (we send 1).

Then the dashboard and Candidates page will receive up to 1000 records.

## Option 2: Create dummy data via backend or DB

To test with 25+ candidates:

1. **Backend admin / DB:** Insert extra candidate and application rows (e.g. 30 applications for one recruiter).
2. **Recruiter UI:** Log in, go to Candidates, click “Add Candidate” and add several candidates (each creates an application). Repeat until you have 25+.
3. Reload Dashboard and Candidates — you should see all of them (no cap at 20).

## What was fixed in the app

- **`lib/backend-api.ts`:** `getApplications()` now sends `limit=1000` and `page=1` by default so the backend returns up to 1000 applications. `getCandidates()` sends `limit=1000`.
- **`types/database.ts`:** `ApplicationFilters` has optional `page` and `limit` so callers can override if needed.

If the backend still returns only 20, the backend must be updated to accept and use the `limit` (and `page`) query parameters.
