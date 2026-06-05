'use client'

import { useEffect, useState } from 'react'
import { getFunnel, presetToRange, type FunnelResponse, type RangePreset } from '@/lib/analytics-api'

const PRESETS: { key: RangePreset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'mtd', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'ytd', label: 'This Year' },
  { key: 'all', label: 'All Time' },
]

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5 leading-none">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

/**
 * Phase 1 dual-run panel. Renders the canonical server-computed funnel so it can
 * be compared against the legacy client-computed report below. Once parity is
 * confirmed, the client engine can be removed and this becomes the source.
 */
export default function LiveFunnelPanel() {
  const [preset, setPreset] = useState<RangePreset>('mtd')
  const [data, setData] = useState<FunnelResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const { from, to } = presetToRange(preset)
    getFunnel({ from, to })
      .then((d) => { if (!cancelled) setData(d) })
      .catch((e) => { if (!cancelled) setError(e.message || 'Failed to load') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [preset])

  const t = data?.totals
  const r = data?.rates

  return (
    <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Live · Server-computed</span>
          <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-semibold">Single source of truth</span>
        </div>
        <div className="flex bg-white rounded-lg p-1 gap-1 border border-indigo-100">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                preset === p.key ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-600 py-4 text-center">{error}</p>
      ) : loading || !t || !r ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-white/60 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Stat label="Sourced" value={t.sourced} />
            <Stat label="Attempts" value={t.attempts} />
            <Stat label="Connected" value={t.connected} sub={`${r.connect_rate}% of attempts`} />
            <Stat label="Interested" value={t.interested} sub={`${r.interest_rate}% of connected`} />
            <Stat label="Interviews" value={t.interview_sched} sub={`${t.interview_done} done`} />
            <Stat label="Selected" value={t.selected} sub={`${r.select_rate}% of int. done`} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Stat label="Joined" value={t.joined} sub={`${r.join_rate}% of selected`} />
            <Stat label="Rejected" value={t.rejected} />
            <Stat label="Backed Out" value={t.backout} />
            <Stat label="Yet to Join" value={t.yet_to_join} sub="current" />
            <Stat label="Not Interested" value={t.not_interested} />
            <Stat label="Sourced→Join" value={`${r.sourced_to_join}%`} />
          </div>
        </>
      )}
    </div>
  )
}
