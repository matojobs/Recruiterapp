# Admin Recruiter Performance APIs

This document specifies the **admin-only** endpoints for recruiter performance visibility: **all recruiter performance**, **individual recruiter performance**, **day report (DOD)**, **month report (MTD)**, **company-wise data**, and **negative funnel** (not interested remarks, rejected, backout).

- **Base path:** `/api/admin/recruiter-performance` (or `/api/admin/recruiter-performance/*`)
- **Auth:** Admin Bearer token (same as existing admin APIs).

Data is sourced from the **recruitment pipeline** (applications with `call_status`, `interested_status`, `interview_status`, `selection_status`, `joining_status`, `not_interested_remark`, etc.), not from the job-portal applications API.

---

## 1. Day Report (DOD) — All Recruiters

**GET** `/api/admin/recruiter-performance/dod`

Returns one row per recruiter plus a **Total** row for **today only** (DOD = Day Over Day).

### Query parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | string | Optional. Date in `YYYY-MM-DD`. Default: today (server date). |

### Response shape

```json
{
  "date": "2026-02-18",
  "rows": [
    {
      "recruiter_id": "143",
      "recruiter_name": "Palak",
      "assigned": 10,
      "attempt": 8,
      "connected": 5,
      "interested": 2,
      "not_relevant": 1,
      "not_interested": 1,
      "interview_sched": 1,
      "sched_next_day": 0,
      "today_selection": 0,
      "rejected": 0,
      "today_joining": 0,
      "interview_done": 0,
      "interview_pending": 1
    }
  ],
  "total": {
    "assigned": 50,
    "attempt": 40,
    "connected": 25,
    "interested": 8,
    "not_relevant": 5,
    "not_interested": 10,
    "interview_sched": 4,
    "sched_next_day": 1,
    "today_selection": 0,
    "rejected": 0,
    "today_joining": 0,
    "interview_done": 2,
    "interview_pending": 2
  }
}
```

**Stage semantics for “today”:**

- **assigned:** applications with `assigned_date` = date (or created that day).
- **attempt:** applications with `call_date` = date (call attempted).
- **connected:** `call_date` = date and `call_status` = 'Connected'.
- **interested:** `call_date` = date and `interested_status` = 'Yes'.
- **not_relevant / not_interested:** same day + corresponding status/remark.
- **interview_sched:** interview scheduled (e.g. `interview_scheduled` = true and activity on date).
- **sched_next_day:** scheduled for next day (backend-defined rule).
- **today_selection / rejected / today_joining / interview_done / interview_pending:** selection_status, joining_status, interview_status counts for that day.

---

## 2. Month Report (MTD) — All Recruiters

**GET** `/api/admin/recruiter-performance/mtd`

Same structure as DOD but for **month-to-date** (from 1st of current month up to and including today).

### Query parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `month` | string | Optional. `YYYY-MM`. Default: current month. |

### Response shape

```json
{
  "month": "2026-02",
  "rows": [
    {
      "recruiter_id": "143",
      "recruiter_name": "Arushi",
      "assigned": 1553,
      "attempt": 1553,
      "connected": 613,
      "interested": 118,
      "interview_sched": 107,
      "sched_next_day": 22,
      "selection": 5,
      "total_joining": 3,
      "yet_to_join": 0,
      "backout": 2,
      "hold": 0
    }
  ],
  "total": {
    "assigned": 4488,
    "attempt": 4488,
    "connected": 2594,
    "interested": 418,
    "interview_sched": 395,
    "sched_next_day": 68,
    "selection": 34,
    "total_joining": 21,
    "yet_to_join": 2,
    "backout": 10,
    "hold": 0
  }
}
```

Percentages (e.g. Connected %, Interested %) can be computed on the frontend from these counts.

---

## 3. Individual Recruiter Performance

**GET** `/api/admin/recruiter-performance/individual`

Returns metrics for **one recruiter** for either a single day (DOD) or month (MTD).

### Query parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `recruiter_id` | string | **Required.** Recruiter ID. |
| `period` | string | `dod` \| `mtd`. Default: `mtd`. |
| `date` | string | For `dod`: `YYYY-MM-DD`. Default: today. |
| `month` | string | For `mtd`: `YYYY-MM`. Default: current month. |

### Response shape (same row shape as DOD or MTD, single recruiter)

```json
{
  "recruiter_id": "143",
  "recruiter_name": "Shilpi",
  "period": "mtd",
  "month": "2026-02",
  "assigned": 1273,
  "attempt": 1273,
  "connected": 816,
  "interested": 112,
  "interview_sched": 110,
  "sched_next_day": 0,
  "selection": 14,
  "total_joining": 9,
  "yet_to_join": 2,
  "backout": 3,
  "hold": 0
}
```

For `period=dod`, the backend returns the same kind of counts as in the DOD report for that recruiter and date.

---

## 4. Company-wise Data

**GET** `/api/admin/recruiter-performance/company-wise`

Aggregates pipeline metrics **by company** (via job_role → company). Not limited to a single day; typically **all-time or MTD** (backend can add `month` param if needed).

### Query parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `month` | string | Optional. `YYYY-MM` for MTD. If omitted, backend may return all-time. |

### Response shape

```json
{
  "rows": [
    {
      "company_id": "16",
      "company_name": "Shiprocket",
      "current_openings": 50,
      "total_screened": 581,
      "interview_scheduled": 57,
      "interview_done": 31,
      "interview_pending": 1,
      "rejected": 27,
      "selected": 9,
      "joined": 3,
      "hold": 0,
      "yet_to_join": 1,
      "backout": 5
    }
  ],
  "total": {
    "current_openings": 130,
    "total_screened": 5269,
    "interview_scheduled": 442,
    "interview_done": 132,
    "interview_pending": 1,
    "rejected": 92,
    "selected": 43,
    "joined": 25,
    "hold": 0,
    "yet_to_join": 2,
    "backout": 15
  }
}
```

`current_openings` may come from a jobs/openings table; other fields from applications aggregated by company.

---

## 5. Client / Company Recruitment Report (MTD vs DOD)

**GET** `/api/admin/recruiter-performance/client-report`

For a **single company (client)**, returns MTD and DOD metrics side by side (e.g. Interview Scheduled, Turnup, Interview Done, Rejected, Selection, Joined, Yet To Join, Backout).

### Query parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `company_id` | string | **Required.** Company ID. |
| `date` | string | Optional. For DOD. Default: today. |
| `month` | string | Optional. For MTD. Default: current month. |

### Response shape

```json
{
  "company_id": "16",
  "company_name": "Spinny",
  "mtd": {
    "interview_scheduled": 1,
    "turnup": 0,
    "interview_done": 0,
    "rejected_status": 0,
    "selection_status": 0,
    "joined": 0,
    "yet_to_join": 0,
    "backout": 0
  },
  "dod": {
    "interview_scheduled": 0,
    "turnup": 0,
    "interview_done": 0,
    "rejected_status": 0,
    "selection_status": 0,
    "joined": 0,
    "yet_to_join": 0,
    "backout": 0
  }
}
```

---

## 6. Negative Funnel — Not Interested Remarks (Job Role wise, DOD)

**GET** `/api/admin/recruiter-performance/negative-funnel/not-interested-remarks`

Returns counts of **not interested** remarks grouped by **remark** and **job role** (and optionally by date for DOD).

### Query parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | string | Optional. `YYYY-MM-DD` for DOD. Default: today. |
| `month` | string | Optional. `YYYY-MM` for MTD. If both omitted, backend may use today. |

### Response shape

```json
{
  "date": "2026-02-18",
  "remarks": [
    {
      "remark": "Not Looking For Job",
      "by_job_role": [
        { "job_role_id": "1", "job_role_name": "TeleSales", "count": 875 },
        { "job_role_id": "2", "job_role_name": "Collection Executive", "count": 320 }
      ],
      "total": 2482
    }
  ],
  "totals_by_job_role": [
    { "job_role_id": "1", "job_role_name": "TeleSales", "total": 1570 }
  ],
  "grand_total": 4651
}
```

Frontend can render a matrix: rows = remarks, columns = job roles, cells = count.

---

## 7. Interview Status Company-wise (DOD)

**GET** `/api/admin/recruiter-performance/interview-status-company-wise`

Interview status counts **by company** for a given day (DOD).

### Query parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | string | Optional. `YYYY-MM-DD`. Default: today. |

### Response shape

```json
{
  "date": "2026-02-18",
  "rows": [
    {
      "company_id": "16",
      "company_name": "Spinny",
      "int_sched": 1,
      "int_done": 0,
      "inter_pending": 0,
      "selected": 0,
      "joined": 0,
      "on_hold": 0,
      "yet_to_join": 0,
      "backout": 0
    }
  ],
  "total": {
    "int_sched": 1,
    "int_done": 0,
    "inter_pending": 0,
    "selected": 0,
    "joined": 0,
    "on_hold": 0,
    "yet_to_join": 0,
    "backout": 0
  }
}
```

---

## 8. Errors

- **401 Unauthorized** — Missing or invalid admin token.
- **403 Forbidden** — Admin not allowed to view recruiter performance.
- **404** — Resource not found (e.g. invalid recruiter_id or company_id).
- **500** — Server error.

---

## 9. Summary for backend

| Endpoint | Purpose |
|----------|---------|
| `GET /api/admin/recruiter-performance/dod?date=` | Day report, all recruiters + total |
| `GET /api/admin/recruiter-performance/mtd?month=` | Month report, all recruiters + total |
| `GET /api/admin/recruiter-performance/individual?recruiter_id=&period=dod\|mtd&date=&month=` | Single recruiter DOD or MTD |
| `GET /api/admin/recruiter-performance/company-wise?month=` | Company-wise funnel (MTD or all-time) |
| `GET /api/admin/recruiter-performance/client-report?company_id=&date=&month=` | One company MTD + DOD |
| `GET /api/admin/recruiter-performance/negative-funnel/not-interested-remarks?date=&month=` | Not interested remarks by job role (negative funnel) |
| `GET /api/admin/recruiter-performance/interview-status-company-wise?date=` | Interview status by company (DOD) |

All endpoints use **admin** auth and read from the **recruitment pipeline** data (applications with call_status, interview_status, selection_status, joining_status, not_interested_remark, etc.).
