// Local database simulation using localStorage
import { LocalStorage, initializeLocalData } from './local-storage'
import type {
  Recruiter,
  Company,
  JobRole,
  Candidate,
  Application,
  DashboardStats,
  PipelineFlow,
} from '@/types/database'

// Initialize data on import
if (typeof window !== 'undefined') {
  initializeLocalData()
}

// Simulate Supabase-like queries
export const localDB = {
  // Auth
  async signIn(email: string, password: string) {
    // In local mode, any password works - just check email
    const recruiters = LocalStorage.get<Recruiter[]>('recruiters') || []
    const recruiter = recruiters.find((r) => r.email === email)
    
    if (!recruiter) {
      throw new Error('Invalid email. Use: john@recruiter.com, jane@recruiter.com, or mike@recruiter.com')
    }

    // Store current user
    LocalStorage.set('current_user', { email, recruiter_id: recruiter.id })
    return { user: { email, id: recruiter.id }, recruiter }
  },

  async signOut() {
    LocalStorage.set('current_user', null)
  },

  async getCurrentUser() {
    return LocalStorage.get<{ email: string; recruiter_id: string }>('current_user')
  },

  // Recruiters
  async getRecruiters(): Promise<Recruiter[]> {
    return LocalStorage.get<Recruiter[]>('recruiters') || []
  },

  async getRecruiterByEmail(email: string): Promise<Recruiter | null> {
    const recruiters = await this.getRecruiters()
    return recruiters.find((r) => r.email === email) || null
  },

  // Companies
  async getCompanies(): Promise<Company[]> {
    return LocalStorage.get<Company[]>('companies') || []
  },

  // Job Roles
  async getJobRoles(): Promise<JobRole[]> {
    const jobRoles = LocalStorage.get<JobRole[]>('job_roles') || []
    const companies = await this.getCompanies()
    
    return jobRoles.map((jr) => ({
      ...jr,
      company: companies.find((c) => c.id === jr.company_id),
    }))
  },

  // Candidates
  async getCandidates(): Promise<Candidate[]> {
    return LocalStorage.get<Candidate[]>('candidates') || []
  },

  async createCandidate(candidate: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>): Promise<Candidate> {
    const candidates = await this.getCandidates()
    const newCandidate: Candidate = {
      ...candidate,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    candidates.push(newCandidate)
    LocalStorage.set('candidates', candidates)
    return newCandidate
  },

  // Applications
  async getApplications(filters?: {
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
  }): Promise<Application[]> {
    let applications = LocalStorage.get<Application[]>('applications') || []
    const recruiters = await this.getRecruiters()
    const candidates = await this.getCandidates()
    const jobRoles = await this.getJobRoles()

    // Join relations
    applications = applications.map((app) => ({
      ...app,
      recruiter: recruiters.find((r) => r.id === app.recruiter_id),
      candidate: candidates.find((c) => c.id === app.candidate_id),
      job_role: jobRoles.find((jr) => jr.id === app.job_role_id),
    }))

    // Apply filters
    if (filters?.recruiter_id) {
      applications = applications.filter((app) => app.recruiter_id === filters.recruiter_id)
    }
    if (filters?.job_role_id) {
      applications = applications.filter((app) => app.job_role_id === filters.job_role_id)
    }
    if (filters?.portal) {
      applications = applications.filter((app) => app.portal?.toLowerCase().includes(filters.portal!.toLowerCase()))
    }
    if (filters?.call_status) {
      applications = applications.filter((app) => app.call_status === filters.call_status)
    }
    if (filters?.interested_status) {
      applications = applications.filter((app) => app.interested_status === filters.interested_status)
    }
    if (filters?.interview_status) {
      applications = applications.filter((app) => app.interview_status === filters.interview_status)
    }
    if (filters?.selection_status) {
      applications = applications.filter((app) => app.selection_status === filters.selection_status)
    }
    if (filters?.joining_status) {
      applications = applications.filter((app) => app.joining_status === filters.joining_status)
    }
    if (filters?.company_id) {
      applications = applications.filter((app) => (app.job_role as any)?.company?.id === filters.company_id)
    }
    if (filters?.date_from) {
      applications = applications.filter((app) => app.assigned_date && app.assigned_date >= filters.date_from!)
    }
    if (filters?.date_to) {
      applications = applications.filter((app) => app.assigned_date && app.assigned_date <= filters.date_to!)
    }

    return applications
  },

  async createApplication(application: Omit<Application, 'id' | 'created_at' | 'updated_at' | 'recruiter' | 'candidate' | 'job_role'>): Promise<Application> {
    const applications = await this.getApplications()
    const recruiters = await this.getRecruiters()
    const candidates = await this.getCandidates()
    const jobRoles = await this.getJobRoles()

    const newApplication: Application = {
      ...application,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      recruiter: recruiters.find((r) => r.id === application.recruiter_id),
      candidate: candidates.find((c) => c.id === application.candidate_id),
      job_role: jobRoles.find((jr) => jr.id === application.job_role_id),
    } as Application

    applications.push(newApplication)
    LocalStorage.set('applications', applications)
    return newApplication
  },

  async updateApplication(id: string, updates: Partial<Application>): Promise<Application> {
    const applications = await this.getApplications()
    const index = applications.findIndex((app) => app.id === id)
    if (index === -1) throw new Error('Application not found')

    applications[index] = {
      ...applications[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }

    LocalStorage.set('applications', applications)
    return applications[index]
  },

  async deleteApplication(id: string): Promise<void> {
    const applications = await this.getApplications()
    const filtered = applications.filter((app) => app.id !== id)
    LocalStorage.set('applications', filtered)
  },

  // Dashboard Stats
  async getDashboardStats(recruiterId?: string): Promise<DashboardStats> {
    const applications = await this.getApplications(recruiterId ? { recruiter_id: recruiterId } : {})
    const today = new Date().toISOString().split('T')[0]
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

    return {
      totalSourced: applications.length,
      callsDoneToday: applications.filter((app) => app.call_date === today).length,
      connectedToday: applications.filter((app) => app.call_date === today && app.call_status === 'Connected').length,
      interestedToday: applications.filter((app) => app.call_date === today && app.interested_status === 'Yes').length,
      notInterestedToday: applications.filter((app) => app.call_date === today && app.interested_status === 'No').length,
      interviewsScheduled: applications.filter((app) => app.interview_scheduled && app.interview_date && app.interview_date >= today).length,
      interviewsDoneToday: applications.filter((app) => app.interview_date === today && app.interview_status === 'Done').length,
      selectedThisMonth: applications.filter((app) => app.selection_status === 'Selected' && app.updated_at >= thisMonthStart).length,
      joinedThisMonth: applications.filter((app) => app.joining_status === 'Joined' && app.joining_date && app.joining_date >= thisMonthStart).length,
      pendingJoining: applications.filter((app) => app.selection_status === 'Selected' && app.joining_status === 'Pending').length,
    }
  },

  // Pipeline Flow
  async getPipelineFlow(filters?: { recruiter_id?: string }): Promise<PipelineFlow> {
    const applications = await this.getApplications(filters)

    return {
      sourced: applications.length,
      callDone: applications.filter((app) => app.call_date).length,
      connected: applications.filter((app) => app.call_status === 'Connected').length,
      interested: applications.filter((app) => app.interested_status === 'Yes').length,
      notInterested: applications.filter((app) => app.interested_status === 'No').length,
      interviewScheduled: applications.filter((app) => app.interview_scheduled).length,
      interviewDone: applications.filter((app) => app.interview_status === 'Done').length,
      selected: applications.filter((app) => app.selection_status === 'Selected').length,
      joined: applications.filter((app) => app.joining_status === 'Joined').length,
    }
  },
}
