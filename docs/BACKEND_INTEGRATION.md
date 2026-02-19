# Backend API Integration Guide

This document explains how to enable and use the live backend API integration.

## Overview

The application supports two modes:
1. **Local Mode** (default): Uses localStorage for data persistence
2. **Backend Mode**: Connects to live backend API with JWT authentication

## Configuration

### Environment Variables

Add these to your `.env.local` file:

```env
# Enable backend API integration
NEXT_PUBLIC_USE_BACKEND=true

# Backend API base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
# Or for production:
# NEXT_PUBLIC_API_BASE_URL=https://api.jobsmato.com/api

# Optional: Separate auth base URL (defaults to API_BASE_URL)
# NEXT_PUBLIC_AUTH_BASE_URL=http://localhost:5000/api
```

### Switching Modes

- **Local Mode**: Set `NEXT_PUBLIC_USE_BACKEND=false` or omit it
- **Backend Mode**: Set `NEXT_PUBLIC_USE_BACKEND=true` and configure `NEXT_PUBLIC_API_BASE_URL`

## Authentication Flow

### Login

When `USE_BACKEND_API` is enabled:
1. User submits email/password on login page
2. Frontend calls `POST /api/auth/login` (no `/recruiter` prefix)
3. Backend returns `{ accessToken, user }`
4. Token is stored in `localStorage` as `recruiter_auth_token`
5. User info is stored as `current_user` JSON

### API Requests

All API requests automatically include the JWT token:
```
Authorization: Bearer <JWT_TOKEN>
```

### Logout

Logout clears:
- JWT token from localStorage
- Current user info
- Redirects to login page

## Field Name Mapping

The backend uses different field names than the frontend expects. The integration layer automatically maps:

| Backend Field | Frontend Field |
|--------------|---------------|
| `name` (company) | `company_name` |
| `role_name` | `job_role` |
| `total_applications` | `totalSourced` |
| `connected_calls` | `connectedToday` |
| `start_date` / `end_date` | `date_from` / `date_to` |

See `lib/api-mappers.ts` for complete mapping logic.

## API Endpoints

All recruiter endpoints use the `/api/recruiter/*` prefix:

- `GET /api/recruiter/recruiters` - List recruiters
- `GET /api/recruiter/companies` - List companies
- `GET /api/recruiter/job-roles` - List job roles
- `POST /api/recruiter/job-roles` - Create job role
- `GET /api/recruiter/candidates` - List candidates
- `POST /api/recruiter/candidates` - Create candidate
- `GET /api/recruiter/applications` - List applications (with filters)
- `GET /api/recruiter/applications/:id` - Get application
- `POST /api/recruiter/applications` - Create application
- `PATCH /api/recruiter/applications/:id` - Update application
- `DELETE /api/recruiter/applications/:id` - Delete application
- `GET /api/recruiter/dashboard/stats` - Dashboard statistics
- `GET /api/recruiter/dashboard/pipeline` - Pipeline breakdown

See `docs/REQUIREMENTS.md` for complete API documentation.

## Error Handling

- **401 Unauthorized**: Token expired/invalid → Redirects to login
- **Other errors**: Displays error message from backend response
- **Network errors**: Shows generic error message

## Development Tips

1. **Test Backend Mode**: Set `NEXT_PUBLIC_USE_BACKEND=true` and ensure backend is running
2. **Test Local Mode**: Set `NEXT_PUBLIC_USE_BACKEND=false` or omit the env var
3. **Check Token**: Inspect `localStorage.getItem('recruiter_auth_token')` in browser DevTools
4. **API Debugging**: Check Network tab for API requests/responses
5. **Field Mapping Issues**: Check `lib/api-mappers.ts` if data doesn't match expectations

## Troubleshooting

### Token Not Sent
- Check `lib/api-client.ts` - `getAuthToken()` should return token from localStorage
- Verify token is stored after login

### Field Name Mismatches
- Check `lib/api-mappers.ts` for correct mapping
- Verify backend response structure matches expected types

### CORS Issues
- Ensure backend allows requests from frontend origin
- Check backend CORS configuration

### 401 Errors
- Token may be expired - try logging in again
- Check token format in Authorization header
- Verify backend JWT validation

## Files Modified

- `lib/api-client.ts` - API client with JWT handling
- `lib/api-mappers.ts` - Field name transformation
- `lib/backend-api.ts` - Backend API functions
- `lib/auth-helper.ts` - Unified auth helper
- `lib/data.ts` - Mode switching logic
- `app/(auth)/login/page.tsx` - Backend login support
- `components/layout/Header.tsx` - Backend logout support
- All page components - Conditional local storage init
