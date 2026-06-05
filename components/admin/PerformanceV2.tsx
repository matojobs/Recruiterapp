'use client'

import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import {
  getAnalyticsFunnel, getAnalyticsScorecards,
  type AdminFunnelResponse, type RecruiterScorecard,
} from '@/lib/admin/api'

// ── IST date-range presets ──────────────────────────────────────────────────
type Preset = 'today' | 'week' | 'mtd' | 'last_month' | 'ytd' | 'all'
const PRESETS: { key: Preset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'mtd', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'ytd', label: 'This Year' },
  { key: 'all', label: 'All Time' },
]
function istToday() { return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) }
function addDays(base: string, n: number) {
  const d = new Date(base + 'T00:00:00'); d.setDate(d.getDate() + n)
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}
function rangeFor(p: Preset): { from: string; to: string } {
  const today = istToday()
  if (p === 'today') return { from: today, to: today }
  if (p === 'week') return { from: addDays(today, -6), to: today }
  if (p === 'mtd') return { from: today.slice(0, 8) + '01', to: today }
  if (p === 'last_month') {
    const firstThis = today.slice(0, 8) + '01'
    const prevEnd = addDays(firstThis, -1)
    return { from: prevEnd.slice(0, 8) + '01', to: prevEnd }
  }
  if (p === 'ytd') return { from: today.slice(0, 4) + '-01-01', to: today }
  return { from: '2000-01-01', to: today }
}

function KPI({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-3 dark:border-gray-600 dark:from-gray-800 dark:to-gray-800">
      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

type SortKey = keyof Pick<RecruiterScorecard, 'attempts' | 'connected' | 'interested' | 'interview_sched' | 'selected' | 'joined' | 'select_to_join' | 'connect_rate'>

export default function PerformanceV2() {
  const [preset, setPreset] = useState<Preset>('mtd')
  const [funnel, setFunnel] = useState<AdminFunnelResponse | null>(null)
  const [rows, setRows] = useState<RecruiterScorecard[]>([])
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('joined')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const { from, to } = rangeFor(preset)
    Promise.all([
      getAnalyticsFunnel({ from, to }),
      getAnalyticsScorecards({ from, to }),
    ]).then(([f, s]) => {
      if (cancelled) return
      setFunnel(f); setRows(s)
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [preset])

  const sorted = useMemo(() => {
    const r = [...rows]
    r.sort((a, b) => {
      const av = a[sortKey] as number, bv = b[sortKey] as number
      return sortDir === 'asc' ? av - bv : bv - av
    })
    return r
  }, [rows, sortKey, sortDir])

  const chartData = useMemo(
    () => sorted.slice(0, 12).map(r => ({ name: r.recruiter_name?.slice(0, 16) || '—', value: r.joined })),
    [sorted],
  )

  const t = funnel?.totals, rt = funnel?.rates

  function header(key: SortKey, label: string) {
    const active = sortKey === key
    return (
      <th
        onClick={() => { if (active) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortDir('desc') } }}
        className="cursor-pointer select-none px-3 py-2 text-right font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 whitespace-nowrap"
      >
        {label}{active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
      </th>
    )
  }

  return (
    <div className="space-y-4">
      {/* Range selector */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Performance v2 · Live</span>
          <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-semibold">Single source of truth</span>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 gap-1">
          {PRESETS.map(p => (
            <button key={p.key} onClick={() => setPreset(p.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${preset === p.key ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Team KPI strip */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[...Array(7)].map((_, i) => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)}
        </div>
      ) : t && rt ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <KPI label="Attempts" value={t.attempts} />
          <KPI label="Connected" value={t.connected} sub={`${rt.connect_rate}%`} />
          <KPI label="Interested" value={t.interested} sub={`${rt.interest_rate}%`} />
          <KPI label="Interviews" value={t.interview_sched} sub={`${t.interview_done} done`} />
          <KPI label="Selected" value={t.selected} sub={`${rt.select_rate}% of done`} />
          <KPI label="Joined" value={t.joined} sub={`${rt.join_rate}% of selected`} />
          <KPI label="Backed Out" value={t.backout} />
        </div>
      ) : null}

      {/* Joins by recruiter chart */}
      {chartData.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Joins by Recruiter</h4>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" name="Joined" radius={4}>
                  {chartData.map((_, i) => <Cell key={i} fill="#6366f1" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
        <div className="border-b border-gray-200 px-4 py-2 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Leaderboard — ranked by outcome (joins)</h3>
        </div>
        <div className="max-h-[480px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-gray-700">
              <tr className="border-b-2 border-slate-200 dark:border-gray-600">
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">#</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Recruiter</th>
                {header('attempts', 'Attempts')}
                {header('connect_rate', 'Conn%')}
                {header('interested', 'Interested')}
                {header('interview_sched', 'Interviews')}
                {header('selected', 'Selected')}
                {header('select_to_join', 'Sel→Join%')}
                {header('joined', 'Joined')}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-3 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : sorted.length === 0 ? (
                <tr><td colSpan={9} className="px-3 py-8 text-center text-gray-400">No activity in this range</td></tr>
              ) : sorted.map((r, i) => (
                <tr key={r.recruiter_id} className={`border-b border-gray-100 dark:border-gray-700 hover:bg-indigo-50/60 dark:hover:bg-indigo-900/20 ${i % 2 ? 'bg-slate-50/60 dark:bg-gray-700/40' : ''}`}>
                  <td className="px-3 py-2 text-gray-400">{i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</td>
                  <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{r.recruiter_name}</td>
                  <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{r.attempts}</td>
                  <td className="px-3 py-2 text-right text-gray-500">{r.connect_rate}%</td>
                  <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{r.interested}</td>
                  <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{r.interview_sched}</td>
                  <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{r.selected}</td>
                  <td className="px-3 py-2 text-right">
                    <span className={`font-semibold ${r.select_to_join >= 70 ? 'text-green-600' : r.select_to_join >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                      {r.select_to_join}%
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-indigo-700 dark:text-indigo-300">{r.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
