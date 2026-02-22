# Backend API Requests

Simple list of what the frontend needs from the backend so the admin panel and recruiter app work correctly.

---

## What’s going wrong (in simple words)

1. **Admin login returns 401**  
   We call `POST /api/admin/auth/login` with email and password. Backend returns 401, so the user never gets a token and can’t use the admin panel.  
   **Needed:** Either the credentials are wrong, or the backend must accept this admin user (role = admin) and return 200 with a token and permissions.

2. **Admin dashboard returns 403**  
   After login (or with an existing token), `GET /api/admin/dashboard/stats` and the analytics endpoints return 403 Forbidden.  
   **Needed:** The admin user must have the `view_analytics` permission so these endpoints return 200 instead of 403.

3. **“Message channel closed” in console**  
   This is from a browser extension (e.g. password manager), not from our app. No backend change needed.

4. **GET /api/admin/users**  
   Per Admin Panel API doc, backend accepts **both** camelCase (`sortBy`, `sortOrder`) and snake_case (`sort_by`, `sort_order`). Frontend sends camelCase. If you still get 400, check backend validation and response shape: `{ users, total, page, limit, totalPages }`.

---

## What we need from backend

### 1. Admin login – return 200 for admin users

- **Endpoint:** `POST /api/admin/auth/login`
- **Body we send:** `{ "email": "...", "password": "..." }`
- **We need:**  
  - For a valid **admin** user (role = admin): return **200** and a JSON body that includes:
    - An access token: either `user.accessToken` or top-level `token`
    - A **permissions** array, e.g. `["view_dashboard", "view_analytics", "view_users", ...]`
    - User info: e.g. `user.fullName` or `user.email`, `user.userId` or `user.id`
  - For wrong password or non-admin user: return **401** is fine; we show “Invalid email or password. This account may not have admin access.”

So: please ensure admin users can log in and get a token + permissions in the response.

---

### 2. Admin dashboard – allow access with `view_analytics`

- **Endpoints:**
  - `GET /api/admin/dashboard/stats`
  - `GET /api/admin/dashboard/analytics/users?days=30`
  - `GET /api/admin/dashboard/analytics/jobs?days=30`
  - `GET /api/admin/dashboard/analytics/applications?days=30`
- **We need:**  
  When the request has a valid admin JWT and the admin user has the **`view_analytics`** permission, these endpoints should return **200** with the usual JSON body (stats object or analytics data).  
  Right now they return **403** for our admin user, so the frontend shows “Permission denied”.  
  **Request:** Assign the `view_analytics` permission to admin users (or to the admin role) so these four endpoints return 200 for them.

---

### 3. Recruiter portal

Recruiter login and recruiter APIs (`/api/auth/login`, `/api/recruiter/*`) are working when the backend is set up correctly. If something is missing, the full list of APIs we call is in **`docs/APIS_REQUIRED_BY_FRONTEND.md`**.

---

## Summary table

| Issue              | Endpoint / area              | What we need from backend                                      |
|--------------------|-----------------------------|-----------------------------------------------------------------|
| Admin can’t log in | `POST /api/admin/auth/login` | Return 200 with `accessToken` (or `token`) and `permissions` for admin users. |
| Dashboard 403      | `GET /api/admin/dashboard/*` | Give admin users the `view_analytics` permission so these return 200. |
| Console “listener” error | N/A                     | No backend change; it’s a browser extension.                    |

If you need exact request/response shapes, see **`docs/ADMIN_PANEL_API_DOCUMENTATION.md`** and **`docs/APIS_REQUIRED_BY_FRONTEND.md`**.
