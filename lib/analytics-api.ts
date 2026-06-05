/**
 * Analytics API client (Phase 1 — single source of truth).
 * Calls the unified backend funnel endpoint. The recruiter portal hits
 * /recruiter/analytics/funnel (auto-scoped to the logged-in recruiter).
 */
import { getAuthToken } from './api-client'

const DEFAULT_API_URL = process.env.VERCEL ? 'https://api.jobsmato.com/api' : 'http://localhost:5000/api'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_URL

export interface FunnelTotals {
  sourced: number
  attempts: number
  connected: number
  interested: number
  not_interested: number
  interview_sched: number
  interview_done: number
  selected: number
  rejected: number
  joined: number
  backout: number
  yet_to_join: number
}

export interface FunnelRates {
  connect_rate: number
  interest_rate: number
  interview_rate: number
  select_rate: number
  join_rate: number
  sourced_to_join: number
}

export interface FunnelSeriesPoint {
  bucket: string
  sourced?: number
  attempts?: number
  connected?: number
  interested?: number
  interview_sched?: number
  selected?: number
  joined?: number
}

export interface FunnelResponse {
  range: { from: string; to: string }
  totals: FunnelTotals
  rates: FunnelRates
  series?: FunnelSeriesPoint[]
}

export interface FunnelParams {
  from: string
  to: string
  granularity?: 'none' | 'day' | 'month'
}

/** Recruiter-scoped funnel — backend forces the caller's own recruiter_id. */
export async function getFunnel(params: FunnelParams): Promise<FunnelResponse> {
  const token = getAuthToken()
  const qs = new URLSearchParams({
    from: params.from,
    to: params.to,
    ...(params.granularity ? { granularity: params.granularity } : {}),
  })
  const res = await fetch(`${API_BASE_URL}/recruiter/analytics/funnel?${qs}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    throw new Error(`Analytics API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

// ── Date-range preset helpers (IST) ─────────────────────────────────────────
function istToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}
function istMonthStart(): string {
  return istToday().slice(0, 8) + '01'
}
function istYearStart(): string {
  return istToday().slice(0, 4) + '-01-01'
}
function addDays(base: string, n: number): string {
  const d = new Date(base + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

export type RangePreset = 'today' | 'week' | 'mtd' | 'last_month' | 'ytd' | 'all'

export function presetToRange(preset: RangePreset): { from: string; to: string } {
  const today = istToday()
  switch (preset) {
    case 'today':
      return { from: today, to: today }
    case 'week':
      return { from: addDays(today, -6), to: today }
    case 'mtd':
      return { from: istMonthStart(), to: today }
    case 'last_month': {
      const firstThis = istMonthStart()
      const lastPrevEnd = addDays(firstThis, -1)
      const lastPrevStart = lastPrevEnd.slice(0, 8) + '01'
      return { from: lastPrevStart, to: lastPrevEnd }
    }
    case 'ytd':
      return { from: istYearStart(), to: today }
    case 'all':
      return { from: '2000-01-01', to: today }
  }
}
