import type { ApplicationFilters } from '@/types/database'

const APPLICATION_FILTER_KEYS: (keyof ApplicationFilters)[] = [
  'recruiter_id',
  'company_id',
  'job_role_id',
  'portal',
  'call_status',
  'interested_status',
  'interview_status',
  'selection_status',
  'joining_status',
  'date_from',
  'date_to',
]

/**
 * Build ApplicationFilters from URL search params.
 * Only includes keys that are present in the query string.
 */
export function parseApplicationFilters(searchParams: URLSearchParams): ApplicationFilters {
  const filters: ApplicationFilters = {}
  for (const key of APPLICATION_FILTER_KEYS) {
    const value = searchParams.get(key)
    if (value != null && value !== '') filters[key] = value
  }
  return filters
}
