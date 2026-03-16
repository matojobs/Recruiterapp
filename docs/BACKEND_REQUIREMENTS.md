# Backend Requirements Document

This document defines **functional and technical requirements** for the backend that serves the Recruiter App frontend. It is the single reference for what the backend must implement; detailed API contracts are in the linked docs.

**Audience:** Backend developers, tech leads.  
**Frontend base URL:** `NEXT_PUBLIC_API_BASE_URL` (e.g. `http://localhost:5000/api` or `https://api.jobsmato.com/api`).

---

## 1. Overview

### 1.1 Two API surfaces

| Surface | Prefix | Auth | Purpose |
|--------|--------|------|---------|
| **Recruiter portal** | `/api/recruiter/*` (login: `/api/auth/login`) | Recruiter JWT | Sourcing: recruiters, companies, job roles, candidates, applications, dashboard, today progress |
| **Admin panel** | `/api/admin/*` | Admin JWT | Users, companies, jobs, job applications, dashboard analytics, **recruiter performance reports** |

- Recruiter and admin use **different** login endpoints and tokens; 401 on either surface clears that token and redirects to the correct login.
- CORS must allow the frontend origin; OPTIONS preflight must return 200 with appropriate `Access-Control-*` headers.

### 1.2 Field naming

- **Recruiter APIs:** Request and response bodies use **snake_case** (e.g. `candidate_name`, `call_status`, `assigned_date`, `job_role_id`). Frontend maps to/from camelCase internally.
- **Admin APIs:** Dashboard stats and some admin payloads use **camelCase** (e.g. `totalUsers`, `firstName`). Follow existing admin API docs for consistency.
- **Dates:** ISO 8601 date strings `YYYY-MM-DD` for date-only fields.

### 1.3 Error responses

- Use HTTP status codes: 400 (validation/duplicate), 401 (missing/invalid token), 403 (forbidden), 404 (not found), 500 (server error).
- Body shape (e.g.): `{ "statusCode": number, "message": string, "error": string }`. Frontend does not depend on a specific nested structure beyond a readable `message`.

---

## 2. Recruiter Portal – Requirements

### 2.1 Authentication

| Requirement | Detail |
|-------------|--------|
| **POST /api/auth/login** | Body: `{ "email", "password" }`. No `/recruiter` prefix. Return 401 for invalid credentials. |
| **Response** | At least: `accessToken` (or top-level `token`) and user identity (`user.id` / `userId`, `user.email` / `email`, `user.role` / `role`). Frontend accepts either nested or flat shape. |
| **All other recruiter endpoints** | Require `Authorization: Bearer <recruiter_token>`. Return 401 if missing or invalid. |

**Ref:** `docs/APIS_REQUIRED_BY_FRONTEND.md` § 1.1, `docs/REQUIREMENTS.md` (auth section).

### 2.2 Master data

Backend must provide:

| Endpoint | Method | Key requirement |
|----------|--------|------------------|
| `/api/recruiter/recruiters` | GET | List recruiters; array or `{ data/items: [] }`. Fields: `id`, `name`, `email`, optional `phone`, `created_at`, `updated_at`. |
| `/api/recruiter/companies` | GET | List companies. Include `job_roles_count` or equivalent if used by frontend. |
| `/api/recruiter/companies/:id` | GET | **Must return company with `job_roles` array** (id, company_id, role_name, department?, etc.). Used for Add Candidate → Job Role dropdown. 404 if not found. |
| `/api/recruiter/job-roles` | GET | List job roles; optional `?company_id=`. Each item: id, company_id, role_name, company? (nested). |
| `/api/recruiter/job-roles` | POST | Body: `company_id`, `role_name`, `department?`. Return 201 with created job role. |
| `/api/recruiter/candidates` | GET | List candidates; optional `?search=`. |
| `/api/recruiter/candidates` | POST | Body: candidate_name, phone, email?, qualification?, work_exp_years?, etc. (snake_case). Return 201. |

**Ref:** `docs/APIS_REQUIRED_BY_FRONTEND.md` § 1.2, `docs/REQUIREMENTS.md` (master data).

### 2.3 Applications (recruitment pipeline)

Applications are the core entity for the **sourcing pipeline**. Each row has: recruiter, candidate, job role, assigned_date, call_date, call_status, interested_status, not_interested_remark, interview_scheduled, interview_date, interview_status, selection_status, joining_status, joining_date, backout_date, backout_reason, etc.

| Endpoint | Method | Key requirement |
|----------|--------|------------------|
| `/api/recruiter/applications` | GET | **Paginated list.** Query: `page`, `limit`, `recruiter_id`, `company_id`, `job_role_id`, `portal`, `call_status`, `interested_status`, `interview_scheduled` (true/false), `interview_status`, `selection_status`, `joining_status`, `start_date`, `end_date`, `search` (server-side search on candidate name, phone, email, portal, job role name, company name). **Response:** `{ applications: [], total, page, limit, total_pages }`. Each item includes nested `candidate`, `job_role` (with `company`), `recruiter`. |
| `/api/recruiter/applications/:id` | GET | Single application with same shape and relations. 404 if not found. |
| `/api/recruiter/applications` | POST | Create application (candidate_id, job_role_id, assigned_date, etc.). 201 with created resource. 400 for validation or duplicate (e.g. same candidate_id, job_role_id, assigned_date). |
| `/api/recruiter/applications/:id` | PATCH | Partial update (call_date, call_status, interested_status, not_interested_remark, interview_scheduled, interview_date, interview_status, selection_status, joining_status, joining_date, backout_*, etc.). 200 with updated application. |
| `/api/recruiter/applications/:id` | DELETE | 200 with message or empty body. 404 if not found. |

**Call status** values (strings): `Connected`, `RNR`, `Busy`, `Switched Off`, `Incoming Off`, `Call Back`, `Invalid`, `Wrong Number`, `Out of network`.  
**Interview status:** `Scheduled`, `Done`, `Not Attended`, `Rejected`.  
**Selection status:** `Selected`, `Not Selected`, `Pending`.  
**Joining status:** `Joined`, `Not Joined`, `Pending`, `Backed Out`.

**Ref:** `docs/RECRUITER_APPLICATIONS_LIST_API.md`, `docs/SEARCH_AND_FILTER_APIS.md`, `docs/RECRUITER_APPLICATION_UPDATE_API.md`.

### 2.4 Create candidate + application in one request (transactional)

| Endpoint | Method | Key requirement |
|----------|--------|------------------|
| `/api/recruiter/applications/with-candidate` | POST | Body: `{ "candidate": { candidate_name, phone, email?, ... }, "application": { job_role_id, assigned_date, recruiter_id?, ... } }`. Backend must **ignore** `application.candidate_id` (frontend may send 0). **Transaction:** create candidate then application; on any failure roll back both. Return 201 with full application (same shape as GET by id) including nested candidate. 400 if validation fails (e.g. candidate_name/phone required, duplicate phone, duplicate application). |

**Ref:** `docs/RECRUITER_CREATE_CANDIDATE_WITH_APPLICATION_API.md`.

### 2.5 Dashboard and today progress

| Endpoint | Method | Key requirement |
|----------|--------|------------------|
| `/api/recruiter/dashboard/stats` | GET | Optional `recruiter_id`. Return KPIs (e.g. total_sourced, connected_today, interested_today, interviews_scheduled, selected_this_month, joined_this_month). Snake_case. |
| `/api/recruiter/dashboard/pipeline` | GET | Optional filters (e.g. start_date, end_date). Return array of `{ stage: string, count: number }` for pipeline stages (sourced, call done, connected, interested, not interested, interview scheduled, interview done, selected, joined). Used for filtered/all-time pipeline. |
| `/api/recruiter/dashboard/today-progress` | GET | **Today-only** pipeline counts. Optional `recruiter_id` (or from token). Return same **array of { stage, count }** as pipeline (sourced, call done, connected, interested, not interested, interview scheduled, interview done, selected, joined). “Today” = server date; counts where the relevant activity (e.g. call_date, assigned_date) occurred today. Frontend uses this for “Flow Tracking” on the Candidates page. |

**Ref:** `docs/RECRUITER_TODAY_PROGRESS_API.md`, `docs/APIS_REQUIRED_BY_FRONTEND.md` § 1.4.

### 2.6 Pending applications and recruiter call submission

- **GET** endpoint(s) for pending/sourcing applications (e.g. by job_role_id) and **POST** for submitting recruiter call outcome (call_status, interested_status, etc.) as required by the Sourcing and Pending Application flows. See frontend usage and any existing backend docs for exact paths and payloads.

**Ref:** `docs/PENDING_APPLICATIONS_CALL_STATUS_AND_INTERESTED.md` (if present).

---

## 3. Admin Panel – Requirements

### 3.1 Admin auth

| Endpoint | Method | Key requirement |
|----------|--------|------------------|
| `/api/admin/auth/login` | POST | Body: `{ "email", "password" }`. Response: `success`, `user` (with `accessToken`, `userId`, `email`, `fullName`, `role`), and **`permissions`** (array of strings). 401 for invalid or non-admin. |
| `/api/admin/auth/permissions` | GET | Bearer. Response: `{ "permissions": string[], "role": string, "isAdmin": boolean }`. |
| `/api/admin/auth/logout` | POST | Bearer. 200. |

**Ref:** `docs/APIS_REQUIRED_BY_FRONTEND.md` § 2.1.

### 3.2 Admin CRUD (users, companies, jobs, job applications, settings, logs)

Admin panel needs full CRUD and status flows for:

- **Users:** list (with pagination, search, role, status, sort), get by id, create, update, delete, verify, suspend.
- **Companies:** list, get by id, create, update, delete, update status, verify.
- **Jobs:** list (with filters, companyId), get by id, create, update status, delete, bulk action.
- **Job applications** (portal applications): list (jobId, userId, status), get by id, update status, delete.
- **Settings:** get, update (key-value).
- **Logs:** error logs (paginated, filters), activity logs (paginated, filters), activity logs export.
- **Bulk upload:** validate, upload, upload status, upload history.

Exact query params, body shapes, and permissions are in the admin API reference. Frontend expects paginated list responses (e.g. `{ users: [], total, page, limit, totalPages }`) and standard 200/201/400/401/403/404/500.

**Ref:** `docs/APIS_REQUIRED_BY_FRONTEND.md` § 2.2–2.8, `docs/ADMIN_CRUD_API_REFERENCE.md`, `docs/ADMIN_PANEL_API_DOCUMENTATION.md`, `docs/ADMIN_JOB_APPLICATIONS.md`, `docs/ADMIN_DASHBOARD_AND_ANALYTICS_API.md`.

### 3.3 Admin dashboard stats and analytics

- **GET /api/admin/dashboard/stats** — Aggregate stats: totalUsers, totalJobs, totalCompanies, totalApplications, activeJobs, pendingApplications, newUsersToday, newJobsToday, optional growth/rate fields. Permission: view_dashboard / view_analytics.
- **GET /api/admin/dashboard/analytics/users?days=** — Time-series for user analytics. Permission: view_analytics.
- **GET /api/admin/dashboard/analytics/jobs?days=** — Job posting trends. Permission: view_analytics.
- **GET /api/admin/dashboard/analytics/applications?days=** — Application trends (e.g. applicationTrends). Permission: view_analytics.

Return 403 when permission is missing; frontend shows “Permission denied” per tab.

---

## 4. Admin Recruiter Performance – Requirements

Admin must be able to see **all recruiter performance**, **individual recruiter performance**, **day report (DOD)**, **month report (MTD)**, **company-wise funnel**, and **negative funnel** (not interested remarks, rejected, backout). Data source: **recruitment pipeline** (applications with call_status, interested_status, interview_status, selection_status, joining_status, not_interested_remark, etc.), not the job-portal applications API.

All endpoints below are **admin-only** (Bearer token), under **`/api/admin/recruiter-performance`** (or equivalent prefix). Return 401/403 when appropriate.

| # | Endpoint | Purpose |
|---|----------|---------|
| 1 | **GET** `/api/admin/recruiter-performance/dod?date=` | Day report: one row per recruiter + **total** row. Date default: today. Metrics: assigned, attempt, connected, interested, not_relevant, not_interested, interview_sched, sched_next_day, today_selection, rejected, today_joining, interview_done, interview_pending. |
| 2 | **GET** `/api/admin/recruiter-performance/mtd?month=` | Month-to-date report: one row per recruiter + **total**. Month default: current month. Metrics: assigned, attempt, connected, interested, interview_sched, sched_next_day, selection, total_joining, yet_to_join, backout, hold. |
| 3 | **GET** `/api/admin/recruiter-performance/individual?recruiter_id=&period=dod\|mtd&date=&month=` | Single recruiter: same metrics as DOD or MTD. `recruiter_id` required; period default mtd; date/month as per period. |
| 4 | **GET** `/api/admin/recruiter-performance/company-wise?month=` | Company-wise funnel: current_openings, total_screened, interview_scheduled, interview_done, interview_pending, rejected, selected, joined, hold, yet_to_join, backout. Optional month for MTD; otherwise all-time if applicable. |
| 5 | **GET** `/api/admin/recruiter-performance/client-report?company_id=&date=&month=` | One company: MTD and DOD metrics side by side (interview_scheduled, turnup, interview_done, rejected_status, selection_status, joined, yet_to_join, backout). |
| 6 | **GET** `/api/admin/recruiter-performance/negative-funnel/not-interested-remarks?date=&month=` | Negative funnel: not interested remarks grouped by **remark** and **job role**. Response: list of remarks, each with by_job_role (job_role_id, job_role_name, count) and total; totals_by_job_role; grand_total. date for DOD, month for MTD. |
| 7 | **GET** `/api/admin/recruiter-performance/interview-status-company-wise?date=` | Interview status by company for a day (DOD): int_sched, int_done, inter_pending, selected, joined, on_hold, yet_to_join, backout. Date default: today. |

**Full request/response shapes, stage semantics (“today” vs “month”), and examples:**  
**`docs/ADMIN_RECRUITER_PERFORMANCE_APIS.md`**

Frontend already has a “Recruiter Performance” page and calls these endpoints; if an endpoint is not implemented (e.g. 404), the UI shows “Backend not implemented” and points to the spec.

---

## 5. Non-functional requirements

| Area | Requirement |
|------|-------------|
| **CORS** | Allow frontend origin; OPTIONS preflight 200 with correct headers. |
| **Security** | Validate JWT; enforce recruiter vs admin scope; do not expose other tenants’ data. Recruiter can only access own applications unless backend explicitly allows otherwise. |
| **Validation** | Validate all inputs (query params, body). Return 400 with clear message for invalid or duplicate data. |
| **Idempotency / duplicates** | Applications: reject duplicate (e.g. same candidate_id + job_role_id + assigned_date) with 400. Create-with-candidate: reject duplicate phone/candidate or application with 400. |
| **Performance** | Applications list and recruiter performance reports should use efficient queries (indexes, date bounds, aggregates). Avoid N+1; return paginated lists with total. |
| **Availability** | Document and maintain API base URL and auth endpoints for frontend env (e.g. production vs staging). |

---

## 6. Implementation status

*Backend implementation summary (as of 2026-03-16).*

### Implemented

**1. Recruiter applications list (GET /api/recruiter/applications)**  
- Response shape: `{ applications, total, page, limit, total_pages }` (paginated format).  
- Sorting: optional `sort_by` (`created_at` \| `updated_at` \| `call_date` \| `assigned_date` \| `candidate_name`), `sort_order` (`asc` \| `desc`, default `desc`).  
- Backend files: `query-params.dto.ts`, `recruiter.service.ts`.

**2. Admin recruiter-performance (/api/admin/recruiter-performance/\*)**  
New admin-only module (JWT + `view_analytics`). All 7 endpoints read from `sourcing.applications` (recruitment pipeline):

| # | Endpoint | Purpose |
|---|----------|---------|
| 1 | GET `/dod?date=` | Day report: one row per recruiter + total. Default date: today. |
| 2 | GET `/mtd?month=` | Month-to-date: one row per recruiter + total. Default month: current. |
| 3 | GET `/individual?recruiter_id=&period=dod\|mtd&date=&month=` | Single recruiter DOD or MTD. `recruiter_id` required. |
| 4 | GET `/company-wise?month=` | Company-wise funnel. Optional month for MTD; omit for all-time. |
| 5 | GET `/client-report?company_id=&date=&month=` | One company: MTD and DOD side by side. |
| 6 | GET `/negative-funnel/not-interested-remarks?date=&month=` | Not-interested remarks by remark and job role. |
| 7 | GET `/interview-status-company-wise?date=` | Interview status by company for one day. Default date: today. |

Backend files: `admin-recruiter-performance.service.ts`, `admin-recruiter-performance.controller.ts`; controller and service registered in `admin.module.ts`.

**3. Already in place (verified)**  
Recruiter auth, master data (recruiters, companies with `job_roles`, job-roles, candidates), applications CRUD, `POST /api/recruiter/applications/with-candidate`, dashboard stats/pipeline/today-progress, and application list filters (search, company_id, interview_scheduled, etc.) and response shapes already matched the requirements.

### Optional next steps

- Add or adjust specific metrics or response fields for any of the new recruiter-performance endpoints if product needs change.

---

## 7. Reference index

| Document | Content |
|----------|---------|
| **APIS_REQUIRED_BY_FRONTEND.md** | Checklist of every endpoint frontend calls; recruiter + admin. |
| **ADMIN_RECRUITER_PERFORMANCE_APIS.md** | Full API spec for admin recruiter performance (DOD, MTD, individual, company-wise, client report, negative funnel, interview status). |
| **RECRUITER_APPLICATIONS_LIST_API.md** | Applications list: pagination, filters, sort, response shape. |
| **SEARCH_AND_FILTER_APIS.md** | Server-side search and filter behaviour. |
| **RECRUITER_TODAY_PROGRESS_API.md** | Today-only pipeline counts (dashboard/today-progress). |
| **RECRUITER_CREATE_CANDIDATE_WITH_APPLICATION_API.md** | Transactional create candidate + application. |
| **RECRUITER_APPLICATION_UPDATE_API.md** | PATCH application fields. |
| **ADMIN_CRUD_API_REFERENCE.md** | Admin users, companies, jobs CRUD. |
| **ADMIN_PANEL_API_DOCUMENTATION.md** | Admin panel API overview. |
| **ADMIN_JOB_APPLICATIONS.md** | Admin job (portal) applications. |
| **ADMIN_DASHBOARD_AND_ANALYTICS_API.md** | Admin dashboard and analytics. |
| **REQUIREMENTS.md** | Recruiter portal API details and status mapping. |
| **BACKEND_INTEGRATION.md** | Frontend integration (env, auth, field mapping). |

---

**Document version:** 1.1  
**Last updated:** 2026-03-16
