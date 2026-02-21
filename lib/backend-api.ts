/**
 * Backend API functions that call the live backend.
 * These functions handle API requests and transform responses to frontend format.
 */

import { apiGet, apiPost, apiPatch, apiDelete } from './api-client'
import {
  mapCompany,
  mapJobRole,
  mapRecruiter,
  mapCandidate,
  mapApplication,
  mapDashboardStats,
  mapPipelineFlow,
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

export async function getCandidates(search?: string): Promise<Candidate[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
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

// Applications

export async function getApplications(filters?: ApplicationFilters): Promise<Application[]> {
  const query = buildQueryString(filters as Record<string, unknown>)
  const backend = await apiGet<Array<{
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
  }> | { data?: Array<any>; applications?: Array<any>; items?: Array<any> }>(`/applications${query}`)
  
  // Handle different response formats
  let applications: any[]
  if (Array.isArray(backend)) {
    applications = backend
  } else if (backend && typeof backend === 'object') {
    // Handle paginated or wrapped responses
    applications = (backend as any).data || (backend as any).applications || (backend as any).items || []
  } else {
    console.error('❌ Unexpected backend response format:', backend)
    applications = []
  }
  
  console.log('📦 getApplications - backend response:', { isArray: Array.isArray(backend), applicationsCount: applications.length })
  
  return applications.map(mapApplication)
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
    call_date: updates.call_date,
    call_status: updates.call_status,
    interested_status: updates.interested_status,
    selection_status: updates.selection_status,
    joining_status: updates.joining_status,
    notes: updates.notes,
    // Include other fields backend might accept
    interview_date: updates.interview_date,
    interview_status: updates.interview_status,
    joining_date: updates.joining_date,
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
