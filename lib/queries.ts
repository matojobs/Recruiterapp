import { supabase } from './supabase'
import type {
  Application,
  Recruiter,
  Company,
  JobRole,
  Candidate,
  DashboardStats,
  PipelineFlow,
  RecruiterPerformance,
} from '@/types/database'

// Recruiters
export async function getRecruiters() {
  const { data, error } = await supabase
    .from('recruiters')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data as Recruiter[]
}

export async function createRecruiter(recruiter: Omit<Recruiter, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('recruiters')
    .insert([recruiter])
    .select()
    .single()
  
  if (error) throw error
  return data as Recruiter
}

// Companies
export async function getCompanies() {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('company_name')
  
  if (error) throw error
  return data as Company[]
}

export async function createCompany(company: Omit<Company, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('companies')
    .insert([company])
    .select()
    .single()
  
  if (error) throw error
  return data as Company
}

// Job Roles
export async function getJobRoles() {
  const { data, error } = await supabase
    .from('job_roles')
    .select('*, company:companies(*)')
    .order('job_role')
  
  if (error) throw error
  return data as JobRole[]
}

export async function createJobRole(jobRole: Omit<JobRole, 'id' | 'created_at' | 'updated_at' | 'company'>) {
  const { data, error } = await supabase
    .from('job_roles')
    .insert([jobRole])
    .select('*, company:companies(*)')
    .single()
  
  if (error) throw error
  return data as JobRole
}

// Candidates
export async function getCandidates() {
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .order('candidate_name')
  
  if (error) throw error
  return data as Candidate[]
}

export async function createCandidate(candidate: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('candidates')
    .insert([candidate])
    .select()
    .single()
  
  if (error) throw error
  return data as Candidate
}

// Applications
export async function getApplications(filters?: {
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
}) {
  let query = supabase
    .from('applications')
    .select(`
      *,
      recruiter:recruiters(*),
      candidate:candidates(*),
      job_role:job_roles(*, company:companies(*))
    `)
    .order('created_at', { ascending: false })

  if (filters?.recruiter_id) {
    query = query.eq('recruiter_id', filters.recruiter_id)
  }
  // Note: company_id filter will be handled client-side after fetching
  // as Supabase doesn't support nested relation filtering directly
  if (filters?.job_role_id) {
    query = query.eq('job_role_id', filters.job_role_id)
  }
  if (filters?.portal) {
    query = query.ilike('portal', `%${filters.portal}%`)
  }
  if (filters?.call_status) {
    query = query.eq('call_status', filters.call_status)
  }
  if (filters?.interested_status) {
    query = query.eq('interested_status', filters.interested_status)
  }
  if (filters?.interview_status) {
    query = query.eq('interview_status', filters.interview_status)
  }
  if (filters?.selection_status) {
    query = query.eq('selection_status', filters.selection_status)
  }
  if (filters?.joining_status) {
    query = query.eq('joining_status', filters.joining_status)
  }
  if (filters?.date_from) {
    query = query.gte('assigned_date', filters.date_from)
  }
  if (filters?.date_to) {
    query = query.lte('assigned_date', filters.date_to)
  }

  const { data, error } = await query
  
  if (error) throw error
  return data as Application[]
}

export async function getApplication(id: string) {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      recruiter:recruiters(*),
      candidate:candidates(*),
      job_role:job_roles(*, company:companies(*))
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as Application
}

export async function createApplication(application: Omit<Application, 'id' | 'created_at' | 'updated_at' | 'recruiter' | 'candidate' | 'job_role'>) {
  const { data, error } = await supabase
    .from('applications')
    .insert([application])
    .select(`
      *,
      recruiter:recruiters(*),
      candidate:candidates(*),
      job_role:job_roles(*, company:companies(*))
    `)
    .single()
  
  if (error) throw error
  return data as Application
}

export async function updateApplication(id: string, updates: Partial<Application>) {
  const { data, error } = await supabase
    .from('applications')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      recruiter:recruiters(*),
      candidate:candidates(*),
      job_role:job_roles(*, company:companies(*))
    `)
    .single()
  
  if (error) throw error
  return data as Application
}

export async function deleteApplication(id: string) {
  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Dashboard Stats
export async function getDashboardStats(recruiterId?: string): Promise<DashboardStats> {
  const today = new Date().toISOString().split('T')[0]
  const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const buildQuery = () => {
    let query = supabase.from('applications')
    if (recruiterId) {
      query = query.eq('recruiter_id', recruiterId)
    }
    return query
  }

  // Total sourced
  const { count: totalSourced } = await buildQuery()
    .select('*', { count: 'exact', head: true })

  // Calls done today
  const { count: callsDoneToday } = await buildQuery()
    .select('*', { count: 'exact', head: true })
    .eq('call_date', today)

  // Connected today
  const { count: connectedToday } = await buildQuery()
    .select('*', { count: 'exact', head: true })
    .eq('call_date', today)
    .eq('call_status', 'Connected')

  // Interested today
  const { count: interestedToday } = await buildQuery()
    .select('*', { count: 'exact', head: true })
    .eq('call_date', today)
    .eq('interested_status', 'Yes')

  // Not interested today
  const { count: notInterestedToday } = await buildQuery()
    .select('*', { count: 'exact', head: true })
    .eq('call_date', today)
    .eq('interested_status', 'No')

  // Interviews scheduled (upcoming)
  const { count: interviewsScheduled } = await buildQuery()
    .select('*', { count: 'exact', head: true })
    .eq('interview_scheduled', true)
    .gte('interview_date', today)

  // Interviews done today
  const { count: interviewsDoneToday } = await buildQuery()
    .select('*', { count: 'exact', head: true })
    .eq('interview_date', today)
    .eq('interview_status', 'Done')

  // Selected this month
  const { count: selectedThisMonth } = await buildQuery()
    .select('*', { count: 'exact', head: true })
    .eq('selection_status', 'Selected')
    .gte('updated_at', thisMonthStart)

  // Joined this month
  const { count: joinedThisMonth } = await buildQuery()
    .select('*', { count: 'exact', head: true })
    .eq('joining_status', 'Joined')
    .gte('joining_date', thisMonthStart)

  // Pending joining
  const { count: pendingJoining } = await buildQuery()
    .select('*', { count: 'exact', head: true })
    .eq('selection_status', 'Selected')
    .eq('joining_status', 'Pending')

  return {
    totalSourced: totalSourced || 0,
    callsDoneToday: callsDoneToday || 0,
    connectedToday: connectedToday || 0,
    interestedToday: interestedToday || 0,
    notInterestedToday: notInterestedToday || 0,
    interviewsScheduled: interviewsScheduled || 0,
    interviewsDoneToday: interviewsDoneToday || 0,
    selectedThisMonth: selectedThisMonth || 0,
    joinedThisMonth: joinedThisMonth || 0,
    pendingJoining: pendingJoining || 0,
  }
}

// Pipeline Flow
export async function getPipelineFlow(filters?: {
  recruiter_id?: string
  company_id?: string
  date_from?: string
  date_to?: string
}): Promise<PipelineFlow> {
  let baseQuery = supabase.from('applications').select('*', { count: 'exact', head: true })

  if (filters?.recruiter_id) {
    baseQuery = baseQuery.eq('recruiter_id', filters.recruiter_id)
  }
  // Note: company_id filter will be handled client-side
  if (filters?.date_from) {
    baseQuery = baseQuery.gte('assigned_date', filters.date_from)
  }
  if (filters?.date_to) {
    baseQuery = baseQuery.lte('assigned_date', filters.date_to)
  }

  // Sourced
  const { count: sourced } = await baseQuery.select('*', { count: 'exact', head: true })

  // Call done
  const { count: callDone } = await baseQuery
    .not('call_date', 'is', null)
    .select('*', { count: 'exact', head: true })

  // Connected
  const { count: connected } = await baseQuery
    .eq('call_status', 'Connected')
    .select('*', { count: 'exact', head: true })

  // Interested
  const { count: interested } = await baseQuery
    .eq('interested_status', 'Yes')
    .select('*', { count: 'exact', head: true })

  // Not interested
  const { count: notInterested } = await baseQuery
    .eq('interested_status', 'No')
    .select('*', { count: 'exact', head: true })

  // Interview scheduled
  const { count: interviewScheduled } = await baseQuery
    .eq('interview_scheduled', true)
    .select('*', { count: 'exact', head: true })

  // Interview done
  const { count: interviewDone } = await baseQuery
    .eq('interview_status', 'Done')
    .select('*', { count: 'exact', head: true })

  // Selected
  const { count: selected } = await baseQuery
    .eq('selection_status', 'Selected')
    .select('*', { count: 'exact', head: true })

  // Joined
  const { count: joined } = await baseQuery
    .eq('joining_status', 'Joined')
    .select('*', { count: 'exact', head: true })

  return {
    sourced: sourced || 0,
    callDone: callDone || 0,
    connected: connected || 0,
    interested: interested || 0,
    notInterested: notInterested || 0,
    interviewScheduled: interviewScheduled || 0,
    interviewDone: interviewDone || 0,
    selected: selected || 0,
    joined: joined || 0,
  }
}

// Recruiter Performance
export async function getRecruiterPerformance(): Promise<RecruiterPerformance[]> {
  const { data: applications } = await supabase
    .from('applications')
    .select('recruiter_id, call_status, interested_status, interview_scheduled, selection_status, joining_status, recruiter:recruiters(name)')

  if (!applications) return []

  const performanceMap = new Map<string, RecruiterPerformance>()

  applications.forEach((app: any) => {
    if (!app.recruiter_id) return

    const recruiterId = app.recruiter_id
    if (!performanceMap.has(recruiterId)) {
      performanceMap.set(recruiterId, {
        recruiter_id: recruiterId,
        recruiter_name: app.recruiter?.name || 'Unknown',
        callsMade: 0,
        connected: 0,
        interested: 0,
        interviewsScheduled: 0,
        selected: 0,
        joined: 0,
        connectedRate: 0,
        interestedRate: 0,
      })
    }

    const perf = performanceMap.get(recruiterId)!
    if (app.call_status) perf.callsMade++
    if (app.call_status === 'Connected') perf.connected++
    if (app.interested_status === 'Yes') perf.interested++
    if (app.interview_scheduled) perf.interviewsScheduled++
    if (app.selection_status === 'Selected') perf.selected++
    if (app.joining_status === 'Joined') perf.joined++
  })

  const performance = Array.from(performanceMap.values())
  performance.forEach((perf) => {
    perf.connectedRate = perf.callsMade > 0 ? Math.round((perf.connected / perf.callsMade) * 100) : 0
    perf.interestedRate = perf.connected > 0 ? Math.round((perf.interested / perf.connected) * 100) : 0
  })

  return performance
}
