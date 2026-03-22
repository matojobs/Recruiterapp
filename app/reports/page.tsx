'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getDashboardStats, getPipelineFlow, getApplications } from '@/lib/data'
import { getCurrentUser } from '@/lib/auth-helper'
import type { Application, PipelineFlow, DashboardStats } from '@/types/database'
import { EMPTY_PIPELINE_FLOW } from '@/types/database'
import { calculatePercentage } from '@/lib/utils'
import Button from '@/components/ui/Button'
import * as XLSX from 'xlsx'

// ── Types ────────────────────────────────────────────────────────────────────
type DatePreset = 'all' | 'this_month' | 'this_week'
type ReportTab = 'pipeline' | 'performance' | 'company'

// ── Helpers ──────────────────────────────────────────────────────────────────
function getDateRange(preset: DatePreset): { date_from?: string; date_to?: string } {
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  if (preset === 'this_month') {
    return {
      date_from: fmt(new Date(today.getFullYear(), today.getMonth(), 1)),
      date_to: fmt(today),
    }
  }
  if (preset === 'this_week') {
    const start = new Date(today)
    start.setDate(today.getDate() - today.getDay())
    return { date_from: fmt(start), date_to: fmt(today) }
  }
  return {}
}

const PIPELINE_STAGES = [
  { key: 'sourced', label: 'Sourced', color: '#64748b' },
  { key: 'callDone', label: 'Call Done', color: '#3b82f6' },
  { key: 'connected', label: 'Connected', color: '#06b6d4' },
  { key: 'interested', label: 'Interested', color: '#10b981' },
  { key: 'notInterested', label: 'Not Interested', color: '#f87171' },
  { key: 'interviewScheduled', label: 'Interview Scheduled', color: '#f59e0b' },
  { key: 'interviewDone', label: 'Interview Done', color: '#f97316' },
  { key: 'selected', label: 'Selected', color: '#8b5cf6' },
  { key: 'joined', label: 'Joined', color: '#ec4899' },
]

const DATE_PRESETS: { label: string; value: DatePreset }[] = [
  { label: 'All Time', value: 'all' },
  { label: 'This Month', value: 'this_month' },
  { label: 'This Week', value: 'this_week' },
]

// ── Sub-components ────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 border-l-4 ${accent || 'border-l-gray-300'}`}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1 leading-none">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
    </div>
  )
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>('pipeline')
  const [datePreset, setDatePreset] = useState<DatePreset>('this_month')
  const [recruiterId, setRecruiterId] = useState<string | undefined>()
  const [flow, setFlow] = useState<PipelineFlow>(EMPTY_PIPELINE_FLOW)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const user = await getCurrentUser()
      const rid = user?.recruiter_id ? String(user.recruiter_id) : undefined
      setRecruiterId(rid)
      const dateRange = getDateRange(datePreset)
      const [flowData, statsData, appsData] = await Promise.all([
        getPipelineFlow({ recruiter_id: rid, ...dateRange }),
        getDashboardStats(rid),
        getApplications({ recruiter_id: rid, limit: 500 }),
      ])
      setFlow(flowData)
      setStats(statsData)
      setApplications(appsData)
    } catch (err) {
      console.error('Error loading reports:', err)
      setError('Failed to load report data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [datePreset])

  useEffect(() => { loadData() }, [loadData])

  const pipelineChartData = useMemo(() =>
    PIPELINE_STAGES
      .filter(s => (flow[s.key as keyof PipelineFlow] as number) > 0)
      .map(s => ({ name: s.label, value: flow[s.key as keyof PipelineFlow] as number, color: s.color }))
  , [flow])

  const companyStats = useMemo(() => {
    const map = new Map<string, { name: string; total: number; connected: number; interested: number; interviews: number; selected: number; joined: number }>()
    applications.forEach((app) => {
      const name = (app.job_role as any)?.company?.company_name || 'Unknown'
      if (!map.has(name)) map.set(name, { name, total: 0, connected: 0, interested: 0, interviews: 0, selected: 0, joined: 0 })
      const s = map.get(name)!
      s.total++
      if (app.call_status === 'Connected') s.connected++
      if (app.interested_status === 'Yes') s.interested++
      if (app.interview_scheduled) s.interviews++
      if (app.selection_status === 'Selected') s.selected++
      if (app.joining_status === 'Joined') s.joined++
    })
    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [applications])

  function exportPipeline() {
    const data = PIPELINE_STAGES.map((s, i) => ({
      Stage: s.label,
      Count: flow[s.key as keyof PipelineFlow],
      'From Previous (%)': i === 0 ? '100%' : `${calculatePercentage(flow[s.key as keyof PipelineFlow] as number, flow[PIPELINE_STAGES[i - 1].key as keyof PipelineFlow] as number)}%`,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Pipeline')
    XLSX.writeFile(wb, `pipeline_${datePreset}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  function exportCompany() {
    const data = companyStats.map(c => ({
      Company: c.name, Sourced: c.total, Connected: c.connected,
      'Connected %': `${calculatePercentage(c.connected, c.total)}%`,
      Interested: c.interested, 'Interest %': `${calculatePercentage(c.interested, c.connected)}%`,
      'Interviews Scheduled': c.interviews, Selected: c.selected, Joined: c.joined,
      'Joining %': `${calculatePercentage(c.joined, c.total)}%`,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Company Stats')
    XLSX.writeFile(wb, `company_report_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-gray-100 rounded-lg w-1/3" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
        </div>
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-red-400 text-4xl mb-3">⚠️</div>
        <p className="text-gray-700 font-medium">{error}</p>
        <button onClick={loadData} className="mt-4 text-sm text-primary-600 underline">Retry</button>
      </div>
    )
  }

  const overallConversion = flow.sourced > 0 ? calculatePercentage(flow.joined, flow.sourced) : 0
  const connectRate = flow.callDone > 0 ? calculatePercentage(flow.connected, flow.callDone) : 0
  const interestRate = flow.connected > 0 ? calculatePercentage(flow.interested, flow.connected) : 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Analyse your recruitment pipeline and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            {DATE_PRESETS.map(p => (
              <button key={p.value} onClick={() => setDatePreset(p.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${datePreset === p.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {p.label}
              </button>
            ))}
          </div>
          {tab === 'pipeline' && <Button onClick={exportPipeline} variant="outline">Export</Button>}
          {tab === 'company' && <Button onClick={exportCompany} variant="outline">Export</Button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {([
          { key: 'pipeline', label: 'Pipeline Flow' },
          { key: 'performance', label: 'My Performance' },
          { key: 'company', label: 'Company-wise' },
        ] as { key: ReportTab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Pipeline Tab */}
      {tab === 'pipeline' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard label="Total Sourced" value={flow.sourced} sub="All time / filtered" accent="border-l-slate-500" />
            <MetricCard label="Connect Rate" value={`${connectRate}%`} sub={`${flow.connected} of ${flow.callDone} called`} accent="border-l-cyan-500" />
            <MetricCard label="Interest Rate" value={`${interestRate}%`} sub={`${flow.interested} of ${flow.connected} connected`} accent="border-l-emerald-500" />
            <MetricCard label="Joining Rate" value={`${overallConversion}%`} sub={`${flow.joined} joined of ${flow.sourced} sourced`} accent="border-l-pink-500" />
          </div>

          {pipelineChartData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <SectionHeader title="Pipeline Breakdown" description="Candidate count at each stage" />
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineChartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} formatter={(v: number) => [v, 'Candidates']} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {pipelineChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <SectionHeader title="Stage-by-stage Breakdown" description="Conversion from one stage to the next" />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Stage', 'Count', 'Conv. from Previous', 'Overall %'].map(h => (
                      <th key={h} className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide ${h === 'Stage' ? 'text-left' : 'text-center'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {PIPELINE_STAGES.map((s, i) => {
                    const value = flow[s.key as keyof PipelineFlow] as number
                    const prev = i > 0 ? flow[PIPELINE_STAGES[i - 1].key as keyof PipelineFlow] as number : null
                    const fromPrev = prev !== null && prev > 0 ? calculatePercentage(value, prev) : null
                    const overall = flow.sourced > 0 ? calculatePercentage(value, flow.sourced) : 0
                    return (
                      <tr key={s.key} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                            <span className="font-medium text-gray-800">{s.label}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center font-bold text-gray-900">{value}</td>
                        <td className="px-5 py-3 text-center">
                          {fromPrev !== null ? (
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${fromPrev >= 60 ? 'bg-emerald-100 text-emerald-700' : fromPrev >= 30 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>{fromPrev}%</span>
                          ) : <span className="text-xs text-gray-400">—</span>}
                        </td>
                        <td className="px-5 py-3 text-center text-xs text-gray-500">{overall}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* My Performance Tab */}
      {tab === 'performance' && stats && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <MetricCard label="Total Sourced" value={stats.totalSourced} sub="Applications created" accent="border-l-slate-500" />
            <MetricCard label="Total Calls" value={stats.callsDoneToday} sub="Calls attempted" accent="border-l-blue-500" />
            <MetricCard label="Connected" value={stats.connectedToday} sub="Calls connected" accent="border-l-cyan-500" />
            <MetricCard label="Interested" value={stats.interestedToday} sub="Candidates interested" accent="border-l-emerald-500" />
            <MetricCard label="Interviews Scheduled" value={stats.interviewsScheduled} sub="Upcoming" accent="border-l-amber-500" />
            <MetricCard label="Interviews Done" value={stats.interviewsDoneToday} sub="Conducted" accent="border-l-orange-500" />
            <MetricCard label="Selected" value={stats.selectedThisMonth} sub="This month" accent="border-l-violet-500" />
            <MetricCard label="Joined" value={stats.joinedThisMonth} sub="This month" accent="border-l-pink-500" />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <SectionHeader title="Conversion Funnel" description="Key conversion rates across your pipeline" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              {[
                { label: 'Call → Connect', rate: stats.callsDoneToday > 0 ? calculatePercentage(stats.connectedToday, stats.callsDoneToday) : 0, desc: `${stats.connectedToday} of ${stats.callsDoneToday} calls connected`, tip: 'Aim for >40%. Low rate = better calling time or list quality needed.' },
                { label: 'Connect → Interest', rate: stats.connectedToday > 0 ? calculatePercentage(stats.interestedToday, stats.connectedToday) : 0, desc: `${stats.interestedToday} of ${stats.connectedToday} interested`, tip: 'Aim for >50%. Low rate = pitch improvement needed.' },
                { label: 'Selected → Joined', rate: stats.selectedThisMonth > 0 ? calculatePercentage(stats.joinedThisMonth, stats.selectedThisMonth) : 0, desc: `${stats.joinedThisMonth} of ${stats.selectedThisMonth} joined`, tip: 'Aim for >70%. Low rate = offer/follow-up improvement needed.' },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{item.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${item.rate >= 60 ? 'text-emerald-600' : item.rate >= 35 ? 'text-amber-600' : 'text-red-500'}`}>{item.rate}%</p>
                  <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                  <p className="text-xs text-gray-400 mt-2 italic">{item.tip}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <SectionHeader title="Where to Focus" description="Actionable insights based on your current numbers" />
            <div className="space-y-3 mt-2">
              {stats.callsDoneToday === 0 && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-500 font-bold text-lg leading-none mt-0.5">→</span>
                  <div><p className="text-sm font-semibold text-blue-800">Start calling candidates</p><p className="text-xs text-blue-600 mt-0.5">You have {stats.totalSourced} sourced candidates. Start making calls to build your pipeline.</p></div>
                </div>
              )}
              {stats.callsDoneToday > 0 && stats.connectedToday === 0 && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                  <span className="text-amber-600 font-bold text-lg leading-none mt-0.5">!</span>
                  <div><p className="text-sm font-semibold text-amber-800">Low connect rate</p><p className="text-xs text-amber-600 mt-0.5">0 connects from {stats.callsDoneToday} calls. Try calling at different times (10–11 AM or 5–7 PM).</p></div>
                </div>
              )}
              {stats.interviewsScheduled > 0 && stats.interviewsDoneToday === 0 && (
                <div className="flex items-start gap-3 p-3 bg-violet-50 rounded-lg">
                  <span className="text-violet-600 font-bold text-lg leading-none mt-0.5">📅</span>
                  <div><p className="text-sm font-semibold text-violet-800">Pending interviews</p><p className="text-xs text-violet-600 mt-0.5">{stats.interviewsScheduled} interviews scheduled. Follow up the day before to reduce no-shows.</p></div>
                </div>
              )}
              {stats.selectedThisMonth > 0 && stats.joinedThisMonth < stats.selectedThisMonth && (
                <div className="flex items-start gap-3 p-3 bg-pink-50 rounded-lg">
                  <span className="text-pink-600 font-bold text-lg leading-none mt-0.5">✓</span>
                  <div><p className="text-sm font-semibold text-pink-800">Follow up on selected candidates</p><p className="text-xs text-pink-600 mt-0.5">{stats.selectedThisMonth - stats.joinedThisMonth} selected but not yet joined.</p></div>
                </div>
              )}
              {stats.callsDoneToday > 0 && stats.connectedToday > 0 && stats.interestedToday === 0 && (
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                  <span className="text-red-500 font-bold text-lg leading-none mt-0.5">↓</span>
                  <div><p className="text-sm font-semibold text-red-800">No interested candidates</p><p className="text-xs text-red-600 mt-0.5">You&apos;re connecting but not converting. Review your pitch — highlight salary, growth, and role benefits.</p></div>
                </div>
              )}
              {stats.totalSourced > 0 && stats.callsDoneToday > 0 && stats.connectedToday > 0 && stats.interestedToday > 0 && stats.selectedThisMonth > 0 && stats.joinedThisMonth > 0 && (
                <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg">
                  <span className="text-emerald-600 font-bold text-lg leading-none mt-0.5">🎯</span>
                  <div><p className="text-sm font-semibold text-emerald-800">Pipeline is healthy</p><p className="text-xs text-emerald-600 mt-0.5">Candidates are moving through all stages. Keep up the momentum.</p></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Company Tab */}
      {tab === 'company' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard label="Companies" value={companyStats.length} sub="In your pipeline" accent="border-l-slate-500" />
            <MetricCard label="Total Applications" value={applications.length} sub="Loaded (up to 500)" accent="border-l-blue-500" />
            <MetricCard label="Total Selected" value={companyStats.reduce((s, c) => s + c.selected, 0)} sub="Across all companies" accent="border-l-violet-500" />
            <MetricCard label="Total Joined" value={companyStats.reduce((s, c) => s + c.joined, 0)} sub="Across all companies" accent="border-l-pink-500" />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <SectionHeader title="Company-wise Funnel" description="Conversion rates across all companies in your pipeline" />
            </div>
            {companyStats.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No data available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Company', 'Sourced', 'Connected', 'Interested', 'Interviews', 'Selected', 'Joined', 'Joining %'].map(h => (
                        <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide ${h === 'Company' ? 'text-left' : 'text-center'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {companyStats.map((c, i) => {
                      const joiningPct = calculatePercentage(c.joined, c.total)
                      return (
                        <tr key={i} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-gray-50/40' : ''}`}>
                          <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                          <td className="px-4 py-3 text-center font-bold text-gray-900">{c.total}</td>
                          <td className="px-4 py-3 text-center text-gray-700">{c.connected}</td>
                          <td className="px-4 py-3 text-center text-gray-700">{c.interested}</td>
                          <td className="px-4 py-3 text-center text-gray-700">{c.interviews}</td>
                          <td className="px-4 py-3 text-center text-gray-700">{c.selected}</td>
                          <td className="px-4 py-3 text-center text-gray-700">{c.joined}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${joiningPct >= 20 ? 'bg-emerald-100 text-emerald-700' : joiningPct >= 10 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>{joiningPct}%</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
