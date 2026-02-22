'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { getDashboardStats, getUserAnalytics, getJobAnalytics, getApplicationAnalytics } from '@/lib/admin/api'
import type { DashboardStats as DashboardStatsType } from '@/lib/admin/types'
import { PermissionGuard } from '@/components/admin/PermissionGuard'
import { StatsCard } from '@/components/admin/StatsCard'
import { StatsCardSkeleton, ChartSkeleton } from '@/components/admin/LoadingSkeleton'
import { ChartCard } from '@/components/admin/ChartCard'

const AdminLineChart = dynamic(
  () => import('@/components/admin/AdminCharts').then((m) => m.AdminLineChart),
  { ssr: false }
)
const AdminBarChart = dynamic(
  () => import('@/components/admin/AdminCharts').then((m) => m.AdminBarChart),
  { ssr: false }
)

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStatsType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'users' | 'jobs' | 'applications'>('users')
  const [days, setDays] = useState(30)
  const [userData, setUserData] = useState<unknown>(null)
  const [jobData, setJobData] = useState<unknown>(null)
  const [appData, setAppData] = useState<unknown>(null)
  const [chartsLoading, setChartsLoading] = useState(true)
  const [analyticsErrors, setAnalyticsErrors] = useState<{ users?: string; jobs?: string; applications?: string }>({})
  const [statsPermissionDenied, setStatsPermissionDenied] = useState(false)

  useEffect(() => {
    getDashboardStats()
      .then((data) => {
        setStats(data)
        setStatsPermissionDenied(false)
      })
      .catch((e: { response?: { status?: number }; message?: string }) => {
        if (e?.response?.status === 403) {
          setStatsPermissionDenied(true)
          setStats(null)
        } else {
          setError(e?.message || 'Failed to load stats')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setChartsLoading(true)
    setAnalyticsErrors({})
    Promise.all([
      getUserAnalytics(days)
        .then(setUserData)
        .catch((e: { response?: { status?: number } }) => {
          setUserData(null)
          setAnalyticsErrors((prev) => ({ ...prev, users: e?.response?.status === 403 ? 'Permission denied' : 'Failed to load' }))
        }),
      getJobAnalytics(days)
        .then(setJobData)
        .catch((e: { response?: { status?: number } }) => {
          setJobData(null)
          setAnalyticsErrors((prev) => ({ ...prev, jobs: e?.response?.status === 403 ? 'Permission denied' : 'Failed to load' }))
        }),
      getApplicationAnalytics(days)
        .then(setAppData)
        .catch((e: { response?: { status?: number } }) => {
          setAppData(null)
          setAnalyticsErrors((prev) => ({ ...prev, applications: e?.response?.status === 403 ? 'Permission denied' : 'Failed to load' }))
        }),
    ]).finally(() => setChartsLoading(false))
  }, [days])

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
        {error}
      </div>
    )
  }

  return (
    <PermissionGuard permission="view_dashboard">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Days:</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value={7}>7</option>
              <option value={30}>30</option>
              <option value={90}>90</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
        ) : statsPermissionDenied ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            You don&apos;t have permission to view dashboard stats. Ask an admin to grant you <code className="rounded bg-amber-200 px-1 dark:bg-amber-800">view_analytics</code>.
          </div>
        ) : stats ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard title="Total Users" value={stats.totalUsers} trend={stats.userGrowthRate != null ? { value: stats.userGrowthRate, label: 'growth' } : undefined} gradient />
            <StatsCard title="Total Jobs" value={stats.totalJobs} trend={stats.jobPostingRate != null ? { value: stats.jobPostingRate, label: 'rate' } : undefined} />
            <StatsCard title="Total Companies" value={stats.totalCompanies} />
            <StatsCard title="Total Applications" value={stats.totalApplications} trend={stats.applicationRate != null ? { value: stats.applicationRate, label: 'rate' } : undefined} />
            <StatsCard title="Active Jobs" value={stats.activeJobs} />
            <StatsCard title="Pending Applications" value={stats.pendingApplications} />
            <StatsCard title="New Users Today" value={stats.newUsersToday} />
            <StatsCard title="New Jobs Today" value={stats.newJobsToday} />
          </div>
        ) : null}

        <PermissionGuard permission="view_analytics">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {(['users', 'jobs', 'applications'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`px-6 py-3 text-sm font-medium capitalize ${tab === t ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {t} Analytics
                </button>
              ))}
            </div>
            <div className="p-6">
              {chartsLoading ? (
                <ChartSkeleton />
              ) : (
                <ChartCard title={`${tab.charAt(0).toUpperCase() + tab.slice(1)} Analytics`}>
                  {analyticsErrors[tab] ? (
                    <p className="py-12 text-center text-amber-600 dark:text-amber-400">{analyticsErrors[tab]}</p>
                  ) : tab === 'users' && userData && typeof userData === 'object' && 'dates' in (userData as object) ? (
                    <AdminLineChart data={((userData as { dates?: { date: string; count: number }[] }).dates || []) as { date: string; count: number }[]} />
                  ) : tab === 'jobs' && jobData ? (
                    <AdminBarChart data={(Array.isArray(jobData) ? jobData : (jobData as { data?: unknown[] })?.data || []) as { date?: string; count?: number }[]} />
                  ) : tab === 'applications' && appData ? (
                    <AdminBarChart data={(Array.isArray(appData) ? appData : (appData as { applicationTrends?: unknown[] })?.applicationTrends || []) as { date?: string; count?: number }[]} />
                  ) : (
                    <p className="py-12 text-center text-gray-500">No chart data available</p>
                  )}
                </ChartCard>
              )}
            </div>
          </div>
        </PermissionGuard>
      </div>
    </PermissionGuard>
  )
}
