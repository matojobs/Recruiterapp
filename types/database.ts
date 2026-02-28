export interface Recruiter {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  company_name: string;
  industry: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobRole {
  id: string;
  job_role: string;
  company_id: string;
  created_at: string;
  updated_at: string;
  company?: Company;
}

export interface Candidate {
  id: string;
  candidate_name: string;
  phone: string | null;
  email: string | null;
  qualification: string | null;
  age: number | null;
  location: string | null;
  work_exp_years: number | null;
  current_ctc: number | null;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  portal: string | null;
  job_role_id: string | null;
  assigned_date: string | null;
  recruiter_id: string | null;
  candidate_id: string;
  call_date: string | null;
  call_status: 'Connected' | 'RNR' | 'Busy' | 'Switched Off' | 'Incoming Off' | 'Call Back' | 'Invalid' | 'Wrong Number' | 'Out of network' | null;
  interested_status: 'Yes' | 'No' | 'Call Back Later' | null;
  not_interested_remark: string | null;
  interview_scheduled: boolean;
  interview_date: string | null;
  turnup: boolean | null;
  interview_status: 'Scheduled' | 'Done' | 'Not Attended' | 'Rejected' | null;
  selection_status: 'Selected' | 'Not Selected' | 'Pending' | null;
  joining_status: 'Joined' | 'Not Joined' | 'Pending' | 'Backed Out' | null;
  joining_date: string | null;
  backout_date: string | null;
  backout_reason: string | null;
  hiring_manager_feedback: string | null;
  followup_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  recruiter?: Recruiter;
  candidate?: Candidate;
  job_role?: JobRole;
}

/** Application row as stored (no joined relations). */
export type ApplicationRaw = Omit<Application, 'recruiter' | 'candidate' | 'job_role'>

export interface DashboardStats {
  totalSourced: number;
  callsDoneToday: number;
  connectedToday: number;
  interestedToday: number;
  notInterestedToday: number;
  interviewsScheduled: number;
  interviewsDoneToday: number;
  selectedThisMonth: number;
  joinedThisMonth: number;
  pendingJoining: number;
}

export interface PipelineFlow {
  sourced: number;
  callDone: number;
  connected: number;
  interested: number;
  notInterested: number;
  interviewScheduled: number;
  interviewDone: number;
  selected: number;
  joined: number;
}

/** Default empty pipeline flow; use for initial state. */
export const EMPTY_PIPELINE_FLOW: PipelineFlow = {
  sourced: 0,
  callDone: 0,
  connected: 0,
  interested: 0,
  notInterested: 0,
  interviewScheduled: 0,
  interviewDone: 0,
  selected: 0,
  joined: 0,
}

/** Filters for listing applications (API query params and local filter). */
export interface ApplicationFilters {
  recruiter_id?: string
  company_id?: string
  job_role_id?: string
  portal?: string
  call_status?: string
  interested_status?: string
  interview_status?: string
  selection_status?: string
  joining_status?: string
  date_from?: string
  date_to?: string
  /** Page number (1-based). Used for server-side pagination. */
  page?: number
  /** Page size (limit) for server-side pagination. */
  limit?: number
}

/** Paginated applications list returned by backend. */
export interface ApplicationPage {
  applications: Application[]
  total: number
  page: number
  limit: number
  totalPages?: number
}

export interface RecruiterPerformance {
  recruiter_id: string;
  recruiter_name: string;
  callsMade: number;
  connected: number;
  interested: number;
  interviewsScheduled: number;
  selected: number;
  joined: number;
  connectedRate: number;
  interestedRate: number;
}

export interface Notification {
  id: string;
  type: 'interview' | 'followup' | 'joining_followup' | 'pending_call';
  title: string;
  message: string;
  applicationId: string;
  candidateName: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
  application?: Application;
}
