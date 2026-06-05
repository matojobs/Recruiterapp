'use client'

import { useEffect, useMemo, useState } from 'react'
import { getAnalyticsByPortal, getAnalyticsByCompany, type GroupedFunnelRow } from '@/lib/admin/api'

type Preset = 'mtd' | 'last_month' | 'ytd' | 'all'
const PRESETS: { key: Preset; label: string }[] = [
  { key: 'mtd', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'ytd', label: 'This Year' },
  { key: 'all', label: 'All Time' },
]
function istToday() { return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) }
function addDays(b: string, n: number) { const d = new Date(b + 'T00:00:00'); d.setDate(d.getDate() + n); return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) }
function rangeFor(p: Preset) {
  const t = istToday()
  if (p === 'mtd') return { from: t.slice(0, 8) + '01', to: t }
  if (p === 'last_month') { const f = t.slice(0, 8) + '01'; const e = addDays(f, -1); return { from: e.slice(0, 8) + '01', to: e } }
  if (p === 'ytd') return { from: t.slice(0, 4) + '-01-01', to: t }
  return { from: '2000-01-01', to: t }
}

function rateColor(p: number) {
  return p >= 50 ? 'text-green-600' : p >= 20 ? 'text-amber-600' : 'text-red-500'
}

/** Phase 4 — Portal quality or Company health (same table, different grouping). */
export default function QualityTab({ dimension }: { dimension: 'portal' | 'company' }) {
  const [preset, setPreset] = useState<Preset>('ytd')
  const [rows, setRows] = useState<GroupedFunnelRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const { from, to } = rangeFor(preset)
    const fetcher = dimension === 'portal' ? getAnalyticsByPortal : getAnalyticsByCompany
    fetcher({ from, to }).then(r => { if (!cancelled) setRows(r) }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [preset, dimension])

  const label = dimension === 'portal' ? 'Portal' : 'Company'
  const best = useMemo(() => [...rows].sort((a, b) => b.select_to_join - a.select_to_join)[0], [rows])
  const worst = useMemo(() => [...rows].filter(r => r.sourced >= 5).sort((a, b) => a.sourced_to_join - b.sourced_to_join)[0], [rows])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">{label} Quality</h3>
          <p className="text-xs text-gray-500">{dimension === 'portal' ? 'Which sourcing platform actually produces joins' : 'Which clients convert — lead with Select→Join%'}</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 gap-1">
          {PRESETS.map(p => (
            <button key={p.key} onClick={() => setPreset(p.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium ${preset === p.key ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {!loading && (best || worst) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {best && best.joined > 0 && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-900/20">
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">⭐ Best converter: {best.group_name}</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">{best.select_to_join}% Select→Join · {best.joined} joined from {best.sourced} sourced</p>
            </div>
          )}
          {worst && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">⚠ Weakest: {worst.group_name}</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{worst.sourced_to_join}% Sourced→Join · {worst.sourced} sourced, only {worst.joined} joined</p>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
        <div className="max-h-[480px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-gray-700">
              <tr className="border-b-2 border-slate-200 dark:border-gray-600 text-right">
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">{label}</th>
                <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-300">Sourced</th>
                <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-300">Connect%</th>
                <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-300">Interest%</th>
                <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-300">Interviews</th>
                <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-300">Selected</th>
                <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-300">Joined</th>
                <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-300">Int→Sel%</th>
                <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-300">Sel→Join%</th>
                <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-300">Src→Join%</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="px-3 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={10} className="px-3 py-8 text-center text-gray-400">No data for this range</td></tr>
              ) : rows.map((r, i) => (
                <tr key={String(r.group_id) + i} className={`border-b border-gray-100 dark:border-gray-700 text-right hover:bg-indigo-50/60 dark:hover:bg-indigo-900/20 ${i % 2 ? 'bg-slate-50/60 dark:bg-gray-700/40' : ''}`}>
                  <td className="px-3 py-2 text-left font-medium text-gray-900 dark:text-gray-100">{r.group_name || '—'}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{r.sourced}</td>
                  <td className="px-3 py-2 text-gray-500">{r.connect_rate}%</td>
                  <td className="px-3 py-2 text-gray-500">{r.interest_rate}%</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{r.interview_sched}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{r.selected}</td>
                  <td className="px-3 py-2 font-bold text-indigo-700 dark:text-indigo-300">{r.joined}</td>
                  <td className={`px-3 py-2 font-semibold ${rateColor(r.interview_to_select)}`}>{r.interview_to_select}%</td>
                  <td className={`px-3 py-2 font-semibold ${rateColor(r.select_to_join)}`}>{r.select_to_join}%</td>
                  <td className={`px-3 py-2 font-semibold ${rateColor(r.sourced_to_join)}`}>{r.sourced_to_join}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
