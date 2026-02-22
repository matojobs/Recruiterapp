# Admin Panel

The admin panel is a separate area of the app under `/admin`, with its own login and permission-based UI.

## Routes

| Path | Permission | Description |
|------|------------|-------------|
| `/admin` | - | Redirects to dashboard or login |
| `/admin/login` | - | Admin login (POST /api/admin/auth/login) |
| `/admin/dashboard` | view_dashboard, view_analytics | Stats + user/job/application analytics tabs |
| `/admin/users` | view_users | List users, create/edit/delete/verify/suspend (permission-gated) |
| `/admin/companies` | view_companies | List companies, pagination |
| `/admin/jobs` | view_jobs | List jobs, pagination |
| `/admin/bulk-upload` | bulk_operations | Validate + upload JSON, upload history |
| `/admin/settings` | manage_settings | Key/value settings table, inline edit, save |
| `/admin/logs` | admin role | Error logs |
| `/admin/activity-logs` | view_logs | Activity logs table; export (export_data) |
| `/admin/forbidden` | - | 403 page |

## Tech

- **Auth:** JWT in `localStorage` under key `admin_access_token` (separate from recruiter token).
- **API base:** Same as recruiter: `NEXT_PUBLIC_API_BASE_URL` (e.g. `http://localhost:5000/api`). All admin calls use `/api/admin/*`.
- **State:** Zustand store in `lib/admin/store.ts` (token, permissions, admin name). Permissions are hydrated on load via GET `/api/admin/auth/permissions`.
- **UI:** Tailwind, Framer Motion, Recharts. Permission-aware sidebar and actions via `PermissionGuard` and `useHasPermission`.

## API contract

**Full API spec:** [docs/ADMIN_PANEL_API_DOCUMENTATION.md](./ADMIN_PANEL_API_DOCUMENTATION.md) – all endpoints, request/response shapes, permissions, and quick reference table.

- POST `/api/admin/auth/login` – email, password; returns token + permissions.
- GET `/api/admin/auth/permissions` – returns current permissions (used on app load).
- Dashboard (stats + analytics), users, companies, jobs, bulk upload, settings, logs, activity logs – each with required permission. 401 → redirect to login; 403 → hide/disable UI or show permission denied.

## Running

1. Backend must be running and expose `/api/admin/*` (see backend repo).
2. Set `NEXT_PUBLIC_API_BASE_URL` if the API is not at `http://localhost:5000/api`.
3. Run the app and open `/admin` or `/admin/login`. After login you are redirected to `/admin/dashboard`.

## Permissions (from API)

Menu items and actions are shown only if the admin has the required permission. Permissions are not hardcoded; they come from the API (`GET /api/admin/auth/permissions` and the login response).
