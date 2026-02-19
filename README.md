# Recruiter App - Sourcing Tracker

A web-based recruitment sourcing tracker that replaces Google Sheets with a faster, cleaner interface. Built specifically for Indian recruitment agencies that use calling-based sourcing systems.

## Features

### 📊 Dashboard
- Real-time metrics: Total Sourced, Calls Done Today, Connected, Interested, Interviews, Selected, Joined
- Pipeline flow visualization with conversion rates
- Recruiter performance tracking

### 💼 Jobs
- Manage job roles and positions
- Link job roles to companies
- View applications per job role

### 👥 Candidates (Main Working Page)
- **Google Sheet-like table** with inline editing
- Click any cell to edit instantly
- Track complete recruitment pipeline:
  - Portal → Job Role → Company → Assigned Date → Recruiter
  - Call Date → Call Status (Busy/RNR/Connected/Wrong Number)
  - Interested Status (Yes/No/Call Back Later)
  - Interview Scheduled → Interview Date → Interview Status
  - Selection Status → Joining Status → Joining Date
  - Followup Date → Notes
- **Flow Tracking Sidebar**: See counts for each stage
- **Advanced Filters**: By Recruiter, Company, Job Role, Portal, Status, Date Range
- **Export to Excel**: One-click export of filtered data

### 📈 Reports
- **Pipeline Flow Report**: Complete funnel analysis with conversion rates
- **Recruiter Performance Report**: Individual recruiter stats and conversion rates
- **Company-wise Report**: Performance metrics per company
- Export all reports to Excel

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL via Supabase
- **Deployment**: Vercel-ready

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API
3. Copy your Project URL and anon/public key
4. Enable Authentication: Go to Authentication → Providers → Email → Enable Email/Password

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set Up Database

1. Go to your Supabase project → SQL Editor
2. Copy and paste the entire contents of `sql/schema.sql`
3. Click "Run" to create all tables
4. (Optional) Run `sql/dummy-data.sql` to create test data

### 5. Create Test Login Accounts

**Option A: Use Dummy Data (Recommended for Testing)**

1. Run `sql/dummy-data.sql` in SQL Editor
2. Go to Supabase Dashboard → Authentication → Users → Add User
3. Create users with these credentials:
   - Email: `john@recruiter.com`, Password: `password123`
   - Email: `jane@recruiter.com`, Password: `password123`
   - (See `DUMMY_LOGIN.md` for full list)
4. **Important:** Check "Auto Confirm User" when creating

**Option B: Create Your Own**

1. Insert recruiter in `recruiters` table:
```sql
INSERT INTO recruiters (name, email) VALUES ('Your Name', 'your@email.com');
```

2. Create auth user in Supabase Dashboard → Authentication → Users
   - Email: Same as above
   - Password: Your choice
   - Auto Confirm: ✅

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3100](http://localhost:3100) - you'll be redirected to `/login`

### 7. Login

Use your test credentials to login and access the dashboard.

**Quick Test:**
- Email: `john@recruiter.com`
- Password: `password123`

## Database Schema

### Tables

1. **recruiters**: Recruiter information (id, name, email)
2. **companies**: Company/client information (id, company_name, industry)
3. **job_roles**: Job positions (id, job_role, company_id)
4. **candidates**: Candidate profiles (id, candidate_name, phone, email, qualification, age, location, work_exp_years, current_ctc)
5. **applications**: Main application tracking table (all pipeline fields)

## Pipeline Flow

The app tracks the complete recruitment pipeline:

1. **Sourced** → Application created
2. **Call Done** → Call date recorded
3. **Connected** → Call status = "Connected"
4. **Interested** → Interested status = "Yes"
5. **Not Interested** → Interested status = "No"
6. **Interview Scheduled** → Interview scheduled = true
7. **Interview Done** → Interview status = "Done"
8. **Selected** → Selection status = "Selected"
9. **Joined** → Joining status = "Joined"

## Usage

1. **Add Master Data**: First add Recruiters, Companies, and Job Roles from their respective pages
2. **Add Candidates**: Go to Candidates page and add new applications
3. **Track Progress**: Click any cell in the table to update status inline
4. **Filter & Analyze**: Use filters to view specific data, check flow tracking sidebar
5. **Generate Reports**: Go to Reports page for detailed analytics

## Deployment

The app is ready to deploy on Vercel:

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

## Support

For issues or questions, check the code comments or database schema in `sql/schema.sql`.
