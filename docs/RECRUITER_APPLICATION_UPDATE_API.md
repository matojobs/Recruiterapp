# Recruiter Application Update API — Backend Request

This document specifies the **PATCH** endpoint used by the recruiter portal to update a candidate application (Edit Candidate modal). The backend should accept and persist **all** fields listed below so that recruiter edits are not lost.

---

## 1. Endpoint

| Method | Endpoint | Auth |
|--------|----------|------|
| **PATCH** | `/api/recruiter/applications/:id` | `Authorization: Bearer <recruiter_token>` |

- **`:id`** — Application ID (e.g. `1`).
- Request body: JSON, all fields optional (partial update). Use **snake_case** for all keys.

---

## 2. Request body — all fields (snake_case)

The frontend sends the following fields when the recruiter saves from **Edit Candidate**. The backend should accept each field and persist it to the application record. Do not drop or ignore any of these.

| Field | Type | Description |
|-------|------|-------------|
| `portal` | `string \| null` | Source portal (e.g. Naukri, LinkedIn, WorkIndia). |
| `assigned_date` | `string \| null` | Date assigned to recruiter, `YYYY-MM-DD`. |
| `call_date` | `string \| null` | Date of call, `YYYY-MM-DD`. |
| `call_status` | `string \| null` | One of: `Busy`, `RNR`, `Connected`, `Wrong Number`, `Switch off`. |
| `interested_status` | `string \| null` | One of: `Yes`, `No`, `Call Back Later`. |
| `not_interested_remark` | `string \| null` | Remark when candidate is not interested. |
| `interview_scheduled` | `boolean` | Whether an interview is scheduled. |
| `interview_date` | `string \| null` | Interview date, `YYYY-MM-DD`. |
| `turnup` | `boolean \| null` | Whether candidate turned up for interview. |
| `interview_status` | `string \| null` | One of: `Scheduled`, `Done`, `Not Attended`, `Rejected`. |
| `selection_status` | `string \| null` | One of: `Selected`, `Not Selected`, `Pending`. |
| `joining_status` | `string \| null` | One of: `Joined`, `Not Joined`, `Pending`, `Backed Out`. |
| `joining_date` | `string \| null` | Date of joining, `YYYY-MM-DD`. |
| `backout_date` | `string \| null` | Date candidate backed out, `YYYY-MM-DD`. |
| `backout_reason` | `string \| null` | Reason for backing out. |
| `hiring_manager_feedback` | `string \| null` | Feedback from hiring manager. |
| `followup_date` | `string \| null` | Next follow-up date, `YYYY-MM-DD`. |
| `notes` | `string \| null` | Free-text notes. |

---

## 3. Fields that must be supported (currently missing or unclear)

Please ensure the backend **accepts and stores** at least these; the frontend already sends them and they were reported as not persisting:

- **`interview_scheduled`** — boolean  
- **`interview_date`** — string (date) or null  
- **`interview_status`** — string or null (`Scheduled` \| `Done` \| `Not Attended` \| `Rejected`)  
- **`turnup`** — boolean or null  
- **`portal`** — string or null  
- **`assigned_date`** — string (date) or null  
- **`not_interested_remark`** — string or null  
- **`backout_date`** — string (date) or null  
- **`backout_reason`** — string or null  
- **`hiring_manager_feedback`** — string or null  
- **`followup_date`** — string (date) or null  

The same list applies to **GET** responses: the application object returned by `GET /api/recruiter/applications` and `GET /api/recruiter/applications/:id` should include these fields (snake_case) so the Edit Candidate form can load and save them correctly.

---

## 4. Example PATCH body

```json
{
  "portal": "WorkIndia",
  "assigned_date": "2026-02-25",
  "call_date": "2026-02-25",
  "call_status": "Connected",
  "interested_status": "Yes",
  "not_interested_remark": null,
  "interview_scheduled": true,
  "interview_date": "2026-03-01",
  "turnup": null,
  "interview_status": "Scheduled",
  "selection_status": null,
  "joining_status": null,
  "joining_date": null,
  "backout_date": null,
  "backout_reason": null,
  "hiring_manager_feedback": null,
  "followup_date": "2026-03-05",
  "notes": null
}
```

---

## 5. Response

- **200 OK** — Return the updated application object (same shape as `GET /api/recruiter/applications/:id`), including all fields above so the frontend can refresh the row/modal.
- **4xx/5xx** — Standard error response; frontend will show a generic error.

---

## 6. Summary for backend

- **Endpoint:** `PATCH /api/recruiter/applications/:id`
- **Auth:** Recruiter JWT.
- **Body:** JSON, snake_case, partial update. Support **every** field in the table in §2; in particular do not omit `interview_scheduled`, `interview_date`, `interview_status`, or any of the other fields listed in §3.
- **GET responses:** Include the same fields in application objects for `GET /api/recruiter/applications` and `GET /api/recruiter/applications/:id`.
