# CORS Configuration Guide

## Issue: OPTIONS Request Returns 404

When making API calls from the frontend, browsers send a CORS preflight OPTIONS request before the actual request. If your backend returns 404 for OPTIONS requests, the actual POST/GET requests will fail.

## Backend Requirements

Your backend **must** handle OPTIONS requests for all API endpoints, especially:

- `OPTIONS /api/auth/login` - Must return 200 OK with CORS headers
- `OPTIONS /api/recruiter/*` - Must return 200 OK with CORS headers

## Required CORS Headers

Your backend should return these headers for OPTIONS requests:

```
Access-Control-Allow-Origin: http://localhost:3100
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

For production, replace `http://localhost:3100` with your frontend domain.

## Example Backend Implementation

### Express.js Example

```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3100');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
```

### NestJS Example

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: 'http://localhost:3100',
    methods: 'GET,POST,PATCH,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true,
  });
  
  await app.listen(5000);
}
```

## Testing

1. Start your backend server
2. Test OPTIONS request manually:
   ```bash
   curl -X OPTIONS http://localhost:5000/api/auth/login \
     -H "Origin: http://localhost:3100" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -v
   ```
3. Should return 200 OK with CORS headers

## Frontend Configuration

The frontend is configured to call:
- Login: `http://localhost:5000/api/auth/login`
- API: `http://localhost:5000/api/recruiter/*`

Make sure your `.env.local` has:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

## Common Issues

1. **404 on OPTIONS**: Backend doesn't handle OPTIONS requests → Add OPTIONS handler
2. **CORS error**: Missing CORS headers → Add CORS middleware
3. **401 on POST**: Token not sent → Check Authorization header
4. **Network error**: Backend not running → Start backend server
