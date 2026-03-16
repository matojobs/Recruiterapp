/**
 * Admin panel types matching API documentation.
 */

export type AdminUserRole = 'job_seeker' | 'employer' | 'recruiter' | 'admin'
export type AdminUserStatus = 'active' | 'inactive' | 'suspended' | 'pending'

export interface AdminUser {
  id: number
  email: string
  firstName: string
  lastName: string
  role: AdminUserRole
  status: string
  isActive: boolean
  isVerified?: boolean
  /** When true (recruiter only), user sees all companies on job portal and can post for any company. */
  canPostForAnyCompany?: boolean
  phone?: string
  location?: string
  company?: { id: number; name: string; [key: string]: unknown }
  createdAt?: string
  updatedAt?: string
}

export interface AdminLoginResponse {
  success: boolean
  user: {
    accessToken: string
    refreshToken?: string
    userId: number
    email: string
    fullName: string
    role: string
    onboardingComplete?: boolean
  }
  token?: string
  permissions: string[]
}

export interface AdminPermissionsResponse {
  permissions: string[]
  role: string
  isAdmin: boolean
}

export interface DashboardStats {
  totalUsers: number
  totalJobs: number
  totalCompanies: number
  totalApplications: number
  activeJobs: number
  pendingApplications: number
  newUsersToday: number
  newJobsToday: number
  userGrowthRate?: number
  jobPostingRate?: number
  applicationRate?: number
}

export interface UsersListResponse {
  users: AdminUser[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AdminCompany {
  id: number
  name: string
  slug?: string
  userId?: number
  adminStatus?: string
  user?: { id: number; email?: string; fullName?: string }
  status?: string
  isVerified?: boolean
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface CompaniesListResponse {
  companies: AdminCompany[]
  total: number
  page: number
  limit: number
  totalPages?: number
}

export interface AdminJob {
  id: number
  title: string
  slug?: string
  companyId?: number
  company?: { id: number; name: string; [key: string]: unknown }
  status?: string
  adminStatus?: string
  postedDate?: string
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface JobsListResponse {
  jobs: AdminJob[]
  total: number
  page: number
  limit: number
  totalPages?: number
}

export interface SettingItem {
  key: string
  value: string | number | boolean | Record<string, unknown>
}

export interface ActivityLogItem {
  id: string
  action: string
  entity: string
  adminUserId?: number
  adminUser?: { email: string; fullName?: string }
  date: string
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

/** Job application status for admin applications API (see ADMIN_JOB_APPLICATIONS.md). */
export type AdminApplicationStatus =
  | 'pending'
  | 'reviewing'
  | 'shortlisted'
  | 'interview'
  | 'rejected'
  | 'accepted'
  | 'withdrawn'

export interface AdminJobApplication {
  id: number
  jobId: number
  userId: number
  status: string
  candidateName?: string
  candidateEmail?: string
  candidatePhone?: string
  coverLetter?: string | null
  resume?: string | null
  createdAt: string
  updatedAt: string
  job?: {
    id: number
    title: string
    company?: { id: number; name: string; [key: string]: unknown }
  }
  user?: {
    id: number
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
  }
}

export interface ApplicationsListResponse {
  applications: AdminJobApplication[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type Permission =
  | 'view_dashboard'
  | 'view_analytics'
  | 'view_users'
  | 'create_users'
  | 'edit_users'
  | 'delete_users'
  | 'verify_users'
  | 'suspend_users'
  | 'view_companies'
  | 'create_companies'
  | 'edit_companies'
  | 'delete_companies'
  | 'verify_companies'
  | 'suspend_companies'
  | 'view_jobs'
  | 'create_jobs'
  | 'edit_jobs'
  | 'delete_jobs'
  | 'approve_jobs'
  | 'view_applications'
  | 'edit_applications'
  | 'delete_applications'
  | 'bulk_operations'
  | 'manage_settings'
  | 'view_logs'
  | 'export_data'
  | 'view_recruiter_performance'

// —— Recruiter Performance (see docs/ADMIN_RECRUITER_PERFORMANCE_APIS.md) ——

export interface RecruiterPerformanceRowDOD {
  recruiter_id: string
  recruiter_name: string
  assigned: number
  attempt: number
  connected: number
  interested: number
  not_relevant: number
  not_interested: number
  interview_sched: number
  sched_next_day: number
  today_selection: number
  rejected: number
  today_joining: number
  interview_done: number
  interview_pending: number
}

export interface RecruiterPerformanceDODResponse {
  date: string
  rows: RecruiterPerformanceRowDOD[]
  total: Omit<RecruiterPerformanceRowDOD, 'recruiter_id' | 'recruiter_name'>
}

export interface RecruiterPerformanceRowMTD {
  recruiter_id: string
  recruiter_name: string
  assigned: number
  attempt: number
  connected: number
  interested: number
  interview_sched: number
  sched_next_day: number
  selection: number
  total_joining: number
  yet_to_join: number
  backout: number
  hold: number
}

export interface RecruiterPerformanceMTDResponse {
  month: string
  rows: RecruiterPerformanceRowMTD[]
  total: Omit<RecruiterPerformanceRowMTD, 'recruiter_id' | 'recruiter_name'>
}

export interface RecruiterPerformanceIndividualResponse extends RecruiterPerformanceRowMTD {
  period: 'dod' | 'mtd'
  month?: string
  date?: string
}

export interface CompanyWiseRow {
  company_id: string
  company_name: string
  current_openings: number
  total_screened: number
  interview_scheduled: number
  interview_done: number
  interview_pending: number
  rejected: number
  selected: number
  joined: number
  hold: number
  yet_to_join: number
  backout: number
}

export interface RecruiterPerformanceCompanyWiseResponse {
  rows: CompanyWiseRow[]
  total: Omit<CompanyWiseRow, 'company_id' | 'company_name'>
}

export interface NegativeFunnelRemarkRow {
  job_role_id: string
  job_role_name: string
  count: number
  /** Used in totals_by_job_role */
  total?: number
}

export interface NegativeFunnelRemark {
  remark: string
  by_job_role: NegativeFunnelRemarkRow[]
  total: number
}

export interface RecruiterPerformanceNegativeFunnelResponse {
  date?: string
  month?: string
  remarks: NegativeFunnelRemark[]
  totals_by_job_role: NegativeFunnelRemarkRow[]
  grand_total: number
}

export interface InterviewStatusCompanyRow {
  company_id: string
  company_name: string
  int_sched: number
  int_done: number
  inter_pending: number
  selected: number
  joined: number
  on_hold: number
  yet_to_join: number
  backout: number
}

export interface RecruiterPerformanceInterviewStatusResponse {
  date: string
  rows: InterviewStatusCompanyRow[]
  total: Omit<InterviewStatusCompanyRow, 'company_id' | 'company_name'>
}
