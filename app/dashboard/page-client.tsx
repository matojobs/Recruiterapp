'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import StatsCards from '@/components/dashboard/StatsCards'
import PipelineFlow from '@/components/dashboard/PipelineFlow'
import CandidateList from '@/components/dashboard/CandidateList'
import JoinedAgeStats from '@/components/dashboard/JoinedAgeStats'
import AddApplicationModal from '@/components/candidates/AddApplicationModal'
import { getApplications, getRecruiters, createApplicationWithCandidate } from '@/lib/data'
import { getCurrentUser, getCurrentRecruiter } from '@/lib/auth-helper'
import type { DashboardStats, PipelineFlow as PipelineFlowType, Application, Recruiter } from '@/types/database'
import { EMPTY_PIPELINE_FLOW } from '@/types/database'
import { isFinalStage, UNREACHABLE_STATUSES } from '@/app/follow-ups/page-client'

// ── Period helpers ────────────────────────────────────────────────────────────
type Period = 'dod' | 'mtd' | 'all'

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'dod', label: 'Today' },
  { value: 'mtd', label: 'This Month' },
  { value: 'all', label: 'All Time' },
]

function todayStr() { return new Date().toISOString().slice(0, 10) }
function monthStartStr() { const t = todayStr(); return t.slice(0, 8) + '01' }

function inPeriod(date: string | null | undefined, period: Period): boolean {
  if (period === 'all') return true
  if (!date) return false
  const d = date.slice(0, 10)
  if (period === 'dod') return d === todayStr()
  return d >= monthStartStr() && d <= todayStr()
}

function computeStatsFromApps(apps: Application[], period: Period): DashboardStats {
  const ip = (d: string | null | undefined) => inPeriod(d, period)
  const DONE = ['Done', 'Not Attended', 'Rejected']
  return {
    totalSourced: period === 'all' ? apps.length : apps.filter(a => ip(a.assigned_date)).length,
    callsDoneToday:      apps.filter(a => ip(a.call_date)).length,
    connectedToday:      apps.filter(a => ip(a.call_date) && a.call_status === 'Connected').length,
    interestedToday:     apps.filter(a => ip(a.call_date) && a.interested_status === 'Yes').length,
    notInterestedToday:  apps.filter(a => ip(a.call_date) && a.interested_status === 'No').length,
    interviewsDoneToday: apps.filter(a => ip(a.interview_date) && DONE.includes(a.interview_status || '')).length,
    // Scheduled = future interviews still pending (always all-time view for awareness)
    interviewsScheduled: apps.filter(a => a.interview_scheduled && (a.interview_status == null || a.interview_status === 'Scheduled')).length,
    selectedThisMonth:   apps.filter(a => ip(a.interview_date) && a.selection_status === 'Selected').length,
    joinedThisMonth:     apps.filter(a => ip(a.joining_date) && a.joining_status === 'Joined').length,
    // Pending joining is always all-time — it's a current state, not a date-anchored metric
    pendingJoining:      apps.filter(a => a.selection_status === 'Selected' && (a.joining_status === 'Pending' || a.joining_status == null)).length,
  }
}

function computeFlowFromApps(apps: Application[], period: Period): PipelineFlowType {
  const ip = (d: string | null | undefined) => inPeriod(d, period)
  const DONE = ['Done', 'Not Attended', 'Rejected']

  if (period === 'all') {
    return {
      sourced:               apps.length,
      callDone:              apps.filter(a => a.call_date != null).length,
      connected:             apps.filter(a => a.call_status === 'Connected').length,
      interestPending:       apps.filter(a => a.call_status === 'Connected' && a.interested_status == null).length,
      interested:            apps.filter(a => a.interested_status === 'Yes').length,
      callBackLater:         apps.filter(a => a.interested_status === 'Call Back Later').length,
      notInterested:         apps.filter(a => a.interested_status === 'No').length,
      interviewScheduled:    apps.filter(a => a.interview_scheduled === true).length,
      interviewResultPending:apps.filter(a => a.interview_scheduled === true && (a.interview_status == null || a.interview_status === 'Scheduled')).length,
      interviewDone:         apps.filter(a => DONE.includes(a.interview_status || '')).length,
      selectionPending:      apps.filter(a => DONE.includes(a.interview_status || '') && (a.selection_status == null || a.selection_status === 'Pending')).length,
      selected:              apps.filter(a => a.selection_status === 'Selected').length,
      notSelected:           apps.filter(a => a.selection_status === 'Not Selected').length,
      joined:                apps.filter(a => a.joining_status === 'Joined').length,
      notJoined:             apps.filter(a => a.joining_status === 'Not Joined').length,
      backedOut:             apps.filter(a => a.joining_status === 'Backed Out').length,
      pendingJoining:        apps.filter(a => a.selection_status === 'Selected' && (a.joining_status === 'Pending' || a.joining_status == null)).length,
      followupsDue: 0,
    }
  }

  // DOD / MTD — each metric anchored to its natural date field
  return {
    sourced:               apps.filter(a => ip(a.assigned_date)).length,
    callDone:              apps.filter(a => ip(a.call_date)).length,
    connected:             apps.filter(a => ip(a.call_date) && a.call_status === 'Connected').length,
    interestPending:       apps.filter(a => ip(a.call_date) && a.call_status === 'Connected' && a.interested_status == null).length,
    interested:            apps.filter(a => ip(a.call_date) && a.interested_status === 'Yes').length,
    callBackLater:         apps.filter(a => ip(a.call_date) && a.interested_status === 'Call Back Later').length,
    notInterested:         apps.filter(a => ip(a.call_date) && a.interested_status === 'No').length,
    interviewScheduled:    apps.filter(a => ip(a.interview_date)).length,
    interviewResultPending:apps.filter(a => ip(a.interview_date) && (a.interview_status == null || a.interview_status === 'Scheduled')).length,
    interviewDone:         apps.filter(a => ip(a.interview_date) && DONE.includes(a.interview_status || '')).length,
    selectionPending:      apps.filter(a => ip(a.interview_date) && (a.selection_status == null || a.selection_status === 'Pending')).length,
    selected:              apps.filter(a => ip(a.interview_date) && a.selection_status === 'Selected').length,
    notSelected:           apps.filter(a => ip(a.interview_date) && a.selection_status === 'Not Selected').length,
    joined:                apps.filter(a => ip(a.joining_date) && a.joining_status === 'Joined').length,
    notJoined:             apps.filter(a => ip(a.joining_date) && a.joining_status === 'Not Joined').length,
    backedOut:             apps.filter(a => ip(a.joining_date) && a.joining_status === 'Backed Out').length,
    pendingJoining:        apps.filter(a => a.selection_status === 'Selected' && (a.joining_status === 'Pending' || a.joining_status == null)).length,
    followupsDue: 0,
  }
}

function computeFollowUpSummary(apps: Application[]) {
  const today = todayStr()
  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  let overdue = 0, dueToday = 0, noDate = 0
  for (const app of apps) {
    if (isFinalStage(app)) continue
    const fd = app.followup_date?.slice(0, 10) ?? null
    if (fd) {
      if (fd < today) overdue++
      else if (fd === today) dueToday++
    } else {
      if (
        app.interested_status === 'Call Back Later' ||
        (app.call_status === 'Connected' && !app.interested_status) ||
        (app.call_status && UNREACHABLE_STATUSES.includes(app.call_status))
      ) noDate++
    }
  }
  return { overdue, dueToday, noDate, total: overdue + dueToday + noDate }
}

export default function DashboardPageClient() {
  const [recruiter, setRecruiter]       = useState<Recruiter | null>(null)
  const [stats, setStats]               = useState<DashboardStats | null>(null)
  const [flow, setFlow]                 = useState<PipelineFlowType | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [recruiters, setRecruiters]     = useState<Recruiter[]>([])
  const [loading, setLoading]           = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [period, setPeriod]             = useState<Period>('mtd')

  const loadData = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) { window.location.href = '/login'; return }

      const recruiterData = await getCurrentRecruiter()
      if (recruiterData) setRecruiter(recruiterData as any)

      const recruiterId = currentUser.recruiter_id ? String(currentUser.recruiter_id) : undefined
      const appsData = await getApplications(
        recruiterId ? { recruiter_id: recruiterId, page: 1, limit: 2000 } : { page: 1, limit: 2000 }
      )
      setApplications(appsData)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      setApplications([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Recompute stats + flow whenever apps or period changes
  useEffect(() => {
    setStats(computeStatsFromApps(applications, period))
    setFlow(computeFlowFromApps(applications, period))
  }, [applications, period])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (showAddModal && recruiters.length === 0) {
      getRecruiters().then(setRecruiters).catch(() => {})
    }
  }, [showAddModal, recruiters.length])

  async function handleAddApplication(payload: any) {
    await createApplicationWithCandidate({
      candidate: payload.candidate,
      application: { ...payload.application, job_role_id: Number(payload.application.job_role_id) },
    })
    setShowAddModal(false)
    await loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!stats || !flow) {
    return <div>Error loading dashboard</div>
  }

  const fu = computeFollowUpSummary(applications)
  const selectedPeriodLabel = PERIOD_OPTIONS.find(p => p.value === period)?.label ?? ''

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Welcome back, {recruiter?.name || 'Recruiter'}
          </p>
        </div>
        {/* Period toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                period === opt.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <StatsCards stats={stats} periodLabel={selectedPeriodLabel} />

      {/* Follow-up widget */}
      {fu.total > 0 && (
        <div className="mb-6">
          <Link href="/follow-ups" className="block">
            <div className={`rounded-xl border px-5 py-4 flex items-center justify-between hover:shadow-sm transition-shadow ${
              fu.overdue > 0 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-center gap-4">
                <span className="text-2xl">🔔</span>
                <div>
                  <p className={`text-sm font-semibold ${fu.overdue > 0 ? 'text-red-800' : 'text-amber-800'}`}>
                    {fu.overdue > 0
                      ? `${fu.overdue} overdue follow-up${fu.overdue !== 1 ? 's' : ''} need attention`
                      : `${fu.dueToday} follow-up${fu.dueToday !== 1 ? 's' : ''} due today`}
                  </p>
                  <div className="flex gap-4 mt-1">
                    {fu.overdue > 0 && <span className="text-xs text-red-600">{fu.overdue} overdue</span>}
                    {fu.dueToday > 0 && <span className="text-xs text-amber-600">{fu.dueToday} today</span>}
                    {fu.noDate > 0 && <span className="text-xs text-gray-500">{fu.noDate} no date set</span>}
                  </div>
                </div>
              </div>
              <span className={`text-xs font-medium px-3 py-1.5 rounded-lg ${
                fu.overdue > 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
              }`}>
                View all →
              </span>
            </div>
          </Link>
        </div>
      )}

      <div className="mb-6">
        <PipelineFlow flow={flow} />
      </div>
      <div className="mb-6">
        <JoinedAgeStats applications={applications} />
      </div>
      <CandidateList applications={applications} />

      {/* Floating Add Candidate button */}
      <button
        type="button"
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg transition hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        aria-label="Add candidate"
      >
        <span className="text-2xl leading-none">+</span>
      </button>

      <AddApplicationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddApplication}
        recruiters={recruiters}
      />
    </div>
  )
}
