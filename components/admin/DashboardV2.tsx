'use client'

import { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { getAnalyticsFunnel, type AdminFunnelResponse } from '@/lib/admin/api'

function istToday() { return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) }
function monthStart(d: string) { return d.slice(0, 8) + '01' }
function addDays(base: string, n: number) {
  const dt = new Date(base + 'T00:00:00'); dt.setDate(dt.getDate() + n)
  return dt.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

function Delta({ curr, prev }: { curr: number; prev: number }) {
  const diff = curr - prev
  if (diff === 0) return <span className="text-[11px] text-gray-400 ml-1">—</span>
  const up = diff > 0
  return <span className={`text-[11px] font-semibold ml-1 ${up ? 'text-green-600' : 'text-red-500'}`}>{up ? '▲' : '▼'} {Math.abs(diff)}</span>
}

function Card({ label, value, sub, children }: { label: string; value: string | number; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-3 dark:border-gray-700 dark:bg-gray-800">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5 leading-none">{value}{children}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

const STAGES: { key: keyof AdminFunnelResponse['totals']; label: string }[] = [
  { key: 'sourced', label: 'Sourced' },
  { key: 'attempts', label: 'Attempts' },
  { key: 'connected', label: 'Connected' },
  { key: 'interested', label: 'Interested' },
  { key: 'interview_sched', label: 'Interviews' },
  { key: 'interview_done', label: 'Int. Done' },
  { key: 'selected', label: 'Selected' },
  { key: 'joined', label: 'Joined' },
]

export default function DashboardV2() {
  const [today, setToday] = useState<AdminFunnelResponse | null>(null)
  const [thisMonth, setThisMonth] = useState<AdminFunnelResponse | null>(null)
  const [lastMonth, setLastMonth] = useState<AdminFunnelResponse | null>(null)
  const [year, setYear] = useState<AdminFunnelResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const t = istToday()
    const thisFrom = monthStart(t)
    const lastEnd = addDays(thisFrom, -1)
    const lastFrom = monthStart(lastEnd)
    const yearFrom = t.slice(0, 4) + '-01-01'
    Promise.all([
      getAnalyticsFunnel({ from: t, to: t }),
      getAnalyticsFunnel({ from: thisFrom, to: t }),
      getAnalyticsFunnel({ from: lastFrom, to: lastEnd }),
      getAnalyticsFunnel({ from: yearFrom, to: t, granularity: 'month' }),
    ]).then(([td, tm, lm, yr]) => {
      if (cancelled) return
      setToday(td); setThisMonth(tm); setLastMonth(lm); setYear(yr)
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Worst-converting stage (leak detector) on this-month funnel
  const leak = useMemo(() => {
    const t = thisMonth?.totals
    if (!t) return null
    const steps = [
      { name: 'Attempt→Connect', from: t.attempts, to: t.connected },
      { name: 'Connect→Interest', from: t.connected, to: t.interested },
      { name: 'Interest→Interview', from: t.interested, to: t.interview_sched },
      { name: 'Interview→Select', from: t.interview_done, to: t.selected },
      { name: 'Select→Join', from: t.selected, to: t.joined },
    ].filter(s => s.from > 0)
    if (!steps.length) return null
    let worst = steps[0], worstPct = 100
    for (const s of steps) {
      const p = Math.round((s.to / s.from) * 100)
      if (p < worstPct) { worstPct = p; worst = s }
    }
    return { ...worst, pct: worstPct, lost: worst.from - worst.to }
  }, [thisMonth])

  const trend = useMemo(() => {
    const s = year?.series || []
    return s.map(pt => ({
      month: pt.bucket?.slice(0, 7) || '',
      joined: pt.joined || 0,
      selected: pt.selected || 0,
      sel_to_join: pt.selected ? Math.round(((pt.joined || 0) / pt.selected) * 100) : 0,
    }))
  }, [year])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)}</div>
        <div className="h-56 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
      </div>
    )
  }

  const td = today?.totals, tm = thisMonth?.totals, lm = lastMonth?.totals

  return (
    <div className="space-y-6">
      {/* ① TODAY */}
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">① Today — operational</p>
        {td && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card label="Attempts" value={td.attempts} />
            <Card label="Connected" value={td.connected} />
            <Card label="Interviews" value={td.interview_sched} />
            <Card label="Selected" value={td.selected} />
            <Card label="Joined" value={td.joined} />
            <Card label="Backed Out" value={td.backout} />
          </div>
        )}
      </section>

      {/* ② THIS MONTH vs LAST */}
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">② This Month vs Last Month — tactical</p>
        {tm && lm && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {STAGES.map(s => (
              <Card key={s.key} label={s.label} value={tm[s.key]}>
                <Delta curr={tm[s.key]} prev={lm[s.key]} />
              </Card>
            ))}
          </div>
        )}
        {leak && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">
              🔻 Biggest leak this month: {leak.name} — only {leak.pct}% convert ({leak.lost} lost)
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{leak.from} → {leak.to}. Focus here for the fastest gain.</p>
          </div>
        )}
      </section>

      {/* ③ YEAR TREND */}
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">③ This Year — strategic</p>
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-4 dark:border-gray-700 dark:bg-gray-800">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Joins & Select→Join% by month</h4>
          {trend.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No data yet this year</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="joined" name="Joined" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="sel_to_join" name="Select→Join %" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
