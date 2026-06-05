/**
 * Negative-funnel reason option lists.
 * Captured at every drop-off stage so the admin negative-funnel analytics can
 * show WHY candidates are lost — not just that they were. Every list ends with
 * an "Other" sentinel that lets the recruiter type a custom reason.
 */

export const OTHER_OPTION = 'Other'

/** Why a candidate was Not Interested (interested_status = No). */
export const NOT_INTERESTED_REASONS = [
  'Salary too low',
  'Location too far',
  'Notice period mismatch',
  'Already has another offer',
  'Not looking for a change',
  'Role/JD mismatch',
  'Company not preferred',
  'Shift timing issue (night/rotational)',
  'Work from office — wants remote',
  'Commute / relocation issue',
  'Counter-offer from current employer',
  'Career break / personal reasons',
  'Higher qualification pursuing',
  'Joined elsewhere',
  'Not reachable / stopped responding',
  'Asking unrealistic salary',
  'Job is field/sales — not interested',
  'Profile not matching experience',
]

/** Why an interview candidate did Not Attend (interview_status = Not Attended). */
export const NOT_ATTENDED_REASONS = [
  'Did not pick up call',
  'Got another offer',
  'No longer interested',
  'Personal emergency',
  'Health issue',
  'Forgot / no-show without reason',
  'Location/travel problem',
  'Asked to reschedule then dropped',
  'Current employer counter-offer',
  'Could not get leave from current job',
  'Switched off / unreachable on interview day',
]

/** Why a candidate was Rejected in the interview (interview_status = Rejected / Not Selected). */
export const REJECTION_REASONS = [
  'Communication skills weak',
  'Insufficient experience',
  'Technical skills below bar',
  'Domain/industry mismatch',
  'Failed aptitude/assessment',
  'Salary expectation too high',
  'Poor cultural fit',
  'Attitude / professionalism concern',
  'Overqualified',
  'Notice period too long',
  'Background/reference check failed',
  'Did not clear final round',
  'Location not feasible for client',
  'Gap in employment unexplained',
]

/** Why a selected candidate Backed Out (joining_status = Backed Out). */
export const BACKOUT_REASONS = [
  'Accepted another offer',
  'Counter-offer from current employer',
  'Salary not as expected',
  'Location/relocation issue',
  'Personal / family reasons',
  'Health issue',
  'Notice period not relieved',
  'Better role elsewhere',
  'Changed mind about switching',
  'Joining delayed too long',
  'Negative reviews about company',
  'Commute too long after consideration',
  'Stopped responding before joining',
]
