# Local Mode Setup

The app now runs **completely offline** using browser localStorage - no database connection needed!

## ✅ How It Works

- All data is stored in your browser's localStorage
- No Supabase setup required
- Works immediately after `npm install` and `npm run dev`

## 🚀 Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Run the app:**
```bash
npm run dev
```

3. **Login with dummy accounts:**
   - Go to `http://localhost:3000` (or the port shown)
   - You'll be redirected to `/login`
   - Use any of these emails (password can be anything):
     - `john@recruiter.com`
     - `jane@recruiter.com`
     - `mike@recruiter.com`

## 📊 Test Accounts

| Email | Password | Applications |
|-------|----------|--------------|
| `john@recruiter.com` | Any | 3 applications |
| `jane@recruiter.com` | Any | 3 applications |
| `mike@recruiter.com` | Any | 2 applications |

**Note:** In local mode, any password works - the system only checks the email.

## 🎯 Features Available

✅ **Dashboard** - Personalized dashboard for each recruiter
✅ **Candidates** - Full applications table with inline editing
✅ **Jobs** - Manage job roles
✅ **Reports** - Pipeline and company reports
✅ **Add Applications** - Create new candidates and applications
✅ **View Details** - Click "View Details" to see full candidate info

## 💾 Data Storage

- All data is stored in browser localStorage
- Data persists between page refreshes
- Each browser has its own data (not shared)
- To reset: Clear browser localStorage or use incognito mode

## 🔄 Switching to Supabase (Optional)

If you want to use a real database later:

1. Set up Supabase project
2. Update `.env.local` with real credentials
3. Run `sql/schema.sql` in Supabase SQL Editor
4. The app will automatically switch to Supabase mode

## 🐛 Troubleshooting

**Login not working?**
- Make sure you're using one of the test emails above
- Check browser console for errors
- Try clearing localStorage and refreshing

**Data not showing?**
- Check browser console
- Try refreshing the page
- Data initializes automatically on first load

**Want to reset all data?**
- Open browser console
- Run: `localStorage.clear()`
- Refresh the page

---

**Enjoy testing the app locally!** 🎉
