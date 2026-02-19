# Code Review: Repetition & Future Risk

Review date: 2025-02-18. Focus: repetitive code and code that could cause problems later.

---

## 1. Repetitive code

### 1.1 Applications select string (`lib/queries.ts`)

The same applications select (with recruiter, candidate, job_role, company) was duplicated in multiple places.

**Action taken:** Extracted a single `APPLICATIONS_SELECT` constant in `lib/queries.ts` and reused it across applications reads/writes.

---

### 1.2 API route error handling (`app/api/*`)

API routes repeated the same try/catch + `NextResponse.json({ error: error.message }, { status: 500 })`.

**Action taken:** Added `lib/api-handler.ts` (`withApiHandler`) and updated API routes to use it.

---

### 1.3 Filter parsing (`app/api/applications/route.ts`)

Query param → filter mapping was repetitive.

**Action taken:** Added `lib/parse-query-filters.ts` (`parseApplicationFilters`) and used it in applications GET route.

---

### 1.4 Pipeline flow initialization and calculation duplicated

Multiple places used a repeated “all zeros” pipeline object and repeated “count by status” logic.

**Action taken:**

- Added `EMPTY_PIPELINE_FLOW` in `types/database.ts`
- Added `computePipelineFlowFromApplications(applications)` in `lib/utils.ts`
- Used the helper where company filtering recalculates flow, and in local-db pipeline computation.

---

## 2. Code that could cause problems later

### 2.1 Local DB storing enriched applications (`lib/local-db.ts`)

Local mode previously persisted applications that included nested `recruiter`, `candidate`, and `job_role`, which bloats localStorage and makes future assumptions brittle.

**Action taken:** Introduced `ApplicationRaw` and ensured local-db persists **raw rows only**; relations are joined only at read time.

---

### 2.2 Two data layers (UI vs API)

UI pages originally imported local queries directly.

**Action taken:** Introduced `lib/data.ts` as a single import surface for data access. This is the seam where the app can later switch from local mode to your live backend (see `docs/REQUIREMENTS.md`).

---

### 2.3 Type safety (`any`)

Several places used `any` for filters and payloads.

**Action taken:** Added `ApplicationFilters` and used it in API/local query surfaces to tighten typing.

---

## 3. Summary

Biggest maintainability wins implemented:

- Single source for applications select shape (`APPLICATIONS_SELECT`)
- Centralized API error handling (`withApiHandler`)
- Centralized filter parsing (`parseApplicationFilters`)
- Centralized pipeline computation (`computePipelineFlowFromApplications`)
- Raw-only persistence in local mode (`ApplicationRaw`)
- Single data facade (`lib/data.ts`)

