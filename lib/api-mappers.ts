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

let ageDebugLoggedOnce = false

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
  /** Age in years; preferred when backend provides it. See docs/CANDIDATE_AGE_REQUIREMENT.md */
  age?: number | null
  /** ISO date YYYY-MM-DD; used to compute age when age is not provided */
  date_of_birth?: string | null
  dob?: string | null
  /** CamelCase variant (e.g. job-portal merged response) */
  dateOfBirth?: string | null
}

/**
 * Backend application response shape
 */
interface BackendApplication {
  id: number
  recruiter_id: number | null
  candidate_id: number
  job_role_id: number | null
  portal?: string | null
  assigned_date: string | null
  call_date: string | null
  call_status: string | null
  interested_status: string | null
  not_interested_remark?: string | null
  interview_scheduled?: boolean
  interview_date?: string | null
  turnup?: boolean | null
  interview_status?: string | null
  selection_status: string | null
  joining_status: string | null
  joining_date?: string | null
  backout_date?: string | null
  backout_reason?: string | null
  hiring_manager_feedback?: string | null
  followup_date?: string | null
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
function ageFromBackendCandidate(backend: BackendCandidate): number | null {
  const raw = backend as unknown as Record<string, unknown>
  const ageVal = raw.age ?? backend.age
  if (ageVal != null && Number.isFinite(Number(ageVal))) return Math.floor(Number(ageVal))
  const dob =
    (raw.date_of_birth as string) ||
    (raw.dob as string) ||
    (raw.dateOfBirth as string) ||
    backend.date_of_birth ||
    backend.dob ||
    backend.dateOfBirth
  if (!dob || typeof dob !== 'string') return null
  const birth = new Date(dob.slice(0, 10))
  if (isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age >= 0 && age <= 150 ? age : null
}

export function mapCandidate(backend: BackendCandidate): Candidate {
  return {
    id: String(backend.id),
    candidate_name: backend.candidate_name,
    phone: backend.phone,
    email: backend.email,
    qualification: backend.qualification,
    work_exp_years: backend.work_exp_years ?? null,
    age: ageFromBackendCandidate(backend),
    location: null, // Backend may not return location
    current_ctc: null, // Backend may not return current_ctc
    created_at: backend.created_at,
    updated_at: backend.created_at,
  }
}

/**
 * Map backend application to frontend format
 */
export function mapApplication(backend: BackendApplication): Application {
  // Handle company: backend may return it separately or nested in job_role
  let jobRole: JobRole | undefined
  if (backend.job_role) {
    jobRole = mapJobRole(backend.job_role)
    // If company is returned separately, attach it to job_role
    if (backend.company && !jobRole.company) {
      jobRole.company = mapCompany(backend.company)
    }
  }

  // Build candidate payload: from candidate, or from user when no candidate (job-portal), or merge user DOB into candidate
  const rawApp = backend as unknown as Record<string, unknown>
  const user = rawApp.user as Record<string, unknown> | undefined
  const userProfile = user?.profile as Record<string, unknown> | undefined
  const userDob = (user?.dateOfBirth ?? user?.date_of_birth ?? userProfile?.dateOfBirth ?? userProfile?.date_of_birth ?? rawApp.date_of_birth ?? rawApp.dateOfBirth) as string | undefined
  let candidatePayload: BackendCandidate | undefined = backend.candidate

  if (candidatePayload) {
    const c = candidatePayload as unknown as Record<string, unknown>
    const hasAgeOrDob = c.age != null || c.date_of_birth != null || c.dob != null || c.dateOfBirth != null
    if (!hasAgeOrDob && userDob) {
      candidatePayload = { ...candidatePayload, dateOfBirth: userDob }
    }
  } else if (userDob || user) {
    // No candidate object: build one from user so we at least have age/DOB (e.g. job-portal apps)
    const firstName = (user?.firstName ?? user?.first_name) as string | undefined
    const lastName = (user?.lastName ?? user?.last_name) as string | undefined
    const name = [firstName, lastName].filter(Boolean).join(' ') || (user?.candidate_name as string) || 'Candidate'
    candidatePayload = {
      id: (user?.id ?? backend.candidate_id) as number,
      candidate_name: name,
      phone: (user?.phone as string | null) ?? null,
      email: (user?.email as string | null) ?? null,
      qualification: null,
      created_at: (user?.createdAt ?? user?.created_at ?? backend.created_at) as string,
      dateOfBirth: userDob ?? undefined,
    }
  }

  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development' && !ageDebugLoggedOnce) {
    const mappedAge = candidatePayload ? ageFromBackendCandidate(candidatePayload) : null
    if (mappedAge === null && (backend.candidate || user)) {
      ageDebugLoggedOnce = true
      const cand = rawApp.candidate as unknown as Record<string, unknown> | undefined
      console.warn(
        '[Candidate age] No age/DOB parsed. Inspect backend response:',
        { 'application.candidate keys': cand ? Object.keys(cand) : 'none', 'application.user keys': user ? Object.keys(user) : 'none', 'candidate sample': cand ? { age: cand.age, date_of_birth: cand.date_of_birth, dob: cand.dob, dateOfBirth: cand.dateOfBirth } : {}, 'user DOB': user ? { dateOfBirth: user.dateOfBirth, date_of_birth: user.date_of_birth, 'profile.dateOfBirth': userProfile?.dateOfBirth } : {} }
      )
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
    call_status: (backend.call_status === 'call connected' ? 'Connected' : backend.call_status === 'Switch off' ? 'Switched Off' : backend.call_status) as Application['call_status'],
    interested_status: backend.interested_status as Application['interested_status'],
    not_interested_remark: backend.not_interested_remark ?? null,
    interview_scheduled: backend.interview_scheduled ?? false,
    interview_date: backend.interview_date ?? null,
    turnup: backend.turnup ?? null,
    interview_status: (backend.interview_status as Application['interview_status']) ?? null,
    selection_status: backend.selection_status as Application['selection_status'],
    joining_status: backend.joining_status as Application['joining_status'],
    joining_date: backend.joining_date ?? null,
    backout_date: backend.backout_date ?? null,
    backout_reason: backend.backout_reason ?? null,
    hiring_manager_feedback: backend.hiring_manager_feedback ?? null,
    followup_date: backend.followup_date ?? null,
    notes: backend.notes ?? null,
    created_at: backend.created_at,
    updated_at: backend.updated_at,
    recruiter: backend.recruiter ? mapRecruiter(backend.recruiter) : undefined,
    candidate: candidatePayload ? mapCandidate(candidatePayload) : undefined,
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
    connected: stageMap.get('connected') ?? 0,
    interested: stageMap.get('interested') || 0,
    notInterested: stageMap.get('not interested') || 0,
    interviewScheduled: stageMap.get('interview scheduled') || 0,
    interviewDone: stageMap.get('interview done') ?? 0,
    selected: stageMap.get('selected') || 0,
    joined: stageMap.get('joined') || 0,
  }
}

/**
 * Map backend today-progress object (snake_case) to PipelineFlow.
 * Used when API returns { sourced, call_done, connected, ... } instead of array.
 */
export function mapPipelineFlowFromObject(obj: Record<string, unknown>): PipelineFlow {
  const num = (key: string) => (typeof obj[key] === 'number' ? (obj[key] as number) : 0)
  return {
    sourced: num('sourced'),
    callDone: num('call_done'),
    connected: num('connected'),
    interested: num('interested'),
    notInterested: num('not_interested'),
    interviewScheduled: num('interview_scheduled'),
    interviewDone: num('interview_done'),
    selected: num('selected'),
    joined: num('joined'),
  }
}
