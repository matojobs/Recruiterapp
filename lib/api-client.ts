/**
 * API client for backend integration.
 * Handles JWT authentication, base URL, and request/response transformation.
 * Production backend: https://api.jobsmato.com/api (used when deployed on Vercel if env not set).
 */
const DEFAULT_API_URL = process.env.VERCEL ? 'https://api.jobsmato.com/api' : 'http://localhost:5000/api'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_URL
const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_URL

// Token storage key
const TOKEN_KEY = 'recruiter_auth_token'

/**
 * Get stored JWT token
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Store JWT token
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * Remove JWT token (logout)
 */
export function clearAuthToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * API request wrapper with JWT auth and error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken()
  const url = `${API_BASE_URL}/recruiter${endpoint}`

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new Error('Unauthorized - please login again')
    }

    let errorMessage = `API error: ${response.status} ${response.statusText}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorData.error || errorMessage
    } catch {
      // Ignore JSON parse errors
    }
    throw new Error(errorMessage)
  }

  // Handle empty responses (e.g., DELETE)
  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    return {} as T
  }

  return response.json()
}

/**
 * Recruiter portal login only.
 * Uses POST /api/auth/recruiter-login so only users with role recruiter can log in here.
 * Do not use general /api/auth/login on the recruiter portal.
 */
export async function login(email: string, password: string): Promise<{ accessToken: string; user: { id: number; email: string; role: string } }> {
  type BackendLoginResponse = {
    accessToken?: string
    refreshToken?: string
    userId?: number
    id?: number
    email?: string
    fullName?: string
    role?: string
    user?: { id: number; email: string; role: string }
  }
  const url = `${AUTH_BASE_URL}/auth/recruiter-login`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      let errorMessage = `Login failed: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
        if (response.status === 401 && !errorData.message && !errorData.error) {
          errorMessage = 'Recruiter access required. Use the job portal or admin panel for your role.'
        }
      } catch {
        if (response.status === 401) {
          errorMessage = 'Recruiter access required. Use the job portal or admin panel for your role.'
        }
      }
      throw new Error(errorMessage)
    }

    const data: BackendLoginResponse = await response.json()

    // Transform backend response to match frontend expectations
    // Backend returns: { accessToken, refreshToken, userId, email, fullName, ... }
    // Frontend expects: { accessToken, user: { id, email, role } }
    const userId = data.userId || data.id || data.user?.id
    const userEmail = data.email || data.user?.email || email
    const userRole = data.role || data.user?.role || 'recruiter'
    
    console.log('🔄 Transformation:', { userId, userEmail, userRole })
    
    const transformedResponse = {
      accessToken: data.accessToken || '',
      user: {
        id: userId || 0,
        email: userEmail,
        role: userRole,
      },
    }
    
    console.log('✅ Transformed response:', transformedResponse)
    
    // Validate required fields
    if (!transformedResponse.accessToken) {
      console.error('❌ Missing accessToken')
      throw new Error('No access token received from server')
    }
    if (!transformedResponse.user.id) {
      console.error('❌ Missing user.id, userId was:', userId)
      throw new Error('No user ID received from server')
    }
    
    console.log('✅ Login success - transformed:', { 
      hasToken: !!transformedResponse.accessToken, 
      userId: transformedResponse.user.id,
      userEmail: transformedResponse.user.email 
    })
    
    if (transformedResponse.accessToken) {
      setAuthToken(transformedResponse.accessToken)
    }
    
    console.log('📤 Returning transformed response:', transformedResponse)
    return transformedResponse
  } catch (error: any) {
    // Handle network errors (CORS, connection refused, etc.)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('❌ Network error - check if backend is running and CORS is configured:', error.message)
      throw new Error('Cannot connect to backend. Please check if the server is running and CORS is properly configured.')
    }
    throw error
  }
}

/**
 * GET request
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' })
}

/**
 * POST request
 */
export async function apiPost<T>(endpoint: string, body: unknown): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/**
 * PATCH request
 */
export async function apiPatch<T>(endpoint: string, body: unknown): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

/**
 * DELETE request
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' })
}

/**
 * Job portal applications API (GET /api/applications/*, PATCH /api/applications/:id/recruiter-call).
 * Uses recruiter token; for pending list and recruiter-call submit.
 */
export async function apiApplicationsRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken()
  const url = `${API_BASE_URL}/applications${path}`
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }
  const response = await fetch(url, { ...options, headers })
  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken()
      if (typeof window !== 'undefined') window.location.href = '/login'
      throw new Error('Unauthorized')
    }
    let msg = `API error: ${response.status}`
    try {
      const d = await response.json()
      msg = (d as { message?: string }).message || msg
    } catch { /* ignore */ }
    throw new Error(msg)
  }
  const ct = response.headers.get('content-type')
  if (!ct || !ct.includes('application/json')) return {} as T
  return response.json()
}
