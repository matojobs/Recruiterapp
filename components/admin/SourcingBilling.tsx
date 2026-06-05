'use client'

import { useEffect, useState, useCallback } from 'react'
import { getBillingDashboard, getBillingQueue, syncBilling, type BillingDashboard, type BillingLine } from '@/lib/admin/api'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const STATUS_COLORS: Record<string, string> = {
  queued: 'bg-amber-100 text-amber-700',
  invoiced: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  closed: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  credited: 'bg-gray-200 text-gray-600',
}

function inr(n: number | string | undefined) {
  const v = Number(n || 0)
  return '₹' + v.toLocaleString('en-IN')
}

/** Phase 5 — sourcing billing: joined candidates → billable lines → revenue. */
export default function SourcingBilling() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [dash, setDash] = useState<BillingDashboard | null>(null)
  const [queue, setQueue] = useState<BillingLine[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [d, q] = await Promise.all([getBillingDashboard(year), getBillingQueue()])
    setDash(d); setQueue(q); setLoading(false)
  }, [year])

  useEffect(() => { load() }, [load])

  async function handleSync() {
    setSyncing(true); setMsg('')
    const res = await syncBilling()
    setSyncing(false)
    if (res) { setMsg(`Synced — ${res.created} new billing line(s), ${res.credited} credited (backouts).`); load() }
    else setMsg('Sync failed.')
  }

  const s = dash?.summary

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">Sourcing Billing</h3>
          <p className="text-xs text-gray-500">Every joined candidate is a billable event. Set per-company fees, then sync.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
            {[0, 1, 2].map(o => { const y = new Date().getFullYear() - o; return <option key={y} value={y}>{y}</option> })}
          </select>
          <button onClick={handleSync} disabled={syncing}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            {syncing ? 'Syncing…' : 'Sync from Joins'}
          </button>
        </div>
      </div>

      {msg && <p className="text-xs text-indigo-600 bg-indigo-50 rounded-lg px-3 py-2">{msg}</p>}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Collected', value: inr(s?.total_collected), accent: 'text-green-600' },
          { label: 'Pending', value: inr(s?.total_pending), accent: 'text-amber-600' },
          { label: 'Queued', value: s?.queued ?? 0 },
          { label: 'Invoiced', value: s?.invoiced ?? 0 },
          { label: 'Paid', value: s?.paid ?? 0 },
          { label: 'Closed', value: s?.closed ?? 0 },
          { label: 'Credited', value: s?.credited ?? 0 },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-gray-100 bg-white shadow-sm p-3 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{c.label}</p>
            <p className={`text-lg font-bold mt-0.5 ${c.accent || 'text-gray-900 dark:text-white'}`}>{loading ? '—' : c.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly bars */}
      {dash && dash.monthly.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Monthly billed ({year})</p>
          <div className="flex items-end gap-2 h-32">
            {dash.monthly.map(m => {
              const max = Math.max(...dash.monthly.map(x => Number(x.billed) || 0), 1)
              const h = Math.round((Number(m.billed) / max) * 100)
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center justify-end gap-1">
                  <div className="w-full bg-indigo-500 rounded-t" style={{ height: `${h}%` }} title={inr(m.billed)} />
                  <span className="text-[9px] text-gray-400">{MONTHS[m.month - 1]}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Queue */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
        <div className="border-b border-gray-200 px-4 py-2 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Billing Queue ({queue.length})</h4>
        </div>
        <div className="max-h-[400px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-100 dark:bg-gray-700">
              <tr className="border-b-2 border-slate-200 dark:border-gray-600">
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Candidate</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Company</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Recruiter</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Join Date</th>
                <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">Amount</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : queue.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">No billing lines yet. Set company fees, then use Sync from Joins.</td></tr>
              ) : queue.map((b, i) => (
                <tr key={b.id} className={`border-b border-gray-100 dark:border-gray-700 ${i % 2 ? 'bg-slate-50/60 dark:bg-gray-700/40' : ''}`}>
                  <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{b.candidate_name || '—'}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{b.company_name || '—'}</td>
                  <td className="px-3 py-2 text-gray-500">{b.recruiter_name || '—'}</td>
                  <td className="px-3 py-2 text-gray-500">{b.join_date || '—'}</td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-gray-100">{inr(b.amount)}</td>
                  <td className="px-3 py-2">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-600'}`}>{b.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
