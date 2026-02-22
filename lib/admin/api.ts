/**
 * Admin panel API client.
 * Base path: /api/admin/*
 * All endpoints and payload keys match ADMIN-PANEL-API-DOCUMENTATION.md
 */

import axios, { type AxiosInstance } from 'axios'
import { useAdminStore } from './store'
import type {
  AdminLoginResponse,
  AdminPermissionsResponse,
  DashboardStats,
  UsersListResponse,
  AdminUser,
  CompaniesListResponse,
  JobsListResponse,
  SettingItem,
} from './types'

const DEFAULT_API_URL = process.env.VERCEL ? 'https://api.jobsmato.com/api' : 'http://localhost:5000/api'
const getBaseURL = () =>
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_URL
    : process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_URL

function createClient(): AxiosInstance {
  const client = axios.create({
    baseURL: `${getBaseURL()}/admin`,
    headers: { 'Content-Type': 'application/json' },
  })
  client.interceptors.request.use((config) => {
    const token = useAdminStore.getState().accessToken
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })
  client.interceptors.response.use(
    (r) => r,
    (err) => {
      if (err.response?.status === 401) {
        useAdminStore.getState().clearAuth()
        if (typeof window !== 'undefined') window.location.href = '/admin/login'
      }
      return Promise.reject(err)
    }
  )
  return client
}

let api: AxiosInstance
function getApi() {
  if (typeof window === 'undefined') {
    return axios.create({ baseURL: `${getBaseURL()}/admin`, headers: { 'Content-Type': 'application/json' } })
  }
  if (!api) api = createClient()
  return api
}

// —— Auth ——
export async function adminLogin(email: string, password: string): Promise<AdminLoginResponse> {
  const { data } = await axios.post<AdminLoginResponse>(`${getBaseURL()}/admin/auth/login`, {
    email,
    password,
  })
  return data
}

export async function getAdminPermissions(): Promise<AdminPermissionsResponse> {
  const { data } = await getApi().get<AdminPermissionsResponse>('/auth/permissions')
  return data
}

export async function adminLogout(): Promise<void> {
  await getApi().post('/auth/logout')
  useAdminStore.getState().clearAuth()
}

// —— Dashboard ——
export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await getApi().get<DashboardStats>('/dashboard/stats')
  return data
}

export async function getUserAnalytics(days = 30): Promise<unknown> {
  const { data } = await getApi().get(`/dashboard/analytics/users?days=${days}`)
  return data
}

export async function getJobAnalytics(days = 30): Promise<unknown> {
  const { data } = await getApi().get(`/dashboard/analytics/jobs?days=${days}`)
  return data
}

export async function getApplicationAnalytics(days = 30): Promise<unknown> {
  const { data } = await getApi().get(`/dashboard/analytics/applications?days=${days}`)
  return data
}

// —— Users ——
// API doc: backend accepts both camelCase and snake_case. We send snake_case (sort_by, sort_order) and sort field in snake_case (e.g. created_at) to match backend.
function toSnakeCase(s: string): string {
  return s.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')
}
export async function getUsers(params: {
  page?: number
  limit?: number
  search?: string
  role?: string
  status?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}): Promise<UsersListResponse> {
  const query: Record<string, string | number> = {}
  if (params.page != null) query.page = params.page
  if (params.limit != null) query.limit = params.limit
  if (params.search != null && params.search !== '') query.search = params.search
  if (params.role != null && params.role !== '') query.role = params.role
  if (params.status != null && params.status !== '') query.status = params.status
  if (params.sortBy) query.sort_by = toSnakeCase(params.sortBy)
  if (params.sortOrder) query.sort_order = params.sortOrder
  const { data } = await getApi().get<UsersListResponse>('/users', { params: query })
  return data
}

export async function getUserById(id: number): Promise<AdminUser> {
  const { data } = await getApi().get<AdminUser>(`/users/${id}`)
  return data
}

export async function createUser(body: {
  email: string
  password: string
  firstName: string
  lastName: string
  role: string
  phone?: string
  location?: string
}): Promise<{ success: boolean; user: AdminUser }> {
  const { data } = await getApi().post('/users', body)
  return data
}

export async function updateUser(
  id: number,
  body: Partial<{ firstName: string; lastName: string; email: string; role: string; isActive: boolean; isVerified: boolean }>
): Promise<{ success: boolean; user: AdminUser }> {
  const { data } = await getApi().put(`/users/${id}`, body)
  return data
}

export async function deleteUser(id: number): Promise<{ success: boolean; message: string }> {
  const { data } = await getApi().delete(`/users/${id}`)
  return data
}

export async function verifyUser(id: number): Promise<{ success: boolean; user: AdminUser }> {
  const { data } = await getApi().post(`/users/${id}/verify`)
  return data
}

export async function suspendUser(
  id: number,
  body: { reason: string; duration?: number }
): Promise<{ success: boolean; user: AdminUser }> {
  const { data } = await getApi().post(`/users/${id}/suspend`, body)
  return data
}

// —— Companies ——
// List: query params per ADMIN_CRUD_API_REFERENCE (sort_by, sort_order, search, adminStatus)
export async function getCompanies(params?: {
  page?: number
  limit?: number
  search?: string
  adminStatus?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}): Promise<CompaniesListResponse> {
  const query: Record<string, string | number> = {}
  if (params?.page != null) query.page = params.page
  if (params?.limit != null) query.limit = params.limit
  if (params?.search) query.search = params.search
  if (params?.adminStatus) query.adminStatus = params.adminStatus
  if (params?.sortBy) query.sort_by = toSnakeCase(params.sortBy)
  if (params?.sortOrder) query.sort_order = params.sortOrder
  const { data } = await getApi().get<CompaniesListResponse>('/companies', { params: query })
  return data
}

export async function getCompanyById(id: number): Promise<unknown> {
  const { data } = await getApi().get(`/companies/${id}`)
  return data
}

export async function createCompany(body: {
  userId: number
  name: string
  slug?: string
  description?: string
  website?: string
  logo?: string
  industry?: string
  size?: string
  location?: string
  foundedYear?: number
}): Promise<{ success: boolean; company: unknown }> {
  const { data } = await getApi().post('/companies', body)
  return data
}

export async function updateCompany(
  id: number,
  body: Partial<{
    name: string
    description: string
    website: string
    logo: string
    industry: string
    size: string
    location: string
    foundedYear: number
    adminNotes: string
  }>
): Promise<{ success: boolean; company: unknown }> {
  const { data } = await getApi().put(`/companies/${id}`, body)
  return data
}

export async function deleteCompany(id: number): Promise<{ success: boolean; message: string }> {
  const { data } = await getApi().delete(`/companies/${id}`)
  return data
}

export async function updateCompanyStatus(
  id: number,
  body: { status: string; adminNotes?: string }
): Promise<{ success: boolean; company?: unknown }> {
  const { data } = await getApi().put(`/companies/${id}/status`, body)
  return data
}

export async function verifyCompany(id: number): Promise<{ success: boolean; company?: unknown }> {
  const { data } = await getApi().post(`/companies/${id}/verify`)
  return data
}

// —— Jobs ——
// List: query params per ADMIN_CRUD_API_REFERENCE (sort_by, sort_order, search, status, adminStatus, companyId)
export async function getJobs(params?: {
  page?: number
  limit?: number
  search?: string
  status?: string
  adminStatus?: string
  companyId?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}): Promise<JobsListResponse> {
  const query: Record<string, string | number> = {}
  if (params?.page != null) query.page = params.page
  if (params?.limit != null) query.limit = params.limit
  if (params?.search) query.search = params.search
  if (params?.status) query.status = params.status
  if (params?.adminStatus) query.adminStatus = params.adminStatus
  if (params?.companyId != null) query.companyId = params.companyId
  if (params?.sortBy) query.sort_by = toSnakeCase(params.sortBy)
  if (params?.sortOrder) query.sort_order = params.sortOrder
  const { data } = await getApi().get<JobsListResponse>('/jobs', { params: query })
  return data
}

export async function getJobById(id: number): Promise<unknown> {
  const { data } = await getApi().get(`/jobs/${id}`)
  return data
}

export async function createJob(body: {
  companyId: number
  title: string
  description: string
  requirements: string
  location: string
  type: string
  category: string
  benefits?: string
  salary?: string
  industry?: string
  experience?: number
  isRemote?: boolean
  isUrgent?: boolean
  isFeatured?: boolean
  status?: string
  applicationDeadline?: string
  hrName?: string
  hrContact?: string
  hrWhatsapp?: string
}): Promise<{ success: boolean; job: unknown }> {
  const { data } = await getApi().post('/jobs', body)
  return data
}

export async function updateJobStatus(
  id: number,
  body: { status: string; adminNotes?: string }
): Promise<{ success: boolean; job?: unknown }> {
  const { data } = await getApi().put(`/jobs/${id}/status`, body)
  return data
}

export async function deleteJob(id: number): Promise<{ success: boolean; message: string }> {
  const { data } = await getApi().delete(`/jobs/${id}`)
  return data
}

export async function bulkJobAction(body: {
  action: string
  jobIds: number[]
  adminNotes?: string
}): Promise<{ success: boolean; processed: number; failed: number; errors: unknown[] }> {
  const { data } = await getApi().post('/jobs/bulk-action', body)
  return data
}

// —— Bulk upload ——
export async function validateBulkUpload(body: { data: unknown[] }): Promise<unknown> {
  const { data } = await getApi().post('/jobs/bulk-upload/validate', body)
  return data
}

export async function processBulkUpload(body: { data: unknown[]; options?: Record<string, unknown> }): Promise<unknown> {
  const { data } = await getApi().post('/jobs/bulk-upload/upload', body)
  return data
}

export async function getUploadStatus(id: string): Promise<unknown> {
  const { data } = await getApi().get(`/jobs/bulk-upload/uploads/${id}`)
  return data
}

export async function getUploadHistory(params?: {
  page?: number
  limit?: number
}): Promise<{ uploads: unknown[]; total: number; page: number; limit: number }> {
  const { data } = await getApi().get('/jobs/bulk-upload/uploads', { params })
  return data
}

// —— Settings ——
export async function getSettings(): Promise<SettingItem[] | Record<string, unknown>> {
  const { data } = await getApi().get('/settings')
  return data
}

export async function updateSettings(settings: { key: string; value: unknown }[]): Promise<unknown> {
  const { data } = await getApi().put('/settings', { settings })
  return data
}

// —— Logs ——
export async function getErrorLogs(params?: {
  page?: number
  limit?: number
  errorType?: string
  statusCode?: number
  userId?: number
  startDate?: string
  endDate?: string
}): Promise<{ logs?: unknown[]; total?: number; page?: number; limit?: number }> {
  const { data } = await getApi().get('/logs/errors', { params })
  return data
}

export async function getActivityLogs(params?: {
  page?: number
  limit?: number
  action?: string
  entityType?: string
  userId?: number
}): Promise<{ data?: unknown[]; logs?: unknown[]; total?: number; page?: number; limit?: number }> {
  const { data } = await getApi().get('/activity-logs', { params })
  return data
}

export async function exportActivityLogs(params?: Record<string, string | number>): Promise<Blob | unknown> {
  const res = await getApi().get('/activity-logs/export', {
    params,
    responseType: 'blob',
  })
  return res.data
}
