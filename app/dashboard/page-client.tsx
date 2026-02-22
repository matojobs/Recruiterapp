'use client'

import { useEffect, useState, useCallback } from 'react'
import StatsCards from '@/components/dashboard/StatsCards'
import PipelineFlow from '@/components/dashboard/PipelineFlow'
import CandidateList from '@/components/dashboard/CandidateList'
import SystemAgeStats from '@/components/dashboard/SystemAgeStats'
import JoinedAgeStats from '@/components/dashboard/JoinedAgeStats'
import AddApplicationModal from '@/components/candidates/AddApplicationModal'
import { getDashboardStats, getPipelineFlow, getApplications, getRecruiters, createApplication } from '@/lib/data'
import { getCurrentUser, getCurrentRecruiter } from '@/lib/auth-helper'
import type { DashboardStats, PipelineFlow as PipelineFlowType, Application, Recruiter } from '@/types/database'

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

      const [statsData, flowData, appsData] = await Promise.all([
        getDashboardStats(currentUser.recruiter_id),
        getPipelineFlow({ recruiter_id: currentUser.recruiter_id }),
        getApplications({ recruiter_id: currentUser.recruiter_id }),
      ])

      setStats(statsData)
      setFlow(flowData)
      setApplications(appsData)
    } catch (error) {
      console.error('Error loading dashboard:', error)
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

  async function handleAddApplication(applicationData: any) {
    await createApplication(applicationData)
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
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          ✅ Running in <strong>Local Mode</strong> - Data stored in browser localStorage
        </p>
      </div>
      <StatsCards stats={stats} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <PipelineFlow flow={flow} />
        <SystemAgeStats applications={applications} />
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
