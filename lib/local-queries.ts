// Local queries that use localDB instead of Supabase
import { localDB } from './local-db'
import type {
  Recruiter,
  Company,
  JobRole,
  Candidate,
  Application,
  DashboardStats,
  PipelineFlow,
} from '@/types/database'

// Check if we should use local mode
export const USE_LOCAL_MODE = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                              !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                              process.env.NEXT_PUBLIC_USE_LOCAL === 'true'

export async function getRecruiters(): Promise<Recruiter[]> {
  if (USE_LOCAL_MODE) {
    return localDB.getRecruiters()
  }
  // Fallback to Supabase if needed
  throw new Error('Supabase not configured')
}

export async function getRecruiterByEmail(email: string): Promise<Recruiter | null> {
  if (USE_LOCAL_MODE) {
    return localDB.getRecruiterByEmail(email)
  }
  throw new Error('Supabase not configured')
}

export async function getCompanies(): Promise<Company[]> {
  if (USE_LOCAL_MODE) {
    return localDB.getCompanies()
  }
  throw new Error('Supabase not configured')
}

export async function getJobRoles(): Promise<JobRole[]> {
  if (USE_LOCAL_MODE) {
    return localDB.getJobRoles()
  }
  throw new Error('Supabase not configured')
}

export async function getCandidates(): Promise<Candidate[]> {
  if (USE_LOCAL_MODE) {
    return localDB.getCandidates()
  }
  throw new Error('Supabase not configured')
}

export async function createCandidate(candidate: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>): Promise<Candidate> {
  if (USE_LOCAL_MODE) {
    return localDB.createCandidate(candidate)
  }
  throw new Error('Supabase not configured')
}

export async function getApplications(filters?: any): Promise<Application[]> {
  if (USE_LOCAL_MODE) {
    return localDB.getApplications(filters)
  }
  throw new Error('Supabase not configured')
}

export async function createApplication(application: any): Promise<Application> {
  if (USE_LOCAL_MODE) {
    return localDB.createApplication(application)
  }
  throw new Error('Supabase not configured')
}

export async function updateApplication(id: string, updates: Partial<Application>): Promise<Application> {
  if (USE_LOCAL_MODE) {
    return localDB.updateApplication(id, updates)
  }
  throw new Error('Supabase not configured')
}

export async function deleteApplication(id: string): Promise<void> {
  if (USE_LOCAL_MODE) {
    return localDB.deleteApplication(id)
  }
  throw new Error('Supabase not configured')
}

export async function getDashboardStats(recruiterId?: string): Promise<DashboardStats> {
  if (USE_LOCAL_MODE) {
    return localDB.getDashboardStats(recruiterId)
  }
  throw new Error('Supabase not configured')
}

export async function getPipelineFlow(filters?: any): Promise<PipelineFlow> {
  if (USE_LOCAL_MODE) {
    return localDB.getPipelineFlow(filters)
  }
  throw new Error('Supabase not configured')
}
