# Dummy Login Credentials

## Test Recruiter Accounts

After running the SQL script (`sql/dummy-data.sql`), you'll need to create auth users in Supabase Dashboard.

### Step 1: Run SQL Script
Execute `sql/dummy-data.sql` in your Supabase SQL Editor to create dummy recruiters.

### Step 2: Create Auth Users in Supabase

Go to **Supabase Dashboard → Authentication → Users → Add User**

Create these users with matching emails:

| Email | Password | Name |
|-------|---------|------|
| `john@recruiter.com` | `password123` | John Doe |
| `jane@recruiter.com` | `password123` | Jane Smith |
| `mike@recruiter.com` | `password123` | Mike Johnson |
| `sarah@recruiter.com` | `password123` | Sarah Williams |
| `david@recruiter.com` | `password123` | David Brown |

**Note:** When creating users in Supabase Dashboard:
- Email: Use the email from the table above
- Password: Use `password123` (or any password you prefer)
- **Auto Confirm User**: ✅ Check this box (important!)

### Step 3: Login

1. Go to `/login` page
2. Use any of the emails above with password `password123`
3. You'll see that recruiter's personalized dashboard

## Quick Test Account

**Simplest option for testing:**

- **Email:** `john@recruiter.com`
- **Password:** `password123`

This account has 3 applications with different statuses (Joined, Selected, Connected).

## Alternative: Create Single Test User

If you want just one test account:

1. Run this SQL:
```sql
INSERT INTO recruiters (name, email) VALUES ('Test Recruiter', 'test@recruiter.com');
```

2. Create auth user in Supabase:
   - Email: `test@recruiter.com`
   - Password: `password123`
   - Auto Confirm: ✅

3. Login with:
   - Email: `test@recruiter.com`
   - Password: `password123`

---

**Important:** Make sure to enable "Email/Password" authentication in Supabase Dashboard → Authentication → Providers → Email
