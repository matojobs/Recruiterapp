'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  getDashboardStats,
  getUserAnalytics,
  getJobAnalytics,
  getApplicationAnalytics,
  getRecruiterPerformanceDOD,
  getRecruiterPerformanceMTD,
} from '@/lib/admin/api'
import type {
  DashboardStats as DashboardStatsType,
  RecruiterPerformanceDODResponse,
  RecruiterPerformanceMTDResponse,
} from '@/lib/admin/types'
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

// ── Today's sourcing KPI strip (from DOD totals) ────────────────────────────
function TodayKPIs({ dod, loading }: { dod: RecruiterPerformanceDODResponse | null; loading: boolean }) {
  const t = dod?.total
  const items = [
    { label: 'Assigned Today', value: t?.assigned ?? 0, color: 'border-l-slate-400' },
    { label: 'Attempts', value: t?.attempt ?? 0, color: 'border-l-blue-400' },
    { label: 'Connected', value: t?.connected ?? 0, color: 'border-l-cyan-500' },
    { label: 'Interested', value: t?.interested ?? 0, color: 'border-l-emerald-500' },
    { label: 'Interviews', value: t?.interview_sched ?? 0, color: 'border-l-indigo-500' },
    { label: 'Selected', value: t?.today_selection ?? 0, color: 'border-l-violet-500' },
    { label: 'Joined', value: t?.today_joining ?? 0, color: 'border-l-pink-500' },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {items.map((s) => (
        <div key={s.label} className={`bg-white rounded-xl border border-gray-100 shadow-sm p-3 border-l-4 ${s.color}`}>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{s.label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{loading ? '—' : s.value}</p>
        </div>
      ))}
    </div>
  )
}

// ── Today's recruiter performance table (matches the screenshot) ─────────────
function TodayPerformanceTable({ data, loading }: { data: RecruiterPerformanceDODResponse | null; loading: boolean }) {
  const cols = [
    { key: 'recruiter_name', label: 'Name' },
    { key: 'interview_sched', label: 'Interview' },
    { key: 'today_selection', label: 'Selection' },
    { key: 'today_joining', label: 'Joining' },
    { key: 'sched_next_day', label: 'Fut Scheduled' },
  ]

  const rows = data?.rows ?? []
  const total = data?.total

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="h-4 bg-gray-100 rounded w-40 animate-pulse" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3 animate-pulse border-b border-gray-50">
            {[...Array(5)].map((_, j) => <div key={j} className="h-4 bg-gray-100 rounded w-16" />)}
          </div>
        ))}
      </div>
    )
  }

  if (!data || rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center text-sm text-gray-400">
        No data for today yet
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-800">Today&apos;s Performance</p>
        <span className="text-xs text-gray-400">{data.date}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-gray-100">
            <tr>
              {cols.map((c) => (
                <th key={c.key} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.recruiter_id} className={`border-b border-gray-50 hover:bg-indigo-50/30 transition-colors ${i % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'}`}>
                <td className="px-4 py-2.5 font-medium text-gray-900">{row.recruiter_name}</td>
                <td className="px-4 py-2.5 text-center font-mono text-gray-700">{row.interview_sched}</td>
                <td className="px-4 py-2.5 text-center font-mono text-gray-700">{row.today_selection}</td>
                <td className="px-4 py-2.5 text-center font-mono text-gray-700">{row.today_joining}</td>
                <td className="px-4 py-2.5 text-center font-mono text-indigo-600 font-semibold">{row.sched_next_day}</td>
              </tr>
            ))}
            {total && (
              <tr className="border-t-2 border-gray-200 bg-amber-50/60 font-semibold">
                <td className="px-4 py-2.5 text-gray-800">Sum</td>
                <td className="px-4 py-2.5 text-center font-mono text-gray-900">{total.interview_sched}</td>
                <td className="px-4 py-2.5 text-center font-mono text-gray-900">{total.today_selection}</td>
                <td className="px-4 py-2.5 text-center font-mono text-gray-900">{total.today_joining}</td>
                <td className="px-4 py-2.5 text-center font-mono text-indigo-700 font-bold">{total.sched_next_day}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── MTD summary strip ────────────────────────────────────────────────────────
function MTDSummary({ data, loading }: { data: RecruiterPerformanceMTDResponse | null; loading: boolean }) {
  const t = data?.total
  const items = [
    { label: 'Assigned', value: t?.assigned ?? 0 },
    { label: 'Attempts', value: t?.attempt ?? 0 },
    { label: 'Connected', value: t?.connected ?? 0 },
    { label: 'Interested', value: t?.interested ?? 0 },
    { label: 'Int Sched', value: t?.interview_sched ?? 0 },
    { label: 'Selected', value: t?.selection ?? 0 },
    { label: 'Joined', value: t?.total_joining ?? 0 },
    { label: 'Yet to Join', value: t?.yet_to_join ?? 0 },
  ]
  const hasData = !loading && t != null && Object.values(t).some((v) => typeof v === 'number' && v > 0)
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-800">This Month (MTD)</p>
        {!loading && data?.month && <span className="text-xs text-gray-400">{data.month}</span>}
      </div>
      {loading ? (
        <div className="grid grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse text-center">
              <div className="h-3 bg-gray-100 rounded w-12 mx-auto mb-1" />
              <div className="h-6 bg-gray-100 rounded w-8 mx-auto" />
            </div>
          ))}
        </div>
      ) : !hasData ? (
        <div className="flex-1 flex flex-col items-center justify-center py-4 text-center">
          <p className="text-sm text-gray-400">No MTD data yet for this month</p>
          <p className="text-xs text-gray-300 mt-1">Data updates as recruiters log activity</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-xs text-gray-500 font-medium">{item.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStatsType | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsPermissionDenied, setStatsPermissionDenied] = useState(false)
  const [error, setError] = useState('')

  const [tab, setTab] = useState<'users' | 'jobs' | 'applications'>('users')
  const [days, setDays] = useState(30)
  const [userData, setUserData] = useState<unknown>(null)
  const [jobData, setJobData] = useState<unknown>(null)
  const [appData, setAppData] = useState<unknown>(null)
  const [chartsLoading, setChartsLoading] = useState(true)
  const [analyticsErrors, setAnalyticsErrors] = useState<{ users?: string; jobs?: string; applications?: string }>({})

  // Recruiter performance
  const [dodData, setDodData] = useState<RecruiterPerformanceDODResponse | null>(null)
  const [dodLoading, setDodLoading] = useState(true)
  const [mtdData, setMtdData] = useState<RecruiterPerformanceMTDResponse | null>(null)
  const [mtdLoading, setMtdLoading] = useState(true)

  useEffect(() => {
    getDashboardStats()
      .then((data) => { setStats(data); setStatsPermissionDenied(false) })
      .catch((e: { response?: { status?: number }; message?: string }) => {
        if (e?.response?.status === 403) setStatsPermissionDenied(true)
        else setError(e?.message || 'Failed to load stats')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    getRecruiterPerformanceDOD()
      .then(setDodData)
      .catch(() => setDodData(null))
      .finally(() => setDodLoading(false))

    getRecruiterPerformanceMTD()
      .then(setMtdData)
      .catch(() => setMtdData(null))
      .finally(() => setMtdLoading(false))
  }, [])

  useEffect(() => {
    setChartsLoading(true)
    setAnalyticsErrors({})
    Promise.all([
      getUserAnalytics(days).then(setUserData).catch((e: { response?: { status?: number } }) => {
        setUserData(null)
        setAnalyticsErrors((p) => ({ ...p, users: e?.response?.status === 403 ? 'Permission denied' : 'Failed to load' }))
      }),
      getJobAnalytics(days).then(setJobData).catch((e: { response?: { status?: number } }) => {
        setJobData(null)
        setAnalyticsErrors((p) => ({ ...p, jobs: e?.response?.status === 403 ? 'Permission denied' : 'Failed to load' }))
      }),
      getApplicationAnalytics(days).then(setAppData).catch((e: { response?: { status?: number } }) => {
        setAppData(null)
        setAnalyticsErrors((p) => ({ ...p, applications: e?.response?.status === 403 ? 'Permission denied' : 'Failed to load' }))
      }),
    ]).finally(() => setChartsLoading(false))
  }, [days])

  if (error) {
    return <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
  }

  return (
    <PermissionGuard permission="view_dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Sourcing + platform overview</p>
          </div>
        </div>

        {/* ── Sourcing section ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">Sourcing — Today</p>
            {dodData?.date && <span className="text-xs text-gray-400">{dodData.date}</span>}
          </div>

          {/* Today KPI strip from DOD totals */}
          <TodayKPIs dod={dodData} loading={dodLoading} />

          {/* Today's performance table + MTD side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TodayPerformanceTable data={dodData} loading={dodLoading} />
            <MTDSummary data={mtdData} loading={mtdLoading} />
          </div>
        </div>

        {/* ── Job Portal section ── */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Job Portal</p>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => <StatsCardSkeleton key={i} />)}
            </div>
          ) : statsPermissionDenied ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
              You don&apos;t have permission to view dashboard stats.
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
            <div className="rounded-2xl border border-gray-200 bg-white">
              <div className="flex border-b border-gray-200">
                {(['users', 'jobs', 'applications'] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setTab(t)}
                    className={`px-5 py-3 text-sm font-medium capitalize ${tab === t ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    {t} Analytics
                  </button>
                ))}
                <div className="ml-auto flex items-center pr-4 gap-2">
                  <label className="text-xs text-gray-500">Days:</label>
                  <select value={days} onChange={(e) => setDays(Number(e.target.value))}
                    className="rounded border border-gray-300 px-2 py-1 text-xs">
                    <option value={7}>7</option>
                    <option value={30}>30</option>
                    <option value={90}>90</option>
                  </select>
                </div>
              </div>
              <div className="p-5">
                {chartsLoading ? (
                  <ChartSkeleton />
                ) : (
                  <ChartCard title={`${tab.charAt(0).toUpperCase() + tab.slice(1)} Analytics`}>
                    {analyticsErrors[tab] ? (
                      <p className="py-12 text-center text-amber-600">{analyticsErrors[tab]}</p>
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
      </div>
    </PermissionGuard>
  )
}
