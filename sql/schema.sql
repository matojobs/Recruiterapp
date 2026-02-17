-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: recruiters
CREATE TABLE IF NOT EXISTS recruiters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: companies
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: job_roles
CREATE TABLE IF NOT EXISTS job_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_role VARCHAR(255) NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: candidates
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    qualification VARCHAR(255),
    age INTEGER,
    location VARCHAR(255),
    work_exp_years INTEGER,
    current_ctc DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: applications (Main working table)
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portal VARCHAR(255),
    job_role_id UUID REFERENCES job_roles(id) ON DELETE SET NULL,
    assigned_date DATE,
    recruiter_id UUID REFERENCES recruiters(id) ON DELETE SET NULL,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    call_date DATE,
    call_status VARCHAR(50) CHECK (call_status IN ('Busy', 'RNR', 'Connected', 'Wrong Number')),
    interested_status VARCHAR(50) CHECK (interested_status IN ('Yes', 'No', 'Call Back Later')),
    not_interested_remark TEXT,
    interview_scheduled BOOLEAN DEFAULT FALSE,
    interview_date DATE,
    turnup BOOLEAN,
    interview_status VARCHAR(50) CHECK (interview_status IN ('Scheduled', 'Done', 'Not Attended', 'Rejected')),
    selection_status VARCHAR(50) CHECK (selection_status IN ('Selected', 'Not Selected', 'Pending')),
    joining_status VARCHAR(50) CHECK (joining_status IN ('Joined', 'Not Joined', 'Pending')),
    joining_date DATE,
    hiring_manager_feedback TEXT,
    followup_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_applications_recruiter ON applications(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_role ON applications(job_role_id);
CREATE INDEX IF NOT EXISTS idx_applications_call_date ON applications(call_date);
CREATE INDEX IF NOT EXISTS idx_applications_interview_date ON applications(interview_date);
CREATE INDEX IF NOT EXISTS idx_applications_assigned_date ON applications(assigned_date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_recruiters_updated_at BEFORE UPDATE ON recruiters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_roles_updated_at BEFORE UPDATE ON job_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
