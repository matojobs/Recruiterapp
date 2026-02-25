# Activity Log

Project: **Recruiter App** (Sourcing Tracker)  
Purpose: Chronological record of significant changes, features, and maintenance.  
**Guard rail:** Keep this file updated when making substantive code or config changes (see `.cursor/rules/activity-log.mdc`).

---

## Format

Each entry should include:

- **Date** (YYYY-MM-DD)
- **Type** — one of: `feature` | `fix` | `refactor` | `config` | `schema` | `docs` | `chore`
- **Summary** — one line description
- **Details** (optional) — files touched, API/schema changes, breaking changes

---

## Entries

### 2025-02-18 — `feature` — Admin Job Applications page

- **Summary:** Admin portal can list, view, edit status, and delete job (portal) applications. Page at `/admin/applications` with filters (jobId, userId, status), pagination, View detail modal, Edit status modal, and Delete with confirm. Permissions: view_applications, edit_applications, delete_applications.
- **Details:**
  - **docs/ADMIN_JOB_APPLICATIONS.md** — API spec: GET/PATCH/DELETE `/api/admin/applications`, status values, permissions, suggested UI.
  - **lib/admin/types.ts** — AdminJobApplication, ApplicationsListResponse, AdminApplicationStatus; Permission extended with view_applications, edit_applications, delete_applications.
  - **lib/admin/api.ts** — getApplications, getApplicationById, updateApplicationStatus, deleteApplication.
  - **app/admin/applications/page.tsx** — List table, filters, View/Edit status/Delete actions, ViewApplicationModal, EditStatusModal, ConfirmDialog for delete.
  - **components/admin/AdminSidebar.tsx** — “Job Applications” nav item (permission view_applications, icon P).

### 2025-02-18 — `docs` — Recruiter application update API (backend request)

- **Summary:** Added full spec for recruiter application update: `PATCH /api/recruiter/applications/:id` with **every** field the frontend sends (portal, assigned_date, call_date, call_status, interested_status, not_interested_remark, interview_scheduled, interview_date, turnup, interview_status, selection_status, joining_status, joining_date, backout_date, backout_reason, hiring_manager_feedback, followup_date, notes). Backend is requested to accept and persist all of these; doc lists fields that must be supported and example body.
- **Details:**
  - **docs/RECRUITER_APPLICATION_UPDATE_API.md** — Endpoint, auth, full field table (types, description), §3 list of fields backend must support, example PATCH body, response and GET shape. Single reference for backend implementation.
  - **lib/backend-api.ts** — `updateApplication()` PATCH body now includes all 18 fields above (no field omitted).
- **Rule:** Keep **ACTIVITY_LOG.md** updated whenever adding API docs or substantive changes (no need to remind again).

### 2025-02-18 — `docs` — Candidate Age backend requirement (single reference)

- **Summary:** Added full spec for candidate age/DOB: where age is used in the frontend, APIs, required fields, candidate shape, examples, backend behaviour (sourcing vs job-portal), and frontend mapper. This file is the single reference for the contract and backend implementation.
- **Details:**
  - **docs/CANDIDATE_AGE_REQUIREMENT.md** — §§1–7: Where age is used, APIs (`GET /api/recruiter/applications`, `GET /api/recruiter/applications/:id`), required `age` or `date_of_birth` on candidate, candidate shape, example JSON, snake_case/camelCase, frontend `mapCandidate()` behaviour. §8: Backend behaviour (implemented): sourcing (candidate record age/DOB), job-portal (user.dateOfBirth → candidate.age & date_of_birth in merged list). §9: Summary (where, what, why, backend). Frontend accepts `age`, `date_of_birth`, `dob`, `dateOfBirth` and falls back to `user.dateOfBirth` when candidate has no age/DOB.

### 2025-02-18 — `fix` — Recruiter dashboard: single source of truth from applications

- **Summary:** Dashboard stats and pipeline flow now derived from applications so top cards, Pipeline Flow, and Candidate Age Statistics stay consistent. Resolves mismatch where stats showed 2 sourced but Pipeline Flow showed 0.
- **Details:**
  - **app/dashboard/page-client.tsx:** Load only `getApplications(recruiter_id)`; removed `getDashboardStats` and `getPipelineFlow`. Stats and flow are computed with `computeDashboardStatsFromApplications(apps)` and `computePipelineFlowFromApplications(apps)`. On error, set empty stats and `EMPTY_PIPELINE_FLOW`.
  - **lib/utils.ts:** Added `computeDashboardStatsFromApplications(applications)` returning `DashboardStats` (totalSourced, callsDoneToday, connectedToday, interestedToday, notInterestedToday, interviewsScheduled, interviewsDoneToday, selectedThisMonth, joinedThisMonth, pendingJoining) using application fields and date filters for “today” and “this month”.
  - **components/dashboard/SystemAgeStats.tsx:** When applications exist but no candidate age data (backend does not return `candidate.age`), show “—” for average/oldest/youngest and an inline note: “Age data is not provided by the backend for these candidates.” Total Candidates still shows application count.
  - No new APIs required; dashboard uses existing `GET /api/recruiter/applications?recruiter_id=...`.

### 2025-02-18 — `feature` — Backend API Integration

- **Summary:** Integrated live backend API with JWT authentication, field mapping, and dual-mode support (local/backend).
- **Details:**
  - Created `lib/api-client.ts`: JWT token management and API request wrapper with error handling
  - Created `lib/api-mappers.ts`: Field name transformation layer (backend `name` → frontend `company_name`, `role_name` → `job_role`, etc.)
  - Created `lib/backend-api.ts`: Backend API functions that call live endpoints and transform responses
  - Created `lib/auth-helper.ts`: Unified authentication helper for both local and backend modes
  - Updated `lib/data.ts`: Now switches between local and backend APIs based on `NEXT_PUBLIC_USE_BACKEND` env var
  - Updated login page: Uses backend JWT auth when `USE_BACKEND_API` is true
  - Updated all pages: Conditional local storage initialization (only in local mode)
  - Updated Header component: Handles logout for both modes (clears JWT token in backend mode)
  - Updated `.env.example`: Added `NEXT_PUBLIC_USE_BACKEND` and `NEXT_PUBLIC_API_BASE_URL` configuration
  - Added `createJobRole` and `getApplication` functions to local-queries for API parity
  - All API calls now include JWT token in Authorization header
  - Field mappings handle backend response differences (company.name → company_name, job_role.role_name → job_role)
  - Dashboard stats and pipeline flow responses are transformed to match frontend expectations
  - Date filters mapped (`date_from`/`date_to` → `start_date`/`end_date`)
  - Error handling redirects to login on 401 responses
  - Build verified: All TypeScript types compile successfully

### 2025-02-18 — `docs` — Update REQUIREMENTS.md with actual backend API contract

- **Summary:** Updated `docs/REQUIREMENTS.md` to match the live backend API: `/api/recruiter/*` prefix, JWT auth, actual endpoint structures, and field name differences.
- **Details:**
  - All routes use `/api/recruiter/*` prefix (not `/api/*`)
  - JWT authentication required (`Authorization: Bearer <TOKEN>`)
  - Field name mappings documented (`name` vs `company_name`, `role_name` vs `job_role`)
  - Dashboard stats and pipeline response structures documented
  - Date filters use `start_date`/`end_date` (not `date_from`/`date_to`)
  - Error format includes `statusCode`, `message`, `error`, `timestamp`, `path`
  - Pagination support (`page`, `limit`) documented

### 2025-02-18 — `config` — Run dev server on port 3100

- **Summary:** Updated Next.js dev/start scripts and local docs to use `localhost:3100` instead of `localhost:3000`.
- **Details:** `package.json`, `README.md`, `START_LOCAL.md`, `LOCAL_MODE.md`.

### 2025-02-18 — `docs` — Move documentation into `docs/` folder

- **Summary:** Consolidated project docs into `docs/` to keep the repo root clean.
- **Details:**
  - Moved activity log, code review, and backend requirements into `docs/`.
  - Updated `.cursor/rules/activity-log.mdc` and `lib/data.ts` references accordingly.

### 2025-02-18 — `fix` — Fix ESLint useEffect dependency warnings

- **Summary:** Fixed React Hook useEffect exhaustive-deps warnings by wrapping functions in useCallback and adding missing dependencies.
- **Details:**
  - **app/candidates/page.tsx:** Wrapped `loadApplications` and `loadFlow` in `useCallback` with proper dependencies and updated effects.
  - **components/candidates/ApplicationsTable.tsx:** Added `currentPage` to useEffect dependency array.

### 2025-02-18 — `refactor` — Implement code review changes and add backend requirements doc

- **Summary:** Applied suggested refactors and added backend API contract doc.
- **Details:**
  - **lib/queries.ts:** Extracted `APPLICATIONS_SELECT`; added `ApplicationFilters` typing; fixed filter chaining order; hardened recruiter performance mapping.
  - **lib/api-handler.ts:** Added `withApiHandler()` for consistent API error handling.
  - **lib/parse-query-filters.ts:** Added `parseApplicationFilters(searchParams)` for applications route.
  - **API routes:** Updated to use `withApiHandler`; applications GET uses `parseApplicationFilters`.
  - **lib/local-db.ts:** Persist only raw application rows (`ApplicationRaw`); create/update/delete write raw only; pipeline uses `computePipelineFlowFromApplications`.
  - **types/database.ts:** Added `EMPTY_PIPELINE_FLOW`, `ApplicationFilters`, `ApplicationRaw`.
  - **lib/utils.ts:** Added `computePipelineFlowFromApplications(applications)`.
  - **lib/data.ts:** Added single data access facade (currently delegates to local mode; backend integration uses `docs/REQUIREMENTS.md`).
  - **REQUIREMENTS doc:** `docs/REQUIREMENTS.md`
  - **Code review doc:** `docs/CODE_REVIEW.md`

### 2025-02-18 — `docs` — Code review (repetition and future risk)

- **Summary:** Added code review findings on repetition and long-term risks.
- **Details:** File: `docs/CODE_REVIEW.md`.

### 2025-02-18 — `chore` — Activity log and guard rail added

- **Summary:** Added project activity log and Cursor rule to maintain it.
- **Details:**
  - Created `docs/ACTIVITY_LOG.md`.
  - Created `.cursor/rules/activity-log.mdc`.

---

*Add new entries at the top of the \"Entries\" section. Keep one blank line between entries.*

