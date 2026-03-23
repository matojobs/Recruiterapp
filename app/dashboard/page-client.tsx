'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import StatsCards from '@/components/dashboard/StatsCards'
import PipelineFlow from '@/components/dashboard/PipelineFlow'
import CandidateList from '@/components/dashboard/CandidateList'
import JoinedAgeStats from '@/components/dashboard/JoinedAgeStats'
import AddApplicationModal from '@/components/candidates/AddApplicationModal'
import { getDashboardStats, getApplications, getRecruiters, createApplicationWithCandidate } from '@/lib/data'
import { getCurrentUser, getCurrentRecruiter } from '@/lib/auth-helper'
import type { DashboardStats, PipelineFlow as PipelineFlowType, Application, Recruiter } from '@/types/database'
import { EMPTY_PIPELINE_FLOW } from '@/types/database'
import { isFinalStage, UNREACHABLE_STATUSES } from '@/app/follow-ups/page-client'

function computeFollowUpSummary(apps: Application[]) {
  const today = new Date().toISOString().slice(0, 10)
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
  const [recruiter, setRecruiter] = useState<Recruiter | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [flow, setFlow] = useState<PipelineFlowType | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [recruiters, setRecruiters] = useState<Recruiter[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        window.location.href = '/login'
        return
      }

      const recruiterData = await getCurrentRecruiter()
      if (recruiterData) {
        setRecruiter(recruiterData as any)
      }

      const recruiterId = currentUser.recruiter_id ? String(currentUser.recruiter_id) : undefined
      const [statsData, appsData] = await Promise.all([
        getDashboardStats(recruiterId),
        // Fetch all apps (limit 1000) — used for pipeline and missing stat fields
        getApplications(recruiterId ? { recruiter_id: recruiterId, page: 1, limit: 1000 } : { page: 1, limit: 1000 }),
      ])
      setApplications(appsData)
      // Compute fields the /dashboard/stats endpoint doesn't return, using the full app list
      setStats(statsData ? {
        ...statsData,
        notInterestedToday: appsData.filter(a => a.interested_status === 'No').length,
        interviewsScheduled: appsData.filter(a => a.interview_scheduled === true).length,
        interviewsDoneToday: appsData.filter(a => a.interview_status === 'Done' || a.interview_status === 'Not Attended' || a.interview_status === 'Rejected').length,
        pendingJoining: appsData.filter(a => a.joining_status === 'Pending').length,
      } : statsData)
      // Compute pipeline as a cumulative funnel from all apps.
      // Backend /dashboard/pipeline assigns each candidate to one exclusive current stage
      // (e.g. Connected only if NOT yet interested), which breaks funnel logic.
      // Client-side cumulative counts: connected=all who had call answered, interested=all marked Yes, etc.
      setFlow({
        sourced: appsData.length,
        callDone: appsData.filter(a => a.call_date != null).length,
        connected: appsData.filter(a => a.call_status === 'Connected').length,
        interestPending: appsData.filter(a => a.call_status === 'Connected' && a.interested_status == null).length,
        interested: appsData.filter(a => a.interested_status === 'Yes').length,
        callBackLater: appsData.filter(a => a.interested_status === 'Call Back Later').length,
        notInterested: appsData.filter(a => a.interested_status === 'No').length,
        interviewScheduled: appsData.filter(a => a.interview_scheduled === true).length,
        interviewResultPending: appsData.filter(a => a.interview_scheduled === true && (a.interview_status == null || a.interview_status === 'Scheduled')).length,
        interviewDone: appsData.filter(a => a.interview_status === 'Done' || a.interview_status === 'Not Attended' || a.interview_status === 'Rejected').length,
        selectionPending: appsData.filter(a => (a.interview_status === 'Done' || a.interview_status === 'Not Attended' || a.interview_status === 'Rejected') && (a.selection_status == null || a.selection_status === 'Pending')).length,
        selected: appsData.filter(a => a.selection_status === 'Selected').length,
        notSelected: appsData.filter(a => a.selection_status === 'Not Selected').length,
        joined: appsData.filter(a => a.joining_status === 'Joined').length,
        notJoined: appsData.filter(a => a.joining_status === 'Not Joined').length,
        backedOut: appsData.filter(a => a.joining_status === 'Backed Out').length,
        pendingJoining: appsData.filter(a => a.selection_status === 'Selected' && (a.joining_status === 'Pending' || a.joining_status == null)).length,
        followupsDue: 0,
      })
    } catch (error) {
      console.error('Error loading dashboard:', error)
      setStats(null)
      setFlow(EMPTY_PIPELINE_FLOW)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (showAddModal && recruiters.length === 0) {
      getRecruiters().then(setRecruiters).catch(() => {})
    }
  }, [showAddModal, recruiters.length])

  async function handleAddApplication(payload: any) {
    await createApplicationWithCandidate({
      candidate: payload.candidate,
      application: {
        ...payload.application,
        job_role_id: Number(payload.application.job_role_id),
      },
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Welcome back, {recruiter?.name || 'Recruiter'}
          </p>
        </div>
      </div>
      <StatsCards stats={stats} />

      {/* Follow-up widget */}
      {(() => {
        const fu = computeFollowUpSummary(applications)
        if (fu.total === 0) return null
        return (
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
        )
      })()}

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
