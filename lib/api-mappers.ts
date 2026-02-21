/**
 * Field mappers to transform backend API responses to frontend format.
 * Backend uses different field names (name vs company_name, role_name vs job_role, etc.)
 */

import type {
  Recruiter,
  Company,
  JobRole,
  Candidate,
  Application,
  DashboardStats,
  PipelineFlow,
} from '@/types/database'

/**
 * Backend company response shape
 */
interface BackendCompany {
  id: number
  name: string
  slug?: string
  description?: string
  website?: string
  industry?: string | null
  size?: string
  job_roles_count?: number
  created_at?: string
}

/** Company by ID response includes job_roles array */
interface BackendCompanyWithJobRoles extends BackendCompany {
  job_roles?: BackendJobRole[]
}

/**
 * Backend job role response shape
 */
interface BackendJobRole {
  id: number
  company_id: number
  role_name: string
  department?: string
  is_active?: boolean
  created_at?: string
  company?: BackendCompany
}

/**
 * Backend recruiter response shape
 */
interface BackendRecruiter {
  id: number
  name: string
  email: string
  phone?: string
  is_active?: boolean
  created_at: string
  updated_at: string
}

/**
 * Backend candidate response shape
 */
interface BackendCandidate {
  id: number
  candidate_name: string
  phone: string | null
  email: string | null
  qualification: string | null
  work_exp_years?: number | null
  portal_id?: number
  created_at: string
}

/**
 * Backend application response shape
 */
interface BackendApplication {
  id: number
  recruiter_id: number | null
  candidate_id: number
  job_role_id: number | null
  assigned_date: string | null
  call_date: string | null
  call_status: string | null
  interested_status: string | null
  selection_status: string | null
  joining_status: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  candidate?: BackendCandidate
  job_role?: BackendJobRole
  company?: BackendCompany
  recruiter?: BackendRecruiter
}

/**
 * Backend dashboard stats response shape
 */
interface BackendDashboardStats {
  total_applications: number
  total_candidates: number
  total_calls: number
  avg_calls_per_day: number
  connected_calls: number
  interested_candidates: number
  selected_candidates: number
  joined_candidates: number
  conversion_rate: number
  call_to_interest_rate: number
  interest_to_selection_rate: number
  selection_to_join_rate: number
}

/**
 * Backend pipeline stage response shape
 */
interface BackendPipelineStage {
  stage: string
  count: number
}

/**
 * Map backend company to frontend format
 */
export function mapCompany(backend: BackendCompany): Company {
  return {
    id: String(backend.id),
    company_name: backend.name, // Backend uses "name", frontend expects "company_name"
    industry: backend.industry || null,
    created_at: backend.created_at || new Date().toISOString(),
    updated_at: backend.created_at || new Date().toISOString(), // Backend may not return updated_at
  }
}

export interface CompanyWithJobRoles {
  company: Company
  jobRoles: JobRole[]
}

export function mapCompanyWithJobRoles(backend: BackendCompanyWithJobRoles): CompanyWithJobRoles {
  const company = mapCompany(backend)
  const jobRoles = Array.isArray(backend.job_roles) ? backend.job_roles.map(mapJobRole) : []
  return { company, jobRoles }
}

/**
 * Map backend job role to frontend format
 */
export function mapJobRole(backend: BackendJobRole): JobRole {
  const createdAt = backend.created_at ?? new Date().toISOString()
  return {
    id: String(backend.id),
    job_role: backend.role_name, // Backend uses "role_name", frontend expects "job_role"
    company_id: String(backend.company_id),
    created_at: createdAt,
    updated_at: createdAt,
    company: backend.company ? mapCompany(backend.company) : undefined,
  }
}

/**
 * Map backend recruiter to frontend format
 */
export function mapRecruiter(backend: BackendRecruiter): Recruiter {
  return {
    id: String(backend.id),
    name: backend.name,
    email: backend.email,
    created_at: backend.created_at,
    updated_at: backend.updated_at,
  }
}

/**
 * Map backend candidate to frontend format
 */
export function mapCandidate(backend: BackendCandidate): Candidate {
  return {
    id: String(backend.id),
    candidate_name: backend.candidate_name,
    phone: backend.phone,
    email: backend.email,
    qualification: backend.qualification,
    work_exp_years: backend.work_exp_years ?? null,
    age: null, // Backend may not return age
    location: null, // Backend may not return location
    current_ctc: null, // Backend may not return current_ctc
    created_at: backend.created_at,
    updated_at: backend.created_at,
  }
}

/**
 * Map backend application to frontend format
 */
export function mapApplication(backend: BackendApplication & { portal?: string | null }): Application {
  // Handle company: backend may return it separately or nested in job_role
  let jobRole: JobRole | undefined
  if (backend.job_role) {
    jobRole = mapJobRole(backend.job_role)
    // If company is returned separately, attach it to job_role
    if (backend.company && !jobRole.company) {
      jobRole.company = mapCompany(backend.company)
    }
  }
  
  return {
    id: String(backend.id),
    portal: backend.portal ?? null,
    job_role_id: backend.job_role_id ? String(backend.job_role_id) : null,
    assigned_date: backend.assigned_date,
    recruiter_id: backend.recruiter_id ? String(backend.recruiter_id) : null,
    candidate_id: String(backend.candidate_id),
    call_date: backend.call_date,
    call_status: backend.call_status as Application['call_status'],
    interested_status: backend.interested_status as Application['interested_status'],
    not_interested_remark: null, // Backend may not return this
    interview_scheduled: false, // Backend may not return this
    interview_date: null, // Backend may not return this
    turnup: null, // Backend may not return this
    interview_status: null, // Backend may not return this
    selection_status: backend.selection_status as Application['selection_status'],
    joining_status: backend.joining_status as Application['joining_status'],
    joining_date: null, // Backend may not return this
    backout_date: null, // Backend may not return this
    backout_reason: null, // Backend may not return this
    hiring_manager_feedback: null, // Backend may not return this
    followup_date: null, // Backend may not return this
    notes: backend.notes ?? null,
    created_at: backend.created_at,
    updated_at: backend.updated_at,
    recruiter: backend.recruiter ? mapRecruiter(backend.recruiter) : undefined,
    candidate: backend.candidate ? mapCandidate(backend.candidate) : undefined,
    job_role: jobRole,
  }
}

/**
 * Map backend dashboard stats to frontend format
 */
export function mapDashboardStats(backend: BackendDashboardStats): DashboardStats {
  return {
    totalSourced: backend.total_applications,
    callsDoneToday: backend.total_calls, // Approximate - backend may not have "today" filter
    connectedToday: backend.connected_calls, // Approximate
    interestedToday: backend.interested_candidates, // Approximate
    notInterestedToday: 0, // Backend doesn't return this separately
    interviewsScheduled: 0, // Backend doesn't return this
    interviewsDoneToday: 0, // Backend doesn't return this
    selectedThisMonth: backend.selected_candidates, // Approximate
    joinedThisMonth: backend.joined_candidates, // Approximate
    pendingJoining: 0, // Backend doesn't return this
  }
}

/**
 * Map backend pipeline stages array to frontend pipeline flow object
 */
export function mapPipelineFlow(stages: BackendPipelineStage[]): PipelineFlow {
  const stageMap = new Map(stages.map(s => [s.stage.toLowerCase(), s.count]))
  
  // Map backend stage names to frontend keys
  return {
    sourced: stageMap.get('new applications') || stageMap.get('sourced') || 0,
    callDone: stageMap.get('contacted') || stageMap.get('call done') || 0,
    connected: 0, // Backend doesn't have this stage
    interested: stageMap.get('interested') || 0,
    notInterested: stageMap.get('not interested') || 0,
    interviewScheduled: stageMap.get('interview scheduled') || 0,
    interviewDone: 0, // Backend doesn't have this stage
    selected: stageMap.get('selected') || 0,
    joined: stageMap.get('joined') || 0,
  }
}
