# 🚀 Start App on Localhost

## Quick Start

The app is already configured to run on **localhost**. Just follow these steps:

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Open in Browser

The app will automatically open at:
- **http://localhost:3100** (or next available port like 3101, 3102)

If port 3000 is busy, Next.js will use the next available port and show you the URL.

### 3. Login

Use these test accounts (any password works in local mode):

- **Email:** `john@recruiter.com`
- **Password:** `anything` (or leave blank)

Other test accounts:
- `jane@recruiter.com`
- `mike@recruiter.com`

## ✅ What You'll See

1. **Login Page** → Enter email and password
2. **Dashboard** → Your personalized recruiter dashboard
3. **Candidates** → Full applications table
4. **Jobs** → Manage job roles
5. **Reports** → Analytics and reports

## 🔧 Troubleshooting

**Port already in use?**
- The app will automatically use the next available port (3001, 3002, etc.)
- Check the terminal output for the actual URL

**Can't access localhost?**
- Make sure the dev server is running (`npm run dev`)
- Check the terminal for the correct port number
- Try: `http://127.0.0.1:3100` instead of `localhost:3100`

**Data not loading?**
- The app uses localStorage (browser storage)
- Data initializes automatically on first login
- Try refreshing the page

## 📝 Notes

- **Local Mode**: All data is stored in your browser's localStorage
- **No Database**: No Supabase or external database needed
- **Offline**: Works completely offline after first load
- **Persistent**: Data saves automatically and persists between sessions

---

**That's it! Your app is running on localhost.** 🎉
