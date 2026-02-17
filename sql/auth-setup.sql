-- Enable Row Level Security (RLS) for auth
ALTER TABLE recruiters ENABLE ROW LEVEL SECURITY;

-- Create policy to allow recruiters to read their own data
CREATE POLICY "Recruiters can view their own data"
  ON recruiters
  FOR SELECT
  USING (auth.uid()::text = id::text OR email = auth.email());

-- Note: In Supabase, you'll need to:
-- 1. Enable Authentication in Supabase Dashboard
-- 2. Create user accounts for recruiters
-- 3. Link recruiter email to auth user email
-- 4. Recruiters will login using their email/password

-- Optional: Add password column to recruiters table if you want to manage passwords yourself
-- Otherwise, use Supabase Auth which handles passwords securely

-- To create a recruiter with auth:
-- 1. Create user in Supabase Auth (Dashboard -> Authentication -> Users -> Add User)
-- 2. Insert recruiter record with matching email
-- Example:
-- INSERT INTO recruiters (name, email) VALUES ('John Doe', 'john@example.com');
-- Then create auth user with same email in Supabase Dashboard
