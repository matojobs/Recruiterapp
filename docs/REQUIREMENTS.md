# Backend API Requirements

This document describes the **actual API contract** for the Recruiter App frontend to work with your live backend. All routes use the `/api/recruiter/*` prefix and require JWT authentication.

---

## 1. Overview

- **Base URL:** `https://api.jobsmato.com/api/recruiter` (production) or `http://localhost:5000/api/recruiter` (local)
- **Authentication:** JWT token required in `Authorization: Bearer <TOKEN>` header for all endpoints
- **Content type:** JSON for request and response bodies (`Content-Type: application/json`)
- **Dates:** ISO 8601 date strings (`YYYY-MM-DD` for dates, full ISO for timestamps)
- **Field naming:** All fields use `snake_case` (e.g. `candidate_id`, `call_status`, `assigned_date`)

---

## 2. Authentication

### Login Endpoint

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "recruiter@example.com",
  "password": "your_password"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "recruiter@example.com",
    "role": "recruiter"
  }
}
```

**All subsequent requests must include:**
```
Authorization: Bearer <accessToken>
```

---

## 3. Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Human readable error message",
  "error": "Bad Request",
  "timestamp": "2026-02-19T12:00:00.000Z",
  "path": "/api/recruiter/applications"
}
```

**Common status codes:**
- `400 Bad Request` - Validation error, duplicate application
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Not a recruiter or inactive account
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## 4. Status Value Mapping

**Important:** Backend stores statuses as SMALLINT internally but **always accepts and returns string values** in API requests/responses.

### Call Status
| API Value (String) | Database (SMALLINT) |
|-------------------|---------------------|
| "Busy"            | 1                   |
| "RNR"             | 2                   |
| "Connected"       | 3                   |
| "Wrong Number"    | 4                   |

### Interested Status
| API Value (String) | Database (SMALLINT) |
|-------------------|---------------------|
| "Yes"             | 1                   |
| "No"              | 2                   |
| "Call Back Later" | 3                   |

### Selection Status
| API Value (String) | Database (SMALLINT) |
|-------------------|---------------------|
| "Selected"        | 1                   |
| "Not Selected"    | 2                   |
| "Pending"          | 3                   |

### Joining Status
| API Value (String) | Database (SMALLINT) |
|-------------------|---------------------|
| "Joined"          | 1                   |
| "Not Joined"      | 2                   |
| "Pending"          | 3                   |
| "Backed Out"       | 4                   |

**Always send string values in API requests; backend handles conversion.**

---

## 5. Master Data Endpoints

### 5.1 Get All Recruiters

```http
GET /api/recruiter/recruiters
Authorization: Bearer <TOKEN>
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "John Recruiter",
    "email": "john@recruiter.com",
    "phone": "+91 9876543210",
    "is_active": true,
    "created_at": "2026-02-01T10:00:00.000Z",
    "updated_at": "2026-02-01T10:00:00.000Z"
  }
]
```

---

### 5.2 Get All Companies

```http
GET /api/recruiter/companies
Authorization: Bearer <TOKEN>
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Tech Corp",
    "industry": "Technology",
    "size": "Large",
    "website": "https://techcorp.com",
    "created_at": "2026-01-15T10:00:00.000Z"
  }
]
```

**Note:** Backend returns `name` (not `company_name`). Frontend may need to map this.

---

### 5.3 Get Job Roles

```http
GET /api/recruiter/job-roles?company_id=1
Authorization: Bearer <TOKEN>
```

**Query Parameters:**
- `company_id` (optional): Filter by company ID

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "company_id": 1,
    "role_name": "Software Engineer",
    "department": "Engineering",
    "created_at": "2026-02-01T10:00:00.000Z"
  }
]
```

**Note:** Backend returns `role_name` (not `job_role`). Frontend may need to map this.

---

### 5.4 Create Job Role

```http
POST /api/recruiter/job-roles
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "company_id": 1,
  "role_name": "Senior Software Engineer",
  "department": "Engineering"
}
```

**Response (201 Created):**
```json
{
  "id": 3,
  "company_id": 1,
  "role_name": "Senior Software Engineer",
  "department": "Engineering",
  "created_at": "2026-02-19T12:00:00.000Z"
}
```

---

### 5.5 Get Candidates

```http
GET /api/recruiter/candidates?search=john
Authorization: Bearer <TOKEN>
```

**Query Parameters:**
- `search` (optional): Search by name, phone, or email

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "candidate_name": "John Doe",
    "phone": "+91 9876543210",
    "email": "john@example.com",
    "qualification": "B.Tech",
    "work_exp_years": 5,
    "portal_id": 1,
    "created_at": "2026-02-01T10:00:00.000Z"
  }
]
```

---

### 5.6 Create Candidate

```http
POST /api/recruiter/candidates
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "candidate_name": "Alice Johnson",
  "phone": "+91 9876543212",
  "email": "alice@example.com",
  "qualification": "B.Tech Computer Science",
  "work_exp_years": 4,
  "portal_id": 1
}
```

**Response (201 Created):**
```json
{
  "id": 3,
  "candidate_name": "Alice Johnson",
  "phone": "+91 9876543212",
  "email": "alice@example.com",
  "qualification": "B.Tech Computer Science",
  "work_exp_years": 4,
  "portal_id": 1,
  "created_at": "2026-02-19T12:00:00.000Z"
}
```

---

## 6. Applications CRUD

### 6.1 Get Applications (with filters)

```http
GET /api/recruiter/applications?page=1&limit=20&call_status=Connected&interested_status=Yes&job_role_id=1
Authorization: Bearer <TOKEN>
```

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Page size
- `recruiter_id` (optional): Filter by recruiter ID
- `job_role_id` (optional): Filter by job role ID
- `company_id` (optional): Filter by company ID
- `call_status` (optional): "Busy", "RNR", "Connected", "Wrong Number"
- `interested_status` (optional): "Yes", "No", "Call Back Later"
- `selection_status` (optional): "Selected", "Not Selected", "Pending"
- `joining_status` (optional): "Joined", "Not Joined", "Pending", "Backed Out"
- `start_date` (optional): Filter from date (ISO: "2026-02-01")
- `end_date` (optional): Filter to date (ISO: "2026-02-28")

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "recruiter_id": 1,
    "candidate_id": 1,
    "job_role_id": 1,
    "assigned_date": "2026-02-05",
    "call_date": "2026-02-06",
    "call_status": "Connected",
    "interested_status": "Yes",
    "selection_status": "Selected",
    "joining_status": "Pending",
    "notes": "Candidate showed strong interest",
    "created_at": "2026-02-05T10:00:00.000Z",
    "updated_at": "2026-02-06T10:00:00.000Z",
    "candidate": {
      "id": 1,
      "candidate_name": "John Doe",
      "phone": "+91 9876543210",
      "email": "john@example.com"
    },
    "job_role": {
      "id": 1,
      "role_name": "Software Engineer",
      "company_id": 1
    },
    "company": {
      "id": 1,
      "name": "Tech Corp"
    }
  }
]
```

**Note:** Backend returns nested `candidate`, `job_role`, and `company` objects. Field names may differ (`role_name` vs `job_role`, `name` vs `company_name`).

---

### 6.2 Get Application by ID

```http
GET /api/recruiter/applications/1
Authorization: Bearer <TOKEN>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "recruiter_id": 1,
  "candidate_id": 1,
  "job_role_id": 1,
  "assigned_date": "2026-02-05",
  "call_date": "2026-02-06",
  "call_status": "Connected",
  "interested_status": "Yes",
  "selection_status": "Selected",
  "joining_status": "Pending",
  "notes": "Candidate showed strong interest",
  "created_at": "2026-02-05T10:00:00.000Z",
  "updated_at": "2026-02-06T10:00:00.000Z",
  "candidate": { /* full candidate object */ },
  "job_role": { /* full job_role object */ },
  "company": { /* full company object */ },
  "recruiter": { /* full recruiter object */ }
}
```

---

### 6.3 Create Application

```http
POST /api/recruiter/applications
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "candidate_id": 1,
  "job_role_id": 1,
  "assigned_date": "2026-02-19",
  "call_date": "2026-02-20",
  "call_status": "Connected",
  "interested_status": "Yes",
  "selection_status": "Pending",
  "joining_status": "Pending",
  "notes": "Initial contact made, candidate interested"
}
```

**Required Fields:**
- `candidate_id` (number)
- `job_role_id` (number)
- `assigned_date` (string, ISO date)

**Optional Fields:**
- `call_date`, `call_status`, `interested_status`, `selection_status`, `joining_status`, `notes`, etc.

**Response (201 Created):**
```json
{
  "id": 2,
  "recruiter_id": 1,
  "candidate_id": 1,
  "job_role_id": 1,
  "assigned_date": "2026-02-19",
  "call_date": "2026-02-20",
  "call_status": "Connected",
  "interested_status": "Yes",
  "selection_status": "Pending",
  "joining_status": "Pending",
  "notes": "Initial contact made, candidate interested",
  "created_at": "2026-02-19T12:00:00.000Z",
  "updated_at": "2026-02-19T12:00:00.000Z"
}
```

**Error (400 Bad Request - Duplicate):**
```json
{
  "statusCode": 400,
  "message": "Application already exists for this candidate, job role, and assigned date",
  "error": "Bad Request"
}
```

---

### 6.4 Update Application

```http
PATCH /api/recruiter/applications/1
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "call_status": "Connected",
  "interested_status": "Yes",
  "selection_status": "Selected",
  "joining_status": "Pending",
  "notes": "Updated: Candidate passed interview"
}
```

**Response (200 OK):** Full application object with relations.

---

### 6.5 Delete Application

```http
DELETE /api/recruiter/applications/1
Authorization: Bearer <TOKEN>
```

**Response (200 OK):**
```json
{
  "message": "Application deleted successfully"
}
```

---

## 7. Dashboard Endpoints

### 7.1 Get Dashboard Statistics

```http
GET /api/recruiter/dashboard/stats
Authorization: Bearer <TOKEN>
```

**Response (200 OK):**
```json
{
  "total_applications": 150,
  "total_candidates": 120,
  "total_calls": 200,
  "avg_calls_per_day": 6.67,
  "connected_calls": 150,
  "interested_candidates": 80,
  "selected_candidates": 45,
  "joined_candidates": 30,
  "conversion_rate": 20.0,
  "call_to_interest_rate": 53.33,
  "interest_to_selection_rate": 56.25,
  "selection_to_join_rate": 66.67
}
```

**Note:** Backend returns different field names than frontend expects. Frontend may need to map:
- `total_applications` → `totalSourced`
- `connected_calls` → `connectedToday`
- `interested_candidates` → `interestedToday`
- etc.

---

### 7.2 Get Pipeline Breakdown

```http
GET /api/recruiter/dashboard/pipeline
Authorization: Bearer <TOKEN>
```

**Response (200 OK):**
```json
[
  {
    "stage": "New Applications",
    "count": 25
  },
  {
    "stage": "Contacted",
    "count": 30
  },
  {
    "stage": "Interested",
    "count": 20
  },
  {
    "stage": "Interview Scheduled",
    "count": 15
  },
  {
    "stage": "Selected",
    "count": 10
  },
  {
    "stage": "Joined",
    "count": 8
  },
  {
    "stage": "Not Interested",
    "count": 12
  },
  {
    "stage": "Rejected",
    "count": 10
  }
]
```

**Note:** Backend returns array of `{ stage, count }` objects. Frontend expects `{ sourced, callDone, connected, ... }` object. Frontend will need to map stages to pipeline flow keys.

---

### 7.3 Get Recruiter Performance Report

```http
GET /api/recruiter/reports/recruiter-performance?start_date=2026-02-01&end_date=2026-02-28
Authorization: Bearer <TOKEN>
```

**Query Parameters:**
- `start_date` (optional): ISO format ("2026-02-01")
- `end_date` (optional): ISO format ("2026-02-28")

**Response (200 OK):**
```json
{
  "recruiter_id": 1,
  "recruiter_name": "John Recruiter",
  "period": {
    "start_date": "2026-02-01",
    "end_date": "2026-02-28"
  },
  "metrics": {
    "total_applications": 150,
    "total_calls": 200,
    "connected_calls": 150,
    "interested_candidates": 80,
    "selected_candidates": 45,
    "joined_candidates": 30,
    "conversion_rate": 20.0,
    "avg_calls_per_day": 6.67
  },
  "daily_breakdown": [ /* ... */ ]
}
```

---

## 8. Summary Checklist

All endpoints use `/api/recruiter/*` prefix:

| # | Endpoint | Method | Purpose |
|---|----------|--------|---------|
| 1 | `/api/recruiter/recruiters` | GET | List recruiters |
| 2 | `/api/recruiter/companies` | GET | List companies |
| 3 | `/api/recruiter/job-roles` | GET, POST | List/create job roles |
| 4 | `/api/recruiter/candidates` | GET, POST | List/create candidates |
| 5 | `/api/recruiter/applications` | GET, POST | List/create applications |
| 6 | `/api/recruiter/applications/:id` | GET, PATCH, DELETE | Get/update/delete application |
| 7 | `/api/recruiter/dashboard/stats` | GET | Dashboard statistics |
| 8 | `/api/recruiter/dashboard/pipeline` | GET | Pipeline breakdown |
| 9 | `/api/recruiter/reports/recruiter-performance` | GET | Recruiter performance report |
| 10 | `/api/auth/login` | POST | Authentication (no prefix) |

---

## 9. Frontend Integration Notes

### Field Name Mapping Required

Backend uses slightly different field names than frontend expects:

| Frontend Expects | Backend Returns | Action |
|------------------|-----------------|--------|
| `company_name` | `name` | Map in response handler |
| `job_role` | `role_name` | Map in response handler |
| `totalSourced` | `total_applications` | Map dashboard stats |
| `connectedToday` | `connected_calls` | Map dashboard stats |
| `sourced`, `callDone`, etc. | `{ stage, count }[]` | Map pipeline array to object |

### Authentication Flow

1. User logs in via `POST /api/auth/login`
2. Store `accessToken` from response
3. Include `Authorization: Bearer <accessToken>` in all subsequent requests
4. Handle `401` responses by redirecting to login

### Date Filter Parameters

Backend uses `start_date`/`end_date` (not `date_from`/`date_to`). Frontend should map query params accordingly.

---

**Last Updated:** 2026-02-19  
**API Version:** 1.0  
**Base URL:** `https://api.jobsmato.com/api/recruiter` (production) or `http://localhost:5000/api/recruiter` (local)
