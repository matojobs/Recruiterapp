import type { Application } from '@/types/database'

function normalizePhone(raw = ''): string {
  const d = raw.replace(/\D/g, '')
  return d.length >= 10 ? d.slice(-10) : d
}

function firstName(full?: string | null): string {
  return (full || '').trim().split(/\s+/)[0] || 'there'
}

function roleOf(app: Application): string {
  return (app.job_role as any)?.job_role || 'the role'
}
function companyOf(app: Application): string {
  return (app.job_role as any)?.company?.company_name || 'our client'
}
function fmt(d?: string | null): string {
  if (!d) return ''
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  } catch { return d }
}

export type WaTemplateKey =
  | 'interview'
  | 'selected'
  | 'interested'
  | 'callback'
  | 'unreachable'
  | 'generic'

/** Decide which follow-up template fits the application's current state. */
export function pickTemplate(app: Application): WaTemplateKey {
  const UNREACHABLE = ['RNR', 'Busy', 'Switched Off', 'Incoming Off', 'Call Back', 'Out of network']
  if (app.interview_scheduled && (!app.interview_status || app.interview_status === 'Scheduled')) return 'interview'
  if (app.selection_status === 'Selected' && app.joining_status !== 'Joined') return 'selected'
  if (app.interested_status === 'Yes') return 'interested'
  if (app.interested_status === 'Call Back Later') return 'callback'
  if (app.call_status && UNREACHABLE.includes(app.call_status)) return 'unreachable'
  return 'generic'
}

/** Build a pre-written WhatsApp message tailored to the follow-up type. */
export function buildWhatsAppMessage(app: Application, key?: WaTemplateKey): string {
  const name = firstName(app.candidate?.candidate_name)
  const role = roleOf(app)
  const company = companyOf(app)
  const k = key || pickTemplate(app)

  switch (k) {
    case 'interview':
      return `Hi ${name}, this is the recruitment team at Jobsmato. Your interview for the ${role} role${company ? ` at ${company}` : ''}${app.interview_date ? ` is scheduled on ${fmt(app.interview_date)}` : ' has been scheduled'}. Please confirm your availability. All the best! 🙌`
    case 'selected':
      return `Congratulations ${name}! 🎉 You have been selected for the ${role} role${company ? ` at ${company}` : ''}. Please reply with your expected joining date so we can take this forward.`
    case 'interested':
      return `Hi ${name}, following up on the ${role} opportunity${company ? ` at ${company}` : ''} we discussed. Are you available for a quick call to take the next steps?`
    case 'callback':
      return `Hi ${name}, this is Jobsmato. You had asked me to connect later regarding the ${role} opportunity. Is this a good time to talk? Please let me know.`
    case 'unreachable':
      return `Hi ${name}, this is the recruitment team at Jobsmato. I tried reaching you about a ${role} job opportunity${company ? ` at ${company}` : ''} but couldn't connect. Please share a convenient time to call you back.`
    default:
      return `Hi ${name}, this is Jobsmato reaching out regarding the ${role} opportunity${company ? ` at ${company}` : ''}. Please let me know if you're interested so we can take it forward.`
  }
}

/** wa.me deep link with pre-filled text. Opens WhatsApp chat to the candidate. */
export function whatsappUrl(phone: string | null | undefined, message: string): string | null {
  const digits = normalizePhone(phone || '')
  if (!digits) return null
  return `https://wa.me/91${digits}?text=${encodeURIComponent(message)}`
}
