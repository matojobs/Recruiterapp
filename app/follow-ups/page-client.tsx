'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { getApplications, updateApplication } from '@/lib/data'
import { getCurrentUser } from '@/lib/auth-helper'
import type { Application } from '@/types/database'
import { formatDate } from '@/lib/utils'
import { CALL_STATUS_SELECT_OPTIONS } from '@/lib/constants'
import EditCandidateModal from '@/components/candidates/EditCandidateModal'

// ── Helpers ──────────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0, 10)
const endOfWeekStr = () => {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 10)
}
const addDays = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export const UNREACHABLE_STATUSES = ['RNR', 'Busy', 'Switched Off', 'Incoming Off', 'Call Back', 'Out of network']

type Section = {
  id: string
  label: string
  description: string
  accent: string
  badge: string
  apps: Application[]
}

export function isFinalStage(app: Application): boolean {
  return (
    app.joining_status === 'Joined' ||
    app.joining_status === 'Not Joined' ||
    app.joining_status === 'Backed Out' ||
    app.selection_status === 'Not Selected'
  )
}

export function candidateName(app: Application) {
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

// ── Log Call inline form ──────────────────────────────────────────────────────
function LogCallForm({
  app,
  onSave,
  onCancel,
}: {
  app: Application
  onSave: (id: string, updates: Partial<Application>) => Promise<void>
  onCancel: () => void
}) {
  const [callStatus, setCallStatus] = useState<string>('')
  const [followupDate, setFollowupDate] = useState<string>('')
  const [saving, setSaving] = useState(false)

  // Auto-set follow-up date when status changes
  useEffect(() => {
    if (callStatus && UNREACHABLE_STATUSES.includes(callStatus)) {
      setFollowupDate(addDays(1))
    } else if (callStatus === 'Connected') {
      setFollowupDate('')
    }
  }, [callStatus])

  async function handleSave() {
    if (!callStatus) return
    setSaving(true)
    try {
      await onSave(app.id, {
        call_date: todayStr(),
        call_status: callStatus as Application['call_status'],
        followup_date: followupDate || null,
      } as Partial<Application>)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-end gap-2">
      <div className="flex-1 min-w-32">
        <label className="block text-xs text-gray-500 mb-1">Call Status</label>
        <select
          value={callStatus}
          onChange={e => setCallStatus(e.target.value)}
          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="">Select...</option>
          {CALL_STATUS_SELECT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div className="flex-1 min-w-32">
        <label className="block text-xs text-gray-500 mb-1">
          Follow-up Date {followupDate && <span className="text-amber-600">(auto-set)</span>}
        </label>
        <input
          type="date"
          value={followupDate}
          onChange={e => setFollowupDate(e.target.value)}
          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!callStatus || saving}
          className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="text-xs text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
function FollowUpCard({
  app,
  onUpdate,
  onEdit,
}: {
  app: Application
  onUpdate: (id: string, updates: Partial<Application>) => Promise<void>
  onEdit: (app: Application) => void
}) {
  const [showLogCall, setShowLogCall] = useState(false)
  const badge = statusBadge(app)
  const phone = app.candidate?.phone ?? null

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-4">
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
            {app.expected_joining_date && (
              <span className="text-xs text-violet-600 font-medium">Exp. Joining: {formatDate(app.expected_joining_date)}</span>
            )}
          </div>

          {app.notes && (
            <p className="text-xs text-gray-400 mt-1.5 italic truncate">&quot;{app.notes}&quot;</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setShowLogCall(v => !v)}
            className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
              showLogCall
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
            }`}
          >
            Log Call
          </button>
          <button
            onClick={() => onEdit(app)}
            className="text-xs px-2.5 py-1.5 rounded-lg font-medium bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
          >
            Edit
          </button>
        </div>
      </div>

      {showLogCall && (
        <LogCallForm
          app={app}
          onSave={async (id, updates) => {
            await onUpdate(id, updates)
            setShowLogCall(false)
          }}
          onCancel={() => setShowLogCall(false)}
        />
      )}
    </div>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────
function FollowUpSection({
  section,
  onUpdate,
  onEdit,
}: {
  section: Section
  onUpdate: (id: string, updates: Partial<Application>) => Promise<void>
  onEdit: (app: Application) => void
}) {
  const [open, setOpen] = useState(true)

  if (section.apps.length === 0) return null

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-1 py-2"
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
          {section.apps.map(app => (
            <FollowUpCard key={app.id} app={app} onUpdate={onUpdate} onEdit={onEdit} />
          ))}
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
  const [editingApp, setEditingApp] = useState<Application | null>(null)

  const load = useCallback(async () => {
    try {
      const user = await getCurrentUser()
      const rid = user?.recruiter_id ? String(user.recruiter_id) : undefined
      const data = await getApplications({ recruiter_id: rid, limit: 1000 })
      setApps(data)
      // Cache count for sidebar badge
      const count = computeFollowUpCount(data)
      sessionStorage.setItem('followup_count', JSON.stringify({ count, ts: Date.now() }))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleUpdate = useCallback(async (id: string, updates: Partial<Application>) => {
    await updateApplication(id, updates as any)
    await load()
  }, [load])

  const handleEditSave = useCallback(async (id: string, updates: Partial<Application>) => {
    await updateApplication(id, updates as any)
    setEditingApp(null)
    await load()
  }, [load])

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
      } else {
        if (app.interested_status === 'Call Back Later' || (app.call_status === 'Connected' && !app.interested_status)) {
          callBackNoDate.push(app)
        } else if (app.call_status && UNREACHABLE_STATUSES.includes(app.call_status)) {
          unreachableNoDate.push(app)
        }
      }
    }

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
      { id: 'overdue',     label: 'Overdue',          description: 'Follow-up date has passed',           accent: 'bg-red-500',    badge: 'bg-red-100 text-red-700',       apps: overdue },
      { id: 'today',       label: 'Due Today',         description: 'Follow up today',                     accent: 'bg-amber-400',  badge: 'bg-amber-100 text-amber-700',   apps: dueToday },
      { id: 'upcoming',    label: 'This Week',          description: 'Scheduled in next 7 days',            accent: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700',     apps: upcoming },
      { id: 'callback',    label: 'Call Back Later',   description: 'No date set — needs scheduling',      accent: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700', apps: callBackNoDate },
      { id: 'unreachable', label: 'Unreachable',       description: 'RNR / Busy / Switched Off — no date', accent: 'bg-gray-400',   badge: 'bg-gray-100 text-gray-600',     apps: unreachableNoDate },
    ]
  }, [apps, search])

  const totalCount = sections.reduce((s, sec) => s + sec.apps.length, 0)

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-8 bg-gray-100 rounded-lg w-1/3" />
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
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
        <input
          type="text"
          placeholder="Search by name, phone, company..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-64 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {/* Tip */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-xs text-indigo-700">
        <strong>Tip:</strong> Use <strong>Log Call</strong> on any card to quickly update status without leaving this page. Setting a call status of RNR/Busy/etc. will auto-schedule a follow-up for tomorrow.
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {sections.map(section => (
          <FollowUpSection key={section.id} section={section} onUpdate={handleUpdate} onEdit={setEditingApp} />
        ))}
      </div>

      <EditCandidateModal
        isOpen={editingApp !== null}
        application={editingApp}
        onClose={() => setEditingApp(null)}
        onSave={handleEditSave}
      />

      {totalCount === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-gray-600 font-medium">No follow-ups pending</p>
          <p className="text-sm text-gray-400 mt-1">
            {search ? 'No matches for your search.' : 'All candidates are in a final stage or have no pending follow-up.'}
          </p>
        </div>
      )}
    </div>
  )
}

// Exported so sidebar can use same logic
export function computeFollowUpCount(apps: Application[]): number {
  const today = todayStr()
  const weekEnd = endOfWeekStr()
  let count = 0
  for (const app of apps) {
    if (isFinalStage(app)) continue
    const fd = app.followup_date?.slice(0, 10) ?? null
    if (fd) {
      if (fd <= weekEnd) count++ // overdue + today + this week
    } else {
      if (
        app.interested_status === 'Call Back Later' ||
        (app.call_status === 'Connected' && !app.interested_status) ||
        (app.call_status && UNREACHABLE_STATUSES.includes(app.call_status))
      ) count++
    }
  }
  return count
}
