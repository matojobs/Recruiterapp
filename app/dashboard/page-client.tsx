'use client'

import { useEffect, useState } from 'react'
import StatsCards from '@/components/dashboard/StatsCards'
import PipelineFlow from '@/components/dashboard/PipelineFlow'
import CandidateList from '@/components/dashboard/CandidateList'
import SystemAgeStats from '@/components/dashboard/SystemAgeStats'
import JoinedAgeStats from '@/components/dashboard/JoinedAgeStats'
import { localDB } from '@/lib/local-db'
import { getDashboardStats, getPipelineFlow, getApplications } from '@/lib/local-queries'
import type { DashboardStats, PipelineFlow, Application, Recruiter } from '@/types/database'

export default function DashboardPageClient() {
  const [recruiter, setRecruiter] = useState<Recruiter | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [flow, setFlow] = useState<PipelineFlow | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // Initialize local data
        const { initializeLocalData } = await import('@/lib/local-storage')
        initializeLocalData()

        // Get current user
        const currentUser = await localDB.getCurrentUser()
        if (!currentUser) {
          window.location.href = '/login'
          return
        }

        // Get recruiter
        const recruiterData = await localDB.getRecruiterByEmail(currentUser.email)
        if (recruiterData) {
          setRecruiter(recruiterData)
        }

        // Load dashboard data
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
    }

    loadData()
  }, [])

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
    </div>
  )
}
