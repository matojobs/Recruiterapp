'use client'

import { useEffect, useState, useCallback } from 'react'
import StatsCards from '@/components/dashboard/StatsCards'
import PipelineFlow from '@/components/dashboard/PipelineFlow'
import CandidateList from '@/components/dashboard/CandidateList'
import JoinedAgeStats from '@/components/dashboard/JoinedAgeStats'
import AddApplicationModal from '@/components/candidates/AddApplicationModal'
import { getDashboardStats, getApplications, getRecruiters, createApplicationWithCandidate } from '@/lib/data'
import { getCurrentUser, getCurrentRecruiter } from '@/lib/auth-helper'
import type { DashboardStats, PipelineFlow as PipelineFlowType, Application, Recruiter } from '@/types/database'
import { EMPTY_PIPELINE_FLOW } from '@/types/database'

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
        interviewsDoneToday: appsData.filter(a => a.interview_status === 'Not Attended' || a.interview_status === 'Rejected').length,
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
        interested: appsData.filter(a => a.interested_status === 'Yes').length,
        notInterested: appsData.filter(a => a.interested_status === 'No').length,
        interviewScheduled: appsData.filter(a => a.interview_scheduled === true).length,
        interviewDone: appsData.filter(a => a.interview_status === 'Not Attended' || a.interview_status === 'Rejected').length,
        selected: appsData.filter(a => a.selection_status === 'Selected').length,
        joined: appsData.filter(a => a.joining_status === 'Joined').length,
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
