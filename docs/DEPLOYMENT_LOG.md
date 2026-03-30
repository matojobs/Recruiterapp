# Deployment Log

Project: **Recruiter App / HRMS** (Sourcing Tracker)
Purpose: Chronological record of all deployments to staging and production.

---

## Format

Each entry should include:

- **Date** (YYYY-MM-DD)
- **Environment** — `production` | `staging` | `local`
- **Platform** — e.g., `Vercel`, `AWS EC2`, `manual`
- **Branch/Commit** — branch name or commit hash deployed
- **Summary** — what was deployed
- **Status** — `success` | `failed` | `rolled-back`
- **Notes** (optional) — issues encountered, rollback steps, env changes

---

## Entries

### 2026-03-30 — Data accuracy fixes + expected_joining_date + follow-up edit + interview date lock

- **Environment:** production
- **Platform:** Vercel (frontend auto-deploy) + manual SSH build on server (backend)
- **Branch/Commit:** frontend `main` @ `7a249c8` · backend `feature/sourcing-datalake` @ `197c8a9`
- **Summary:**
  - **Admin Recruiter Performance — data accuracy overhaul:** Fixed all DOD/MTD/company-wise metrics that were using `updated_at` as date anchor instead of actual event fields (`interview_date`, `call_date`, etc.). Fixed: `call_back_later` (was counting same as `not_interested`), `today_selection`, `rejected`, `backout=0` (COALESCE fix), `current_openings` (was hardcoded 0). Added `rejected` + `not_interested` columns to MTD. Added total row + `date` field to interview-status-company-wise response. Added total row to company-wise.
  - **Interview outcome date lock:** `EditCandidateModal` now blocks Done/Not Attended/Rejected options until interview date has passed. Shows amber hint when locked.
  - **New field `expected_joining_date`:** Added to DB (`ALTER TABLE`), backend entity/DTO/service, frontend types/mappers/modal. Visible in edit form when candidate is Selected and not yet Joined. Shown on follow-up cards.
  - **Follow-ups page inline edit:** Added Edit button per card opening `EditCandidateModal` directly — recruiters no longer need to navigate away.
- **Status:** success ✅
- **DB migration:** `ALTER TABLE sourcing.applications ADD COLUMN IF NOT EXISTS expected_joining_date DATE;` — run on server via SSH before container restart.
- **Notes:** Backend built directly on server (`/tmp/backend-build`) via `git pull` + `docker build` since Docker Desktop was not running locally. SSH via cloudflared tunnel `ssh.jobsmato.com:2222`, key at `E:\git ssh key\id_ed25519_github`, user `jobsmato`.

---

### 2026-03-23 — Admin dashboard overhaul + UI improvements + admin candidates page

- **Environment:** production
- **Platform:** Vercel (auto-deploy on push to `main`)
- **Branch/Commit:** `main` @ `cab1d8c`
- **Summary:**
  - **Admin dashboard:** Today's Performance table (Name | Interview | Selection | Joining | Fut Scheduled + Sum row) from DOD endpoint; sourcing KPI strip (Assigned/Attempts/Connected/Interested/Interviews/Selected/Joined) driven by DOD totals; MTD summary with graceful empty state; section labels (Sourcing — Today / Job Portal).
  - **AdminSidebar:** SVG icons replacing letter placeholders; nav grouped into Sourcing / Job Portal / System sections; active dot indicator; smooth collapse transition.
  - **Admin candidates page** (`/admin/candidates`): new page using `GET /api/admin/sourcing/applications` endpoint (no RecruiterGuard); table with all recruiter candidates, filters (call/selection/joining status, search), pagination, status badges.
  - **lib/admin/api.ts:** Fixed `getRecruiterPerformanceDOD` and `getRecruiterPerformanceMTD` to extract Total row from `rows[]` (backend appends it as last item, not a separate `total` field) — KPI strip and MTD summary now show real data.
  - **Candidates page:** Filters rewrite (inline toolbar + More toggle for advanced filters); FlowTracking rewrite (core metrics + action items with icons); ApplicationsTable rewrite (sticky frozen columns, zebra rows, merged pagination bar); loading skeleton; correct layout order (Header → FlowTracking → Filters → Table).
  - **PipelineFlow:** Hide zero-count stages; conversion rate computed vs previous visible stage.
  - **StatsCards:** Redesigned with icons and color accents.
  - **api-mappers:** Fixed `mapPipelineFlow` connected calculation (callDone − non-answered statuses); added `followupsDue` field throughout.
- **Status:** success ✅
- **Notes:** Requires backend commit `9222503` (`feature/sourcing-datalake`) deployed to `api.jobsmato.com` for admin sourcing + followups_due endpoints.

---

### 2026-03-21 — Initial deployment log created

- **Environment:** —
- **Summary:** Created DEPLOYMENT_LOG.md to track all future deployments.
- **Status:** —
