/**
 * Single data layer for the app. All data access goes through this module.
 * Uses live backend API only.
 * 
 * Set NEXT_PUBLIC_API_BASE_URL for backend base URL (default: http://localhost:5000/api).
 */
import * as backendApi from './backend-api'

// Always use backend API
export const USE_BACKEND_API = true

// Re-export all backend API functions
export const getRecruiters = backendApi.getRecruiters
export const getRecruiterByEmail = backendApi.getRecruiterByEmail
export const getCompanies = backendApi.getCompanies
export const getCompanyById = backendApi.getCompanyById
export const getJobRoles = backendApi.getJobRoles
export const createJobRole = backendApi.createJobRole
export const getCandidates = backendApi.getCandidates
export const createCandidate = backendApi.createCandidate
export const getApplications = backendApi.getApplications
export const getApplication = backendApi.getApplication
export const createApplication = backendApi.createApplication
export const updateApplication = backendApi.updateApplication
export const deleteApplication = backendApi.deleteApplication
export const getDashboardStats = backendApi.getDashboardStats
export const getPipelineFlow = backendApi.getPipelineFlow

// Export backend auth functions
export { login, getAuthToken, clearAuthToken } from './api-client'
