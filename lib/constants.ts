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
