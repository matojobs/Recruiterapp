/**
 * Call status options for Add Candidate, Edit Candidate, and Pending Application.
 * Single source of truth – use these exact values for display and API (call_status / callStatus).
 */
export const CALL_STATUS_OPTIONS = [
  'Connected',
  'RNR',
  'Busy',
  'Switched Off',
  'Incoming Off',
  'Call Back',
  'Invalid',
  'Wrong Number',
  'Out of network',
] as const

export type CallStatusOption = (typeof CALL_STATUS_OPTIONS)[number]

/** For Select components: { value, label } with same display and value */
export const CALL_STATUS_SELECT_OPTIONS = CALL_STATUS_OPTIONS.map((value) => ({
  value,
  label: value,
}))

/**
 * Sourcing portals – single source of truth for the Portal dropdown.
 * Keep these aligned with the canonical values stored in sourcing.applications.portal.
 */
export const PORTAL_OPTIONS = [
  'WorkIndia',
  'Job Hai',
  'Apna',
  'Referral',
  'Database',
  'Shine Data',
] as const

export type PortalOption = (typeof PORTAL_OPTIONS)[number]

/**
 * Resume/CV status captured after a candidate is marked Interested.
 * Received → CV in hand · Pending → promised, chasing · Not Reachable → stopped picking up.
 */
export const RESUME_STATUS_OPTIONS = ['Received', 'Pending', 'Not Reachable'] as const

export type ResumeStatusOption = (typeof RESUME_STATUS_OPTIONS)[number]
