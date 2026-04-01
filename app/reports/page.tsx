'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getApplications } from '@/lib/data'
import { getCurrentUser } from '@/lib/auth-helper'
import type { Application, PipelineFlow, DashboardStats } from '@/types/database'
import { EMPTY_PIPELINE_FLOW } from '@/types/database'
import { calculatePercentage } from '@/lib/utils'
import Button from '@/components/ui/Button'
import * as XLSX from 'xlsx'

// ── Types ────────────────────────────────────────────────────────────────────
type DatePreset = 'dod' | 'mtd' | 'all'
type ReportTab = 'pipeline' | 'performance' | 'company'

// ── Period helpers ────────────────────────────────────────────────────────────
const DATE_PRESETS: { label: string; value: DatePreset }[] = [
  { label: 'Today (DOD)', value: 'dod' },
  { label: 'This Month (MTD)', value: 'mtd' },
  { label: 'All Time', value: 'all' },
]

function todayStr() { return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) }
function monthStartStr() { const t = todayStr(); return t.slice(0, 8) + '01' }

function inPeriod(date: string | null | undefined, preset: DatePreset): boolean {
  if (preset === 'all') return true
  if (!date) return false
  const d = date.slice(0, 10)
  if (preset === 'dod') return d === todayStr()
  return d >= monthStartStr() && d <= todayStr()
}

// ── Stats computed from apps ──────────────────────────────────────────────────
function computeStats(apps: Application[], preset: DatePreset): DashboardStats {
  const ip = (d: string | null | undefined) => inPeriod(d, preset)
  const DONE = ['Done', 'Not Attended', 'Rejected']
  return {
    totalSourced:        preset === 'all' ? apps.length : apps.filter(a => ip(a.assigned_date)).length,
    callsDoneToday:      apps.filter(a => ip(a.call_date)).length,
    connectedToday:      apps.filter(a => ip(a.call_date) && a.call_status === 'Connected').length,
    interestedToday:     apps.filter(a => ip(a.call_date) && a.interested_status === 'Yes').length,
    notInterestedToday:  apps.filter(a => ip(a.call_date) && a.interested_status === 'No').length,
    interviewsDoneToday: apps.filter(a => ip(a.interview_date) && DONE.includes(a.interview_status || '')).length,
    interviewsScheduled: apps.filter(a => a.interview_scheduled && (a.interview_status == null || a.interview_status === 'Scheduled')).length,
    selectedThisMonth:   apps.filter(a => ip(a.interview_date) && a.selection_status === 'Selected').length,
    joinedThisMonth:     apps.filter(a => ip(a.joining_date) && a.joining_status === 'Joined').length,
    pendingJoining:      apps.filter(a => a.selection_status === 'Selected' && (a.joining_status === 'Pending' || a.joining_status == null)).length,
  }
}

// ── Pipeline computed from apps ───────────────────────────────────────────────
function computeFlow(apps: Application[], preset: DatePreset): PipelineFlow {
  const ip = (d: string | null | undefined) => inPeriod(d, preset)
  const DONE = ['Done', 'Not Attended', 'Rejected']

  if (preset === 'all') {
    return {
      sourced:                apps.length,
      callDone:               apps.filter(a => a.call_date != null).length,
      connected:              apps.filter(a => a.call_status === 'Connected').length,
      interestPending:        apps.filter(a => a.call_status === 'Connected' && a.interested_status == null).length,
      interested:             apps.filter(a => a.interested_status === 'Yes').length,
      callBackLater:          apps.filter(a => a.interested_status === 'Call Back Later').length,
      notInterested:          apps.filter(a => a.interested_status === 'No').length,
      interviewScheduled:     apps.filter(a => a.interview_scheduled === true).length,
      interviewResultPending: apps.filter(a => a.interview_scheduled === true && (a.interview_status == null || a.interview_status === 'Scheduled')).length,
      interviewDone:          apps.filter(a => DONE.includes(a.interview_status || '')).length,
      selectionPending:       apps.filter(a => DONE.includes(a.interview_status || '') && (a.selection_status == null || a.selection_status === 'Pending')).length,
      selected:               apps.filter(a => a.selection_status === 'Selected').length,
      notSelected:            apps.filter(a => a.selection_status === 'Not Selected').length,
      joined:                 apps.filter(a => a.joining_status === 'Joined').length,
      notJoined:              apps.filter(a => a.joining_status === 'Not Joined').length,
      backedOut:              apps.filter(a => a.joining_status === 'Backed Out').length,
      pendingJoining:         apps.filter(a => a.selection_status === 'Selected' && (a.joining_status === 'Pending' || a.joining_status == null)).length,
      followupsDue: 0,
    }
  }

  return {
    sourced:                apps.filter(a => ip(a.assigned_date)).length,
    callDone:               apps.filter(a => ip(a.call_date)).length,
    connected:              apps.filter(a => ip(a.call_date) && a.call_status === 'Connected').length,
    interestPending:        apps.filter(a => ip(a.call_date) && a.call_status === 'Connected' && a.interested_status == null).length,
    interested:             apps.filter(a => ip(a.call_date) && a.interested_status === 'Yes').length,
    callBackLater:          apps.filter(a => ip(a.call_date) && a.interested_status === 'Call Back Later').length,
    notInterested:          apps.filter(a => ip(a.call_date) && a.interested_status === 'No').length,
    interviewScheduled:     apps.filter(a => ip(a.interview_date)).length,
    interviewResultPending: apps.filter(a => ip(a.interview_date) && (a.interview_status == null || a.interview_status === 'Scheduled')).length,
    interviewDone:          apps.filter(a => ip(a.interview_date) && DONE.includes(a.interview_status || '')).length,
    selectionPending:       apps.filter(a => ip(a.interview_date) && (a.selection_status == null || a.selection_status === 'Pending')).length,
    selected:               apps.filter(a => ip(a.interview_date) && a.selection_status === 'Selected').length,
    notSelected:            apps.filter(a => ip(a.interview_date) && a.selection_status === 'Not Selected').length,
    joined:                 apps.filter(a => ip(a.joining_date) && a.joining_status === 'Joined').length,
    notJoined:              apps.filter(a => ip(a.joining_date) && a.joining_status === 'Not Joined').length,
    backedOut:              apps.filter(a => ip(a.joining_date) && a.joining_status === 'Backed Out').length,
    pendingJoining:         apps.filter(a => a.selection_status === 'Selected' && (a.joining_status === 'Pending' || a.joining_status == null)).length,
    followupsDue: 0,
  }
}

// ── Pipeline stage definitions ────────────────────────────────────────────────
const PIPELINE_STAGES = [
  { key: 'sourced',                label: 'Sourced',                  color: '#64748b' },
  { key: 'callDone',               label: 'Call Done',                color: '#3b82f6' },
  { key: 'connected',              label: 'Connected',                color: '#06b6d4' },
  { key: 'interestPending',        label: 'Interest Not Updated',     color: '#cbd5e1' },
  { key: 'interested',             label: 'Interested',               color: '#10b981' },
  { key: 'callBackLater',          label: 'Call Back Later',          color: '#facc15' },
  { key: 'notInterested',          label: 'Not Interested',           color: '#f87171' },
  { key: 'interviewScheduled',     label: 'Interview Scheduled',      color: '#f59e0b' },
  { key: 'interviewResultPending', label: 'Interview Result Pending', color: '#cbd5e1' },
  { key: 'interviewDone',          label: 'Interview Done',           color: '#f97316' },
  { key: 'selectionPending',       label: 'Selection Pending',        color: '#cbd5e1' },
  { key: 'selected',               label: 'Selected',                 color: '#8b5cf6' },
  { key: 'notSelected',            label: 'Not Selected',             color: '#f43f5e' },
  { key: 'joined',                 label: 'Joined',                   color: '#ec4899' },
  { key: 'notJoined',              label: 'Not Joined',               color: '#9ca3af' },
  { key: 'backedOut',              label: 'Backed Out',               color: '#ea580c' },
  { key: 'pendingJoining',         label: 'Pending Joining',          color: '#818cf8' },
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
  const [tab, setTab]                   = useState<ReportTab>('pipeline')
  const [datePreset, setDatePreset]     = useState<DatePreset>('mtd')
  const [allApplications, setAllApplications] = useState<Application[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const user = await getCurrentUser()
      const rid = user?.recruiter_id ? String(user.recruiter_id) : undefined
      // Load all apps once — period filtering is done client-side
      const appsData = await getApplications({ recruiter_id: rid, limit: 2000 })
      setAllApplications(appsData)
    } catch (err) {
      console.error('Error loading reports:', err)
      setError('Failed to load report data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Derived state (recomputed on preset change, no extra API call) ─────────
  const flow  = useMemo(() => computeFlow(allApplications, datePreset),  [allApplications, datePreset])
  const stats = useMemo(() => computeStats(allApplications, datePreset), [allApplications, datePreset])

  // Company stats — filtered by period using call_date as anchor
  const companyStats = useMemo(() => {
    const ip = (d: string | null | undefined) => inPeriod(d, datePreset)
    const map = new Map<string, { name: string; total: number; connected: number; interested: number; interviews: number; selected: number; joined: number }>()
    allApplications.forEach(app => {
      // Include the row if it has any activity in the period
      const hasActivity = ip(app.assigned_date) || ip(app.call_date) || ip(app.interview_date) || ip(app.joining_date)
      if (datePreset !== 'all' && !hasActivity) return
      const name = (app.job_role as any)?.company?.company_name || 'Unknown'
      if (!map.has(name)) map.set(name, { name, total: 0, connected: 0, interested: 0, interviews: 0, selected: 0, joined: 0 })
      const s = map.get(name)!
      s.total++
      if (ip(app.call_date) && app.call_status === 'Connected') s.connected++
      if (ip(app.call_date) && app.interested_status === 'Yes') s.interested++
      if (ip(app.interview_date)) s.interviews++
      if (ip(app.interview_date) && app.selection_status === 'Selected') s.selected++
      if (ip(app.joining_date) && app.joining_status === 'Joined') s.joined++
    })
    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [allApplications, datePreset])

  const pipelineChartData = useMemo(() =>
    PIPELINE_STAGES
      .filter(s => (flow[s.key as keyof PipelineFlow] as number) > 0)
      .map(s => ({ name: s.label, value: flow[s.key as keyof PipelineFlow] as number, color: s.color }))
  , [flow])

  // ── Exports ───────────────────────────────────────────────────────────────
  function exportPipeline() {
    const data = PIPELINE_STAGES.map((s, i) => ({
      Stage: s.label,
      Count: flow[s.key as keyof PipelineFlow],
      'From Previous (%)': i === 0 ? '100%' : `${calculatePercentage(flow[s.key as keyof PipelineFlow] as number, flow[PIPELINE_STAGES[i - 1].key as keyof PipelineFlow] as number)}%`,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Pipeline')
    XLSX.writeFile(wb, `pipeline_${datePreset}_${todayStr()}.xlsx`)
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
    XLSX.writeFile(wb, `company_report_${todayStr()}.xlsx`)
  }

  // ── Loading / Error ───────────────────────────────────────────────────────
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
  const connectRate  = flow.callDone  > 0 ? calculatePercentage(flow.connected,  flow.callDone)  : 0
  const interestRate = flow.connected > 0 ? calculatePercentage(flow.interested, flow.connected) : 0
  const joinRate     = stats.selectedThisMonth > 0 ? calculatePercentage(stats.joinedThisMonth, stats.selectedThisMonth) : 0
  const periodLabel  = DATE_PRESETS.find(p => p.value === datePreset)?.label ?? ''

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Analyse your recruitment pipeline and performance</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            {DATE_PRESETS.map(p => (
              <button
                key={p.value}
                onClick={() => setDatePreset(p.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  datePreset === p.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {tab === 'pipeline' && <Button onClick={exportPipeline} variant="outline">Export</Button>}
          {tab === 'company'  && <Button onClick={exportCompany}  variant="outline">Export</Button>}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-gray-200">
        {([
          { key: 'pipeline',    label: 'Pipeline Flow' },
          { key: 'performance', label: 'My Performance' },
          { key: 'company',     label: 'Company-wise' },
        ] as { key: ReportTab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Pipeline Tab ── */}
      {tab === 'pipeline' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard label="Total Sourced"  value={flow.sourced}      sub={periodLabel}                                                  accent="border-l-slate-500" />
            <MetricCard label="Connect Rate"   value={`${connectRate}%`} sub={`${flow.connected} of ${flow.callDone} called`}               accent="border-l-cyan-500" />
            <MetricCard label="Interest Rate"  value={`${interestRate}%`}sub={`${flow.interested} of ${flow.connected} connected`}          accent="border-l-emerald-500" />
            <MetricCard label="Joining Rate"   value={`${overallConversion}%`} sub={`${flow.joined} joined of ${flow.sourced} sourced`}     accent="border-l-pink-500" />
          </div>

          {pipelineChartData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <SectionHeader title="Pipeline Breakdown" description={`Candidate count at each stage — ${periodLabel}`} />
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
                    <th className="px-5 py-3 text-left   text-xs font-semibold text-gray-500 uppercase tracking-wide">Stage</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Count</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Conv. from Previous</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Overall %</th>
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
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${fromPrev >= 60 ? 'bg-emerald-100 text-emerald-700' : fromPrev >= 30 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                              {fromPrev}%
                            </span>
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

      {/* ── My Performance Tab ── */}
      {tab === 'performance' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <MetricCard label="Total Sourced"        value={stats.totalSourced}        sub={`Assigned — ${periodLabel}`}   accent="border-l-slate-500" />
            <MetricCard label="Calls Done"           value={stats.callsDoneToday}      sub={`Calls — ${periodLabel}`}      accent="border-l-blue-500" />
            <MetricCard label="Connected"            value={stats.connectedToday}      sub={`Calls connected`}             accent="border-l-cyan-500" />
            <MetricCard label="Interested"           value={stats.interestedToday}     sub={`Candidates interested`}       accent="border-l-emerald-500" />
            <MetricCard label="Not Interested"       value={stats.notInterestedToday}  sub={`Candidates not interested`}   accent="border-l-red-400" />
            <MetricCard label="Int. Scheduled"       value={stats.interviewsScheduled} sub={`Upcoming (all-time)`}         accent="border-l-amber-500" />
            <MetricCard label="Int. Done"            value={stats.interviewsDoneToday} sub={`Interviews conducted`}        accent="border-l-orange-500" />
            <MetricCard label="Selected"             value={stats.selectedThisMonth}   sub={`Selected — ${periodLabel}`}   accent="border-l-violet-500" />
            <MetricCard label="Joined"               value={stats.joinedThisMonth}     sub={`Joined — ${periodLabel}`}     accent="border-l-pink-500" />
            <MetricCard label="Pending Joining"      value={stats.pendingJoining}      sub={`Selected, not yet joined`}    accent="border-l-indigo-500" />
          </div>

          {/* Conversion chain */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <SectionHeader title="Conversion Funnel" description={`Key conversion rates — ${periodLabel}`} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              {[
                {
                  label: 'Call → Connect',
                  rate: stats.callsDoneToday > 0 ? calculatePercentage(stats.connectedToday, stats.callsDoneToday) : 0,
                  desc: `${stats.connectedToday} of ${stats.callsDoneToday} calls connected`,
                  tip: 'Aim for >40%. Low rate = better calling time or list quality needed.',
                },
                {
                  label: 'Connect → Interest',
                  rate: stats.connectedToday > 0 ? calculatePercentage(stats.interestedToday, stats.connectedToday) : 0,
                  desc: `${stats.interestedToday} of ${stats.connectedToday} interested`,
                  tip: 'Aim for >50%. Low rate = pitch improvement needed.',
                },
                {
                  label: 'Selected → Joined',
                  rate: joinRate,
                  desc: `${stats.joinedThisMonth} of ${stats.selectedThisMonth} joined`,
                  tip: 'Aim for >70%. Low rate = offer/follow-up improvement needed.',
                },
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

          {/* Focus areas */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <SectionHeader title="Where to Focus" description="Actionable insights based on your current numbers" />
            <div className="space-y-3 mt-2">
              {stats.callsDoneToday === 0 && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-500 font-bold text-lg leading-none mt-0.5">→</span>
                  <div>
                    <p className="text-sm font-semibold text-blue-800">Start calling candidates</p>
                    <p className="text-xs text-blue-600 mt-0.5">You have {stats.totalSourced} sourced candidates. Start making calls to build your pipeline.</p>
                  </div>
                </div>
              )}
              {stats.callsDoneToday > 0 && stats.connectedToday === 0 && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                  <span className="text-amber-600 font-bold text-lg leading-none mt-0.5">!</span>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Low connect rate</p>
                    <p className="text-xs text-amber-600 mt-0.5">0 connects from {stats.callsDoneToday} calls. Try calling at different times (10–11 AM or 5–7 PM).</p>
                  </div>
                </div>
              )}
              {stats.interviewsScheduled > 0 && stats.interviewsDoneToday === 0 && (
                <div className="flex items-start gap-3 p-3 bg-violet-50 rounded-lg">
                  <span className="text-violet-600 font-bold text-lg leading-none mt-0.5">📅</span>
                  <div>
                    <p className="text-sm font-semibold text-violet-800">Pending interviews</p>
                    <p className="text-xs text-violet-600 mt-0.5">{stats.interviewsScheduled} interviews scheduled. Follow up the day before to reduce no-shows.</p>
                  </div>
                </div>
              )}
              {stats.selectedThisMonth > 0 && stats.joinedThisMonth < stats.selectedThisMonth && (
                <div className="flex items-start gap-3 p-3 bg-pink-50 rounded-lg">
                  <span className="text-pink-600 font-bold text-lg leading-none mt-0.5">✓</span>
                  <div>
                    <p className="text-sm font-semibold text-pink-800">Follow up on selected candidates</p>
                    <p className="text-xs text-pink-600 mt-0.5">{stats.selectedThisMonth - stats.joinedThisMonth} selected but not yet joined. Proactive follow-up prevents dropouts.</p>
                  </div>
                </div>
              )}
              {stats.callsDoneToday > 0 && stats.connectedToday > 0 && stats.interestedToday === 0 && (
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                  <span className="text-red-500 font-bold text-lg leading-none mt-0.5">↓</span>
                  <div>
                    <p className="text-sm font-semibold text-red-800">No interested candidates</p>
                    <p className="text-xs text-red-600 mt-0.5">You&apos;re connecting but not converting. Review your pitch — highlight salary, growth, and role benefits.</p>
                  </div>
                </div>
              )}
              {stats.totalSourced > 0 && stats.callsDoneToday > 0 && stats.connectedToday > 0 && stats.interestedToday > 0 && stats.selectedThisMonth > 0 && stats.joinedThisMonth > 0 && (
                <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg">
                  <span className="text-emerald-600 font-bold text-lg leading-none mt-0.5">🎯</span>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Pipeline is healthy</p>
                    <p className="text-xs text-emerald-600 mt-0.5">Candidates are moving through all stages. Keep up the momentum.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Company Tab ── */}
      {tab === 'company' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard label="Companies"          value={companyStats.length}                               sub={periodLabel}              accent="border-l-slate-500" />
            <MetricCard label="Total Applications" value={companyStats.reduce((s, c) => s + c.total, 0)}    sub={periodLabel}              accent="border-l-blue-500" />
            <MetricCard label="Total Selected"     value={companyStats.reduce((s, c) => s + c.selected, 0)} sub={`Across all companies`}   accent="border-l-violet-500" />
            <MetricCard label="Total Joined"       value={companyStats.reduce((s, c) => s + c.joined, 0)}   sub={`Across all companies`}   accent="border-l-pink-500" />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <SectionHeader title="Company-wise Funnel" description={`Conversion rates across all companies — ${periodLabel}`} />
            </div>
            {companyStats.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No data for the selected period</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Company', 'Sourced', 'Connected', 'Interested', 'Interviews', 'Selected', 'Joined', 'Joining %'].map(h => (
                        <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide ${h === 'Company' ? 'text-left' : 'text-center'}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {companyStats.map((c, i) => {
                      const joiningPct = calculatePercentage(c.joined, c.total)
                      return (
                        <tr key={i} className={`hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                          <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                          <td className="px-4 py-3 text-center font-bold text-gray-900">{c.total}</td>
                          <td className="px-4 py-3 text-center text-gray-700">{c.connected}</td>
                          <td className="px-4 py-3 text-center text-gray-700">{c.interested}</td>
                          <td className="px-4 py-3 text-center text-gray-700">{c.interviews}</td>
                          <td className="px-4 py-3 text-center text-gray-700">{c.selected}</td>
                          <td className="px-4 py-3 text-center text-gray-700">{c.joined}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${joiningPct >= 20 ? 'bg-emerald-100 text-emerald-700' : joiningPct >= 10 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                              {joiningPct}%
                            </span>
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
