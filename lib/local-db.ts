// Local database simulation using localStorage
import { LocalStorage, initializeLocalData } from './local-storage'
import type {
  Recruiter,
  Company,
  JobRole,
  Candidate,
  Application,
  ApplicationFilters,
  ApplicationRaw,
  DashboardStats,
  PipelineFlow,
} from '@/types/database'
import { computePipelineFlowFromApplications } from './utils'

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

  async createJobRole(jobRole: Omit<JobRole, 'id' | 'created_at' | 'updated_at' | 'company'>): Promise<JobRole> {
    const jobRoles = await this.getJobRoles()
    const companies = await this.getCompanies()
    
    const newJobRole: JobRole = {
      ...jobRole,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      company: companies.find((c) => c.id === jobRole.company_id),
    }
    
    const rawJobRoles = LocalStorage.get<JobRole[]>('job_roles') || []
    rawJobRoles.push({
      id: newJobRole.id,
      job_role: newJobRole.job_role,
      company_id: newJobRole.company_id,
      created_at: newJobRole.created_at,
      updated_at: newJobRole.updated_at,
    })
    LocalStorage.set('job_roles', rawJobRoles)
    
    return newJobRole
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

  // Applications — storage holds only raw rows (no relations)
  getRawApplications(): ApplicationRaw[] {
    const raw = LocalStorage.get<ApplicationRaw[]>('applications') || []
    return raw.map((app) => {
      const { recruiter, candidate, job_role, ...rest } = app as ApplicationRaw & Partial<Application>
      return rest as ApplicationRaw
    })
  },

  async getApplications(filters?: ApplicationFilters): Promise<Application[]> {
    const rawRows = this.getRawApplications()
    const recruiters = await this.getRecruiters()
    const candidates = await this.getCandidates()
    const jobRoles = await this.getJobRoles()

    let applications: Application[] = rawRows.map((app) => ({
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
      applications = applications.filter((app) => app.job_role?.company?.id === filters.company_id)
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
    const rawRows = this.getRawApplications()
    const recruiters = await this.getRecruiters()
    const candidates = await this.getCandidates()
    const jobRoles = await this.getJobRoles()

    const newRaw: ApplicationRaw = {
      ...application,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    rawRows.push(newRaw)
    LocalStorage.set('applications', rawRows)

    return {
      ...newRaw,
      recruiter: recruiters.find((r) => r.id === application.recruiter_id),
      candidate: candidates.find((c) => c.id === application.candidate_id),
      job_role: jobRoles.find((jr) => jr.id === application.job_role_id),
    }
  },

  async updateApplication(id: string, updates: Partial<Application>): Promise<Application> {
    const rawRows = this.getRawApplications()
    const index = rawRows.findIndex((app) => app.id === id)
    if (index === -1) throw new Error('Application not found')

    const { recruiter, candidate, job_role, ...restUpdates } = updates
    rawRows[index] = {
      ...rawRows[index],
      ...restUpdates,
      updated_at: new Date().toISOString(),
    }
    LocalStorage.set('applications', rawRows)

    const recruiters = await this.getRecruiters()
    const candidates = await this.getCandidates()
    const jobRoles = await this.getJobRoles()
    const updated = rawRows[index]
    return {
      ...updated,
      recruiter: recruiters.find((r) => r.id === updated.recruiter_id),
      candidate: candidates.find((c) => c.id === updated.candidate_id),
      job_role: jobRoles.find((jr) => jr.id === updated.job_role_id),
    }
  },

  async getApplication(id: string): Promise<Application> {
    const applications = await this.getApplications()
    const application = applications.find((app) => app.id === id)
    if (!application) throw new Error('Application not found')
    return application
  },

  async deleteApplication(id: string): Promise<void> {
    const rawRows = this.getRawApplications().filter((app) => app.id !== id)
    LocalStorage.set('applications', rawRows)
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
  async getPipelineFlow(filters?: ApplicationFilters): Promise<PipelineFlow> {
    const applications = await this.getApplications(filters)
    return computePipelineFlowFromApplications(applications)
  },
}
