-- Insert dummy recruiters
-- Note: You'll need to create corresponding auth users in Supabase Dashboard

INSERT INTO recruiters (name, email) VALUES
('John Doe', 'john@recruiter.com'),
('Jane Smith', 'jane@recruiter.com'),
('Mike Johnson', 'mike@recruiter.com'),
('Sarah Williams', 'sarah@recruiter.com'),
('David Brown', 'david@recruiter.com')
ON CONFLICT (email) DO NOTHING;

-- Insert dummy companies
INSERT INTO companies (company_name, industry) VALUES
('TechCorp Solutions', 'Technology'),
('FinanceHub Inc', 'Finance'),
('HealthCare Plus', 'Healthcare'),
('EduTech Innovations', 'Education'),
('RetailMax Stores', 'Retail')
ON CONFLICT DO NOTHING;

-- Insert dummy job roles
INSERT INTO job_roles (job_role, company_id)
SELECT 
  job_role,
  c.id
FROM (
  VALUES
    ('Software Engineer', 'TechCorp Solutions'),
    ('Senior Developer', 'TechCorp Solutions'),
    ('Data Analyst', 'FinanceHub Inc'),
    ('Financial Advisor', 'FinanceHub Inc'),
    ('Nurse', 'HealthCare Plus'),
    ('Doctor', 'HealthCare Plus'),
    ('Teacher', 'EduTech Innovations'),
    ('Sales Associate', 'RetailMax Stores'),
    ('Store Manager', 'RetailMax Stores')
) AS roles(job_role, company_name)
JOIN companies c ON c.company_name = roles.company_name
ON CONFLICT DO NOTHING;

-- Insert dummy candidates
INSERT INTO candidates (candidate_name, phone, email, qualification, age, location, work_exp_years, current_ctc) VALUES
('Rajesh Kumar', '9876543210', 'rajesh@email.com', 'B.Tech', 28, 'Mumbai', 5, 800000),
('Priya Sharma', '9876543211', 'priya@email.com', 'MBA', 26, 'Delhi', 3, 600000),
('Amit Patel', '9876543212', 'amit@email.com', 'B.Com', 30, 'Bangalore', 7, 1200000),
('Sneha Reddy', '9876543213', 'sneha@email.com', 'M.Tech', 25, 'Hyderabad', 2, 500000),
('Vikram Singh', '9876543214', 'vikram@email.com', 'B.Sc', 32, 'Pune', 8, 1500000),
('Anjali Mehta', '9876543215', 'anjali@email.com', 'MBA', 27, 'Chennai', 4, 700000),
('Rahul Verma', '9876543216', 'rahul@email.com', 'B.Tech', 29, 'Gurgaon', 6, 900000),
('Kavita Nair', '9876543217', 'kavita@email.com', 'M.Com', 31, 'Kolkata', 9, 1100000)
ON CONFLICT DO NOTHING;

-- Insert dummy applications (assigning to different recruiters)
INSERT INTO applications (
  portal, job_role_id, assigned_date, recruiter_id, candidate_id,
  call_date, call_status, interested_status, interview_scheduled,
  interview_date, interview_status, selection_status, joining_status, notes
)
SELECT 
  portal,
  jr.id as job_role_id,
  assigned_date::date,
  r.id as recruiter_id,
  c.id as candidate_id,
  call_date::date,
  call_status,
  interested_status,
  interview_scheduled::boolean,
  interview_date::date,
  interview_status,
  selection_status,
  joining_status,
  notes
FROM (
  VALUES
    -- John's applications
    ('Naukri', 'Software Engineer', 'john@recruiter.com', 'Rajesh Kumar', '2024-01-15', '2024-01-16', 'Connected', 'Yes', true, '2024-01-20', 'Done', 'Selected', 'Joined', 'Great candidate'),
    ('LinkedIn', 'Senior Developer', 'john@recruiter.com', 'Amit Patel', '2024-01-20', '2024-01-21', 'Connected', 'Yes', true, '2024-01-25', 'Done', 'Selected', 'Pending', 'Waiting for offer acceptance'),
    ('Naukri', 'Data Analyst', 'john@recruiter.com', 'Vikram Singh', '2024-02-01', '2024-02-02', 'Connected', 'Call Back Later', false, NULL, NULL, 'Pending', 'Pending', 'Will call back next week'),
    
    -- Jane's applications
    ('Naukri', 'Financial Advisor', 'jane@recruiter.com', 'Priya Sharma', '2024-01-10', '2024-01-11', 'Connected', 'Yes', true, '2024-01-18', 'Done', 'Selected', 'Joined', 'Excellent fit'),
    ('LinkedIn', 'Nurse', 'jane@recruiter.com', 'Sneha Reddy', '2024-01-25', '2024-01-26', 'Busy', NULL, false, NULL, NULL, 'Pending', 'Pending', 'Call back later'),
    ('Indeed', 'Teacher', 'jane@recruiter.com', 'Anjali Mehta', '2024-02-05', '2024-02-06', 'Connected', 'No', false, NULL, NULL, 'Not Selected', 'Not Joined', 'Not interested'),
    
    -- Mike's applications
    ('Naukri', 'Sales Associate', 'mike@recruiter.com', 'Rahul Verma', '2024-01-12', '2024-01-13', 'Connected', 'Yes', true, '2024-01-22', 'Not Attended', 'Not Selected', 'Not Joined', 'Candidate did not attend'),
    ('LinkedIn', 'Store Manager', 'mike@recruiter.com', 'Kavita Nair', '2024-01-28', '2024-01-29', 'RNR', NULL, false, NULL, NULL, 'Pending', 'Pending', 'Ring no response'),
    
    -- Sarah's applications
    ('Naukri', 'Doctor', 'sarah@recruiter.com', 'Rajesh Kumar', '2024-02-10', NULL, NULL, NULL, false, NULL, NULL, 'Pending', 'Pending', 'Just assigned'),
    
    -- David's applications
    ('LinkedIn', 'Software Engineer', 'david@recruiter.com', 'Amit Patel', '2024-01-15', '2024-01-16', 'Wrong Number', NULL, false, NULL, NULL, 'Not Selected', 'Not Joined', 'Wrong contact number')
) AS app_data(
  portal, job_role, recruiter_email, candidate_name, assigned_date, call_date,
  call_status, interested_status, interview_scheduled, interview_date,
  interview_status, selection_status, joining_status, notes
)
JOIN recruiters r ON r.email = app_data.recruiter_email
JOIN candidates c ON c.candidate_name = app_data.candidate_name
JOIN job_roles jr ON jr.job_role = app_data.job_role
ON CONFLICT DO NOTHING;
