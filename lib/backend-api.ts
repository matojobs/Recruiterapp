/**
 * Backend API functions that call the live backend.
 * These functions handle API requests and transform responses to frontend format.
 */

import { apiGet, apiPost, apiPatch, apiDelete, apiApplicationsRequest } from './api-client'
import {
  mapCompany,
  mapJobRole,
  mapRecruiter,
  mapCandidate,
  mapApplication,
  mapDashboardStats,
  mapPipelineFlow,
  mapPipelineFlowFromObject,
  mapCompanyWithJobRoles,
} from './api-mappers'
import type { CompanyWithJobRoles } from './api-mappers'
import type {
  Recruiter,
  Company,
  JobRole,
  Candidate,
  Application,
  ApplicationFilters,
  ApplicationPage,
  DashboardStats,
  PipelineFlow,
} from '@/types/database'

/**
 * Build query string from filters
 */
function buildQueryString(filters?: Record<string, unknown>, pagination?: { page?: number; limit?: number }): string {
  const params = new URLSearchParams()
  
  // Add pagination
  if (pagination?.page) params.append('page', String(pagination.page))
  if (pagination?.limit) params.append('limit', String(pagination.limit))
  
  // Add filters
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null && value !== '') {
        // Map frontend filter names to backend names
        if (key === 'date_from') params.append('start_date', String(value))
        else if (key === 'date_to') params.append('end_date', String(value))
        else params.append(key, String(value))
      }
    })
  }
  
  const query = params.toString()
  return query ? `?${query}` : ''
}

// Master Data

export async function getRecruiters(): Promise<Recruiter[]> {
  const backend = await apiGet<any>('/recruiters')
  const recruiters = Array.isArray(backend) ? backend : (backend?.data || backend?.items || [])
  return recruiters.map(mapRecruiter)
}

export async function getRecruiterByEmail(email: string): Promise<Recruiter | null> {
  const recruiters = await getRecruiters()
  return recruiters.find(r => r.email === email) || null
}

export async function getCompanies(): Promise<Company[]> {
  const backend = await apiGet<any>('/companies')
  const companies = Array.isArray(backend) ? backend : (backend?.data || backend?.items || [])
  return companies.map(mapCompany)
}

/**
 * Get a single company by ID with its related job roles (from API, not recruiter-created list).
 * Use this for Add New Candidate so job roles are the company's roles from the API.
 */
export async function getCompanyById(companyId: number | string): Promise<CompanyWithJobRoles> {
  const id = typeof companyId === 'string' ? companyId : String(companyId)
  const backend = await apiGet<any>(`/companies/${id}`)
  return mapCompanyWithJobRoles(backend)
}

export async function getJobRoles(): Promise<JobRole[]> {
  const backend = await apiGet<any>('/job-roles')
  const jobRoles = Array.isArray(backend) ? backend : (backend?.data || backend?.items || [])
  return jobRoles.map(mapJobRole)
}

export async function createJobRole(jobRole: Omit<JobRole, 'id' | 'created_at' | 'updated_at' | 'company'>): Promise<JobRole> {
  const backend = await apiPost<{ id: number; company_id: number; role_name: string; department?: string; created_at: string }>('/job-roles', {
    company_id: Number(jobRole.company_id),
    role_name: jobRole.job_role, // Frontend uses "job_role", backend expects "role_name"
    department: undefined, // Frontend doesn't have this
  })
  return mapJobRole(backend)
}

/** Default limit for candidates list so we get more than backend default (e.g. 20). */
const DEFAULT_CANDIDATES_LIMIT = 1000

export async function getCandidates(search?: string): Promise<Candidate[]> {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  params.set('limit', String(DEFAULT_CANDIDATES_LIMIT))
  const query = params.toString() ? `?${params.toString()}` : ''
  const backend = await apiGet<any>(`/candidates${query}`)
  const candidates = Array.isArray(backend) ? backend : (backend?.data || backend?.items || [])
  return candidates.map(mapCandidate)
}

export async function createCandidate(candidate: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>): Promise<Candidate> {
  const backend = await apiPost<{ id: number; candidate_name: string; phone: string | null; email: string | null; qualification: string | null; work_exp_years?: number | null; portal_id?: number; created_at: string }>('/candidates', {
    candidate_name: candidate.candidate_name,
    phone: candidate.phone,
    email: candidate.email,
    qualification: candidate.qualification,
    work_exp_years: candidate.work_exp_years,
    portal_id: undefined, // Frontend doesn't have this
  })
  return mapCandidate(backend)
}

// Sourcing: job roles recruiter has sourced candidates for
export interface SourcedJobRole {
  jobRoleId: number
  jobRoleName: string
  department?: string
  companyId: number
  companyName: string
  applicationCount: number
}

export async function getSourcedJobRoles(): Promise<SourcedJobRole[]> {
  const backend = await apiGet<SourcedJobRole[] | { data?: SourcedJobRole[] }>('/sourced-job-roles')
  return Array.isArray(backend) ? backend : backend?.data ?? []
}

// Applications (recruiter sourcing applications)
/** Default page size when caller does not specify limit. */
const DEFAULT_APPLICATIONS_PAGE_SIZE = 50

/** Paginated applications list; used by Candidates page and sourcing detail. */
export async function getApplicationsPage(
  filters?: ApplicationFilters
): Promise<ApplicationPage> {
  const { page, limit, ...rest } = (filters || {}) as ApplicationFilters
  const pagination = {
    page: page ?? 1,
    limit: limit ?? DEFAULT_APPLICATIONS_PAGE_SIZE,
  }
  const query = buildQueryString(rest as Record<string, unknown>, pagination)
  const backend = await apiGet<
  | Array<{
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
    portal?: string | null
    notes?: string | null
    created_at: string
    updated_at: string
    candidate?: { id: number; candidate_name: string; phone: string | null; email: string | null; qualification: string | null; work_exp_years?: number | null; portal_id?: number; created_at: string }
    job_role?: { id: number; company_id: number; role_name: string; department?: string; is_active?: boolean; created_at: string; company?: { id: number; name: string; slug?: string; description?: string; industry?: string | null; size?: string; website?: string; job_roles_count?: number; created_at?: string } }
    company?: { id: number; name: string; slug?: string; description?: string; industry?: string | null; size?: string; website?: string; job_roles_count?: number; created_at?: string }
    recruiter?: { id: number; name: string; email: string; phone?: string; is_active?: boolean; created_at: string; updated_at: string }
  }>
  | {
      data?: Array<any>
      applications?: Array<any>
      items?: Array<any>
      total?: number
      page?: number
      limit?: number
      total_pages?: number
    }
  >(`/applications${query}`)
  
  // Handle different response formats
  let applications: any[]
  let total = 0
  let currentPage = pagination.page
  let currentLimit = pagination.limit
  let totalPages: number | undefined

  if (Array.isArray(backend)) {
    applications = backend
    total = backend.length
  } else if (backend && typeof backend === 'object') {
    // Handle paginated or wrapped responses
    applications = (backend as any).data || (backend as any).applications || (backend as any).items || []
    total = (backend as any).total ?? applications.length
    currentPage = (backend as any).page ?? pagination.page
    currentLimit = (backend as any).limit ?? pagination.limit
    const apiTotalPages = (backend as any).total_pages as number | undefined
    totalPages = apiTotalPages ?? (total && currentLimit ? Math.ceil(total / currentLimit) : undefined)
  } else {
    console.error('❌ Unexpected backend response format:', backend)
    applications = []
    total = 0
  }
  
  console.log('📦 getApplicationsPage - backend response:', {
    isArray: Array.isArray(backend),
    applicationsCount: applications.length,
    total,
    page: currentPage,
    limit: currentLimit,
  })

  return {
    applications: applications.map(mapApplication),
    total,
    page: currentPage,
    limit: currentLimit,
    totalPages,
  }
}

/** Backwards-compatible helper for callers that only need the list (no pagination metadata). */
export async function getApplications(filters?: ApplicationFilters): Promise<Application[]> {
  const page = await getApplicationsPage(filters)
  return page.applications
}

export async function getApplication(id: string): Promise<Application> {
  const backend = await apiGet<{
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
    portal?: string | null
    notes?: string | null
    created_at: string
    updated_at: string
    candidate?: { id: number; candidate_name: string; phone: string | null; email: string | null; qualification: string | null; work_exp_years?: number | null; portal_id?: number; created_at: string }
    job_role?: { id: number; company_id: number; role_name: string; department?: string; is_active?: boolean; created_at: string; company?: { id: number; name: string; slug?: string; description?: string; industry?: string | null; size?: string; website?: string; job_roles_count?: number; created_at?: string } }
    company?: { id: number; name: string; slug?: string; description?: string; industry?: string | null; size?: string; website?: string; job_roles_count?: number; created_at?: string }
    recruiter?: { id: number; name: string; email: string; phone?: string; is_active?: boolean; created_at: string; updated_at: string }
  }>(`/applications/${id}`)
  
  return mapApplication(backend)
}

export async function createApplication(application: Omit<Application, 'id' | 'created_at' | 'updated_at' | 'recruiter' | 'candidate' | 'job_role'>): Promise<Application> {
  const backend = await apiPost<{
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
    portal?: string | null
    notes?: string | null
    created_at: string
    updated_at: string
  }>('/applications', {
    candidate_id: Number(application.candidate_id),
    job_role_id: application.job_role_id ? Number(application.job_role_id) : null,
    assigned_date: application.assigned_date,
    call_date: application.call_date,
    call_status: application.call_status,
    interested_status: application.interested_status,
    selection_status: application.selection_status,
    joining_status: application.joining_status,
    notes: application.notes,
  })
  
  // Fetch full application with relations
  return getApplication(String(backend.id))
}

export async function updateApplication(id: string, updates: Partial<Application>): Promise<Application> {
  const backend = await apiPatch<{
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
    portal?: string | null
    notes?: string | null
    created_at: string
    updated_at: string
  }>(`/applications/${id}`, {
    portal: updates.portal,
    assigned_date: updates.assigned_date,
    call_date: updates.call_date,
    call_status: updates.call_status,
    interested_status: updates.interested_status,
    not_interested_remark: updates.not_interested_remark,
    interview_scheduled: updates.interview_scheduled,
    interview_date: updates.interview_date,
    turnup: updates.turnup,
    interview_status: updates.interview_status,
    selection_status: updates.selection_status,
    joining_status: updates.joining_status,
    joining_date: updates.joining_date,
    backout_date: updates.backout_date,
    backout_reason: updates.backout_reason,
    hiring_manager_feedback: updates.hiring_manager_feedback,
    followup_date: updates.followup_date,
    notes: updates.notes,
  })
  
  // Fetch full application with relations
  return getApplication(String(backend.id))
}

export async function deleteApplication(id: string): Promise<void> {
  await apiDelete(`/applications/${id}`)
}

// Dashboard

export async function getDashboardStats(recruiterId?: string): Promise<DashboardStats> {
  const query = recruiterId ? `?recruiter_id=${recruiterId}` : ''
  const backend = await apiGet<{
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
  }>(`/dashboard/stats${query}`)
  
  return mapDashboardStats(backend)
}

export async function getPipelineFlow(filters?: ApplicationFilters): Promise<PipelineFlow> {
  const query = buildQueryString(filters as Record<string, unknown>)
  const backend = await apiGet<Array<{ stage: string; count: number }>>(`/dashboard/pipeline${query}`)
  
  return mapPipelineFlow(backend)
}

/**
 * Recruiter today progress: pipeline stage counts for the current day only.
 * Used by the Candidates page Flow Tracking widget.
 * See docs/RECRUITER_TODAY_PROGRESS_API.md.
 * Accepts either array of { stage, count } or object { sourced, call_done, ... }.
 */
export async function getRecruiterTodayProgress(recruiterId?: string): Promise<PipelineFlow> {
  const query = recruiterId ? `?recruiter_id=${encodeURIComponent(recruiterId)}` : ''
  const backend = await apiGet<
    Array<{ stage: string; count: number }> | Record<string, unknown>
  >(`/dashboard/today-progress${query}`)
  if (Array.isArray(backend)) {
    return mapPipelineFlow(backend)
  }
  if (backend && typeof backend === 'object' && !Array.isArray(backend)) {
    return mapPipelineFlowFromObject(backend as Record<string, unknown>)
  }
  return mapPipelineFlow([])
}

// Job portal pending applications (GET /api/applications/pending, etc.)
export interface PendingJobApplication {
  id: number
  jobId: number
  userId: number
  status: string
  coverLetter?: string | null
  resume?: string | null
  appliedAt?: string
  createdAt: string
  updatedAt: string
  recruiterCallDate?: string | null
  recruiterCallStatus?: string | null
  recruiterInterested?: boolean | null
  expectedSalary?: string | null
  user?: {
    id: number
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    location?: string
    profile?: {
      education?: string
      skills?: string[]
      location?: string
      phone?: string
      [key: string]: unknown
    }
  }
  job?: {
    id: number
    title: string
    company?: { id: number; name: string; logo?: string }
  }
}

function normalizePendingApp(raw: Record<string, unknown>): PendingJobApplication {
  const user = raw.user as Record<string, unknown> | undefined
  const job = raw.job as Record<string, unknown> | undefined
  const company = job?.company as Record<string, unknown> | undefined
  return {
    id: Number(raw.id ?? raw.application_id),
    jobId: Number(raw.jobId ?? raw.job_id),
    userId: Number(raw.userId ?? raw.user_id),
    status: String(raw.status ?? ''),
    coverLetter: (raw.coverLetter ?? raw.cover_letter) as string | null | undefined,
    resume: (raw.resume ?? raw.resume_url) as string | null | undefined,
    appliedAt: (raw.appliedAt ?? raw.applied_at) as string | undefined,
    createdAt: String(raw.createdAt ?? raw.created_at ?? ''),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ''),
    recruiterCallDate: (raw.recruiterCallDate ?? raw.recruiter_call_date) as string | null | undefined,
    recruiterCallStatus: (raw.recruiterCallStatus ?? raw.recruiter_call_status) as string | null | undefined,
    recruiterInterested: (raw.recruiterInterested ?? raw.recruiter_interested) as boolean | null | undefined,
    expectedSalary: (raw.expectedSalary ?? raw.expected_salary) as string | null | undefined,
    user: user
      ? {
          id: Number(user.id),
          firstName: (user.firstName ?? user.first_name) as string | undefined,
          lastName: (user.lastName ?? user.last_name) as string | undefined,
          email: user.email != null ? String(user.email) : undefined,
          phone: user.phone != null ? String(user.phone) : undefined,
          location: user.location != null ? String(user.location) : undefined,
          profile: user.profile
            ? (() => {
                const p = user.profile as Record<string, unknown>
                return {
                  ...p,
                  education: p.education as string | undefined,
                  skills: Array.isArray(p.skills) ? (p.skills as string[]) : undefined,
                  location: p.location as string | undefined,
                  phone: p.phone as string | undefined,
                }
              })()
            : undefined,
        }
      : undefined,
    job: job
      ? {
          id: Number(job.id),
          title: String(job.title ?? ''),
          company: company ? { id: Number(company.id), name: String(company.name), logo: company.logo != null ? String(company.logo) : undefined } : undefined,
        }
      : undefined,
  }
}

export async function getPendingJobApplications(): Promise<PendingJobApplication[]> {
  const backend = await apiApplicationsRequest<unknown>('/pending')
  const arr = Array.isArray(backend) ? backend : (backend as { data?: unknown[] })?.data ?? []
  return arr.map((item) => normalizePendingApp(typeof item === 'object' && item != null ? (item as Record<string, unknown>) : {}))
}

export async function getJobApplicationById(id: number | string): Promise<PendingJobApplication> {
  const raw = await apiApplicationsRequest<Record<string, unknown>>(`/${id}`)
  return normalizePendingApp(raw)
}

export async function submitRecruiterCall(
  id: number | string,
  body: { callDate: string; callStatus: string; interested: boolean | null }
): Promise<PendingJobApplication> {
  return apiApplicationsRequest<PendingJobApplication>(`/${id}/recruiter-call`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}
