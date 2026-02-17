// Local storage utilities for offline/local mode

export const LocalStorage = {
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null
    const item = localStorage.getItem(key)
    if (!item) return null
    try {
      return JSON.parse(item) as T
    } catch {
      return null
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(key, JSON.stringify(value))
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(key)
  },

  clear(): void {
    if (typeof window === 'undefined') return
    localStorage.clear()
  },
}

// Initialize dummy data if not exists
export function initializeLocalData() {
  if (typeof window === 'undefined') return

  // Check if data already exists
  if (LocalStorage.get('recruiters')) return

  // Dummy recruiters
  const recruiters = [
    { id: '1', name: 'John Doe', email: 'john@recruiter.com', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '2', name: 'Jane Smith', email: 'jane@recruiter.com', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '3', name: 'Mike Johnson', email: 'mike@recruiter.com', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ]
  LocalStorage.set('recruiters', recruiters)

  // Dummy companies
  const companies = [
    { id: '1', company_name: 'TechCorp Solutions', industry: 'Technology', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '2', company_name: 'FinanceHub Inc', industry: 'Finance', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '3', company_name: 'HealthCare Plus', industry: 'Healthcare', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ]
  LocalStorage.set('companies', companies)

  // Dummy job roles
  const jobRoles = [
    { id: '1', job_role: 'Software Engineer', company_id: '1', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), company: companies[0] },
    { id: '2', job_role: 'Senior Developer', company_id: '1', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), company: companies[0] },
    { id: '3', job_role: 'Data Analyst', company_id: '2', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), company: companies[1] },
    { id: '4', job_role: 'Nurse', company_id: '3', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), company: companies[2] },
  ]
  LocalStorage.set('job_roles', jobRoles)

  // Dummy candidates
  const candidates = [
    { id: '1', candidate_name: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh@email.com', qualification: 'B.Tech', age: 28, location: 'Mumbai', work_exp_years: 5, current_ctc: 800000, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '2', candidate_name: 'Priya Sharma', phone: '9876543211', email: 'priya@email.com', qualification: 'MBA', age: 26, location: 'Delhi', work_exp_years: 3, current_ctc: 600000, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '3', candidate_name: 'Amit Patel', phone: '9876543212', email: 'amit@email.com', qualification: 'B.Com', age: 30, location: 'Bangalore', work_exp_years: 7, current_ctc: 1200000, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ]
  LocalStorage.set('candidates', candidates)

  // Calculate dates relative to today for joined age ranges
  const today = new Date()
  const date5DaysAgo = new Date(today)
  date5DaysAgo.setDate(today.getDate() - 5)
  
  const date15DaysAgo = new Date(today)
  date15DaysAgo.setDate(today.getDate() - 15)
  
  const date50DaysAgo = new Date(today)
  date50DaysAgo.setDate(today.getDate() - 50)
  
  const date70DaysAgo = new Date(today)
  date70DaysAgo.setDate(today.getDate() - 70)
  
  const date100DaysAgo = new Date(today)
  date100DaysAgo.setDate(today.getDate() - 100)

  // Dummy applications - All joined candidates for recruiter '1' to show all ranges
  const applications = [
    {
      id: '1',
      portal: 'Naukri',
      job_role_id: '1',
      assigned_date: '2024-01-15',
      recruiter_id: '1',
      candidate_id: '1',
      call_date: '2024-01-16',
      call_status: 'Connected',
      interested_status: 'Yes',
      not_interested_remark: null,
      interview_scheduled: true,
      interview_date: '2024-01-20',
      turnup: true,
      interview_status: 'Done',
      selection_status: 'Selected',
      joining_status: 'Joined',
      joining_date: date5DaysAgo.toISOString().split('T')[0], // 5 days ago - falls in 1-7 days range
      hiring_manager_feedback: 'Great candidate',
      followup_date: null,
      notes: 'Excellent fit',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      recruiter: recruiters[0],
      candidate: candidates[0],
      job_role: jobRoles[0],
    },
    {
      id: '2',
      portal: 'LinkedIn',
      job_role_id: '2',
      assigned_date: '2024-01-20',
      recruiter_id: '1',
      candidate_id: '2',
      call_date: '2024-01-21',
      call_status: 'Connected',
      interested_status: 'Yes',
      not_interested_remark: null,
      interview_scheduled: true,
      interview_date: '2024-01-25',
      turnup: true,
      interview_status: 'Done',
      selection_status: 'Selected',
      joining_status: 'Joined',
      joining_date: date15DaysAgo.toISOString().split('T')[0], // 15 days ago - falls in 10-30 days range
      hiring_manager_feedback: 'Good fit',
      followup_date: null,
      notes: 'Joined successfully',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      recruiter: recruiters[0],
      candidate: candidates[1],
      job_role: jobRoles[1],
    },
    {
      id: '3',
      portal: 'Naukri',
      job_role_id: '3',
      assigned_date: '2024-02-01',
      recruiter_id: '1',
      candidate_id: '3',
      call_date: '2024-02-02',
      call_status: 'Connected',
      interested_status: 'Yes',
      not_interested_remark: null,
      interview_scheduled: true,
      interview_date: '2024-02-05',
      turnup: true,
      interview_status: 'Done',
      selection_status: 'Selected',
      joining_status: 'Joined',
      joining_date: date50DaysAgo.toISOString().split('T')[0], // 50 days ago - falls in >45 days range
      hiring_manager_feedback: 'Excellent',
      followup_date: null,
      notes: 'Performing well',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      recruiter: recruiters[0],
      candidate: candidates[2],
      job_role: jobRoles[2],
    },
    {
      id: '4',
      portal: 'Indeed',
      job_role_id: '1',
      assigned_date: '2024-01-10',
      recruiter_id: '1',
      candidate_id: '1',
      call_date: '2024-01-11',
      call_status: 'Connected',
      interested_status: 'Yes',
      not_interested_remark: null,
      interview_scheduled: true,
      interview_date: '2024-01-15',
      turnup: true,
      interview_status: 'Done',
      selection_status: 'Selected',
      joining_status: 'Joined',
      joining_date: date70DaysAgo.toISOString().split('T')[0], // 70 days ago - falls in >60 days range
      hiring_manager_feedback: 'Great addition',
      followup_date: null,
      notes: 'Long-term employee',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      recruiter: recruiters[0],
      candidate: candidates[0],
      job_role: jobRoles[0],
    },
    {
      id: '5',
      portal: 'Monster',
      job_role_id: '4',
      assigned_date: '2023-12-01',
      recruiter_id: '1',
      candidate_id: '2',
      call_date: '2023-12-02',
      call_status: 'Connected',
      interested_status: 'Yes',
      not_interested_remark: null,
      interview_scheduled: true,
      interview_date: '2023-12-05',
      turnup: true,
      interview_status: 'Done',
      selection_status: 'Selected',
      joining_status: 'Joined',
      joining_date: date100DaysAgo.toISOString().split('T')[0], // 100 days ago - falls in >90 days range
      hiring_manager_feedback: 'Outstanding',
      followup_date: null,
      notes: 'Senior member',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      recruiter: recruiters[0],
      candidate: candidates[1],
      job_role: jobRoles[3],
    },
  ]
  LocalStorage.set('applications', applications)

  // Auth session
  LocalStorage.set('current_user', null)
}
