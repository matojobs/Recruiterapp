'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { getApplications } from '@/lib/data'
import { getCurrentUser } from '@/lib/auth-helper'
import type { Application } from '@/types/database'
import { formatDate } from '@/lib/utils'

// ── Helpers ──────────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0, 10)
const endOfWeekStr = () => {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 10)
}

type Section = {
  id: string
  label: string
  description: string
  accent: string
  badge: string
  apps: Application[]
}

const UNREACHABLE_STATUSES = ['RNR', 'Busy', 'Switched Off', 'Incoming Off', 'Call Back', 'Out of network']

function isFinalStage(app: Application): boolean {
  return (
    app.joining_status === 'Joined' ||
    app.joining_status === 'Not Joined' ||
    app.joining_status === 'Backed Out' ||
    app.selection_status === 'Not Selected'
  )
}

function candidateName(app: Application) {
  return app.candidate?.candidate_name ?? 'Unknown'
}

function companyRole(app: Application) {
  const role = (app.job_role as any)?.job_role ?? ''
  const company = (app.job_role as any)?.company?.company_name ?? ''
  if (role && company) return `${role} @ ${company}`
  return role || company || '—'
}

function statusBadge(app: Application): { label: string; cls: string } {
  if (app.interested_status === 'Call Back Later') return { label: 'Call Back Later', cls: 'bg-yellow-100 text-yellow-700' }
  if (app.call_status === 'RNR') return { label: 'RNR', cls: 'bg-gray-100 text-gray-600' }
  if (app.call_status === 'Busy') return { label: 'Busy', cls: 'bg-gray-100 text-gray-600' }
  if (app.call_status === 'Switched Off') return { label: 'Switched Off', cls: 'bg-gray-100 text-gray-600' }
  if (app.call_status === 'Incoming Off') return { label: 'Incoming Off', cls: 'bg-gray-100 text-gray-600' }
  if (app.call_status === 'Call Back') return { label: 'Call Back', cls: 'bg-gray-100 text-gray-600' }
  if (app.call_status === 'Out of network') return { label: 'Out of network', cls: 'bg-gray-100 text-gray-600' }
  if (app.call_status === 'Connected' && !app.interested_status) return { label: 'Interest Pending', cls: 'bg-blue-100 text-blue-600' }
  if (app.interview_scheduled && (app.interview_status === 'Scheduled' || !app.interview_status)) return { label: 'Interview Scheduled', cls: 'bg-amber-100 text-amber-700' }
  if (app.selection_status === 'Selected' && app.joining_status === 'Pending') return { label: 'Pending Joining', cls: 'bg-violet-100 text-violet-700' }
  return { label: app.call_status ?? 'No call yet', cls: 'bg-gray-100 text-gray-500' }
}

// ── Card ──────────────────────────────────────────────────────────────────────
function FollowUpCard({ app }: { app: Application }) {
  const badge = statusBadge(app)
  const phone = app.candidate?.phone ?? null

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-start gap-4 hover:shadow-sm transition-shadow">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
        {candidateName(app).charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 text-sm">{candidateName(app)}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{companyRole(app)}</p>

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {phone && (
            <a href={`tel:${phone}`} className="text-xs text-indigo-600 hover:underline font-medium">
              {phone}
            </a>
          )}
          {app.call_date && (
            <span className="text-xs text-gray-400">Last call: {formatDate(app.call_date)}</span>
          )}
          {app.followup_date && (
            <span className="text-xs text-gray-400">Follow-up: {formatDate(app.followup_date)}</span>
          )}
        </div>

        {app.notes && (
          <p className="text-xs text-gray-400 mt-1.5 italic truncate">"{app.notes}"</p>
        )}
      </div>

      {/* Edit link */}
      <Link
        href={`/candidates?highlight=${app.id}`}
        className="flex-shrink-0 text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
      >
        Open
      </Link>
    </div>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────
function FollowUpSection({ section }: { section: Section }) {
  const [open, setOpen] = useState(true)

  if (section.apps.length === 0) return null

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-1 py-2 group"
      >
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${section.accent}`} />
          <span className="text-sm font-semibold text-gray-800">{section.label}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${section.badge}`}>
            {section.apps.length}
          </span>
          <span className="text-xs text-gray-400 hidden sm:inline">{section.description}</span>
        </div>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="space-y-2 mt-1">
          {section.apps.map(app => <FollowUpCard key={app.id} app={app} />)}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FollowUpsPageClient() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const user = await getCurrentUser()
        const rid = user?.recruiter_id ? String(user.recruiter_id) : undefined
        const data = await getApplications({ recruiter_id: rid, limit: 1000 })
        setApps(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const sections = useMemo((): Section[] => {
    const today = todayStr()
    const weekEnd = endOfWeekStr()

    const active = apps.filter(a => !isFinalStage(a))
    const q = search.toLowerCase()
    const filtered = q
      ? active.filter(a =>
          candidateName(a).toLowerCase().includes(q) ||
          (a.candidate?.phone ?? '').includes(q) ||
          companyRole(a).toLowerCase().includes(q)
        )
      : active

    const overdue: Application[] = []
    const dueToday: Application[] = []
    const upcoming: Application[] = []
    const callBackNoDate: Application[] = []
    const unreachableNoDate: Application[] = []

    for (const app of filtered) {
      const fd = app.followup_date?.slice(0, 10) ?? null

      if (fd) {
        if (fd < today) overdue.push(app)
        else if (fd === today) dueToday.push(app)
        else if (fd <= weekEnd) upcoming.push(app)
        // future beyond this week — skip (not urgent yet)
      } else {
        // No follow-up date set — check if needs one
        if (app.interested_status === 'Call Back Later') {
          callBackNoDate.push(app)
        } else if (app.call_status && UNREACHABLE_STATUSES.includes(app.call_status)) {
          unreachableNoDate.push(app)
        } else if (app.call_status === 'Connected' && !app.interested_status) {
          // Connected but no interested status AND no follow-up date
          callBackNoDate.push(app)
        }
      }
    }

    // Sort each section by last call date (oldest first = highest priority)
    const byCallDate = (a: Application, b: Application) => {
      const da = a.call_date ?? a.assigned_date ?? ''
      const db = b.call_date ?? b.assigned_date ?? ''
      return da < db ? -1 : da > db ? 1 : 0
    }
    overdue.sort(byCallDate)
    dueToday.sort(byCallDate)
    upcoming.sort((a, b) => (a.followup_date ?? '') < (b.followup_date ?? '') ? -1 : 1)
    callBackNoDate.sort(byCallDate)
    unreachableNoDate.sort(byCallDate)

    return [
      {
        id: 'overdue',
        label: 'Overdue',
        description: 'Follow-up date has passed',
        accent: 'bg-red-500',
        badge: 'bg-red-100 text-red-700',
        apps: overdue,
      },
      {
        id: 'today',
        label: 'Due Today',
        description: 'Follow up today',
        accent: 'bg-amber-400',
        badge: 'bg-amber-100 text-amber-700',
        apps: dueToday,
      },
      {
        id: 'upcoming',
        label: 'This Week',
        description: 'Scheduled in next 7 days',
        accent: 'bg-blue-500',
        badge: 'bg-blue-100 text-blue-700',
        apps: upcoming,
      },
      {
        id: 'callback',
        label: 'Call Back Later',
        description: 'No date set — needs scheduling',
        accent: 'bg-yellow-400',
        badge: 'bg-yellow-100 text-yellow-700',
        apps: callBackNoDate,
      },
      {
        id: 'unreachable',
        label: 'Unreachable',
        description: 'RNR / Busy / Switched Off — no follow-up set',
        accent: 'bg-gray-400',
        badge: 'bg-gray-100 text-gray-600',
        apps: unreachableNoDate,
      },
    ]
  }, [apps, search])

  const totalCount = sections.reduce((s, sec) => s + sec.apps.length, 0)

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-8 bg-gray-100 rounded-lg w-1/3" />
        {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Follow-ups</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalCount > 0
              ? `${totalCount} candidate${totalCount !== 1 ? 's' : ''} need your attention`
              : 'All caught up! No follow-ups pending.'}
          </p>
        </div>
        {/* Search */}
        <input
          type="text"
          placeholder="Search by name, phone, company..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-64 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {/* Tip banner */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-xs text-indigo-700">
        <strong>Tip:</strong> Open any candidate and set a <strong>Follow-up Date</strong> in the edit modal to schedule a reminder. Candidates with "Call Back Later" or unreachable status but no date set are listed at the bottom.
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {sections.map(section => (
          <FollowUpSection key={section.id} section={section} />
        ))}
      </div>

      {totalCount === 0 && !loading && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-gray-600 font-medium">No follow-ups pending</p>
          <p className="text-sm text-gray-400 mt-1">
            {search ? 'No matches for your search.' : 'All candidates are either in a final stage or have no pending follow-up.'}
          </p>
        </div>
      )}
    </div>
  )
}
