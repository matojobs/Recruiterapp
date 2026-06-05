'use client'

import { useEffect, useState } from 'react'
import { getAnalyticsNegativeFunnel, type NegativeFunnelData, type ReasonBucket } from '@/lib/admin/api'

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

function ReasonCard({ title, color, bucket }: { title: string; color: string; bucket: ReasonBucket }) {
  const top = bucket.reasons[0]
  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
      <div className={`px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between ${color}`}>
        <h4 className="text-sm font-semibold">{title}</h4>
        <span className="text-sm font-bold">{bucket.total}</span>
      </div>
      <div className="max-h-72 overflow-auto">
        {bucket.reasons.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-400">No data in this range</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {bucket.reasons.map((r, i) => {
                const pct = bucket.total ? Math.round((r.count / bucket.total) * 100) : 0
                return (
                  <tr key={i} className="border-b border-gray-50 dark:border-gray-700/50">
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                      <div className="flex items-center justify-between gap-2">
                        <span className={r.reason === '(blank)' ? 'italic text-gray-400' : ''}>{r.reason}</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100 shrink-0">{r.count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                        <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      {top && top.reason !== '(blank)' && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/40 text-[11px] text-gray-500">
          Top reason: <span className="font-semibold text-gray-700 dark:text-gray-300">{top.reason}</span>
        </div>
      )}
    </div>
  )
}

/** Phase: full negative-funnel — all four drop-off reason types in one view. */
export default function NegativeFunnelV2() {
  const [preset, setPreset] = useState<Preset>('ytd')
  const [data, setData] = useState<NegativeFunnelData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const { from, to } = rangeFor(preset)
    getAnalyticsNegativeFunnel({ from, to }).then(d => { if (!cancelled) setData(d) }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [preset])

  const lost = data ? data.not_interested.total + data.not_attended.total + data.rejection.total + data.backout.total : 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">Negative Funnel — why we lose candidates</h3>
          <p className="text-xs text-gray-500">{loading ? '…' : `${lost} drop-offs in range — captured at every stage`}</p>
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

      {loading || !data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ReasonCard title="Not Interested" color="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300" bucket={data.not_interested} />
          <ReasonCard title="Did Not Attend Interview" color="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300" bucket={data.not_attended} />
          <ReasonCard title="Rejected in Interview" color="bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300" bucket={data.rejection} />
          <ReasonCard title="Backed Out After Selection" color="bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300" bucket={data.backout} />
        </div>
      )}
    </div>
  )
}
