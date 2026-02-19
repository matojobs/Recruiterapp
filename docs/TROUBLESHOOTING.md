# Troubleshooting Guide

## Common Issues and Solutions

### 404 Errors for Next.js Static Assets

**Symptoms:**
- `GET /_next/static/css/app/layout.css 404`
- `GET /_next/static/chunks/main-app.js 404`
- Other `/_next/static/` files returning 404

**Solution:**
1. Stop the dev server (Ctrl+C)
2. Clear Next.js cache:
   ```bash
   # Windows PowerShell
   Remove-Item -Recurse -Force .next
   
   # Or manually delete the .next folder
   ```
3. Restart dev server:
   ```bash
   npm run dev
   ```

### Login Works But Dashboard Shows Errors

**Symptoms:**
- Login successful but `backend.map is not a function` errors
- Dashboard fails to load data

**Solution:**
- Already fixed! The code now handles both array and object responses from backend
- Hard refresh browser (Ctrl+Shift+R) to clear cache

### CORS Errors

**Symptoms:**
- `Access to fetch at '...' has been blocked by CORS policy`
- OPTIONS request returns 404

**Solution:**
- See `docs/BACKEND_CORS_FIX.md` for backend configuration
- Backend must handle OPTIONS requests and return CORS headers

### Port Already in Use

**Symptoms:**
- `Error: listen EADDRINUSE: address already in use :::3100`

**Solution:**
```bash
# Find and kill process on port 3100
# Windows PowerShell
Get-NetTCPConnection -LocalPort 3100 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }

# Or change port in package.json
```

### Build Errors

**Symptoms:**
- TypeScript errors during build
- Module not found errors

**Solution:**
```bash
# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# Then rebuild
npm run build
```

### Browser Cache Issues

**Symptoms:**
- Old code still running after changes
- Console shows old line numbers

**Solution:**
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Open DevTools → Application → Clear Storage → Clear site data

## Quick Fixes

### Restart Everything
```bash
# Stop dev server (Ctrl+C)
# Clear cache
Remove-Item -Recurse -Force .next
# Restart
npm run dev
```

### Check Dev Server Status
- Make sure `npm run dev` is running
- Check terminal for errors
- Verify port 3100 is accessible: http://localhost:3100

### Verify Environment Variables
Check `.env.local` has:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

## Getting Help

1. Check browser console for specific errors
2. Check terminal where `npm run dev` is running
3. Check Network tab in DevTools for failed requests
4. Review relevant documentation in `docs/` folder
