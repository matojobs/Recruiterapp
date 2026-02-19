/**
 * Authentication helper for backend API mode.
 */

import { getRecruiterByEmail } from './data'

export interface CurrentUser {
  email: string
  recruiter_id: string
}

/**
 * Get current user from localStorage (set during login)
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem('current_user')
  if (stored) {
    try {
      return JSON.parse(stored) as CurrentUser
    } catch {
      return null
    }
  }
  return null
}

/**
 * Get current recruiter details
 */
export async function getCurrentRecruiter() {
  const user = await getCurrentUser()
  if (!user) return null
  
  // Fetch recruiter details from backend
  const recruiter = await getRecruiterByEmail(user.email)
  if (recruiter) {
    return recruiter
  }
  
  // Fallback to basic info from stored user
  return {
    id: user.recruiter_id,
    email: user.email,
    name: user.email.split('@')[0],
  }
}
