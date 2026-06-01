'use client'

import { useEffect, useState } from 'react'
import { getInvoiceDashboard } from '@/lib/admin/api'

const IconFileText = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
  </svg>
)
const IconTrendingUp = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
  </svg>
)
const IconUsers = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
  </svg>
)
const IconRupee = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
  </svg>
)
const IconSpinner = () => (
  <svg className="h-8 w-8 animate-spin text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

interface DashboardData {
  year: number
  summary: {
    raised: number
    payment_pending: number
    payment_received: number
    closed: number
    declined: number
    credit_notes: number
    total_collected: string
    total_pending: string
  }
  monthly: Array<{
    month: number
    invoices: number
    collected: string
    pending: string
  }>
  billingQueueCount: number
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function AdminInvoicesPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        const json = await getInvoiceDashboard(year)
        setData(json as DashboardData)
      } catch (err) {
        console.error('Failed to fetch invoice dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [year])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices & Billing</h1>
          <p className="text-slate-500 text-[14px] mt-1">Financial overview and billing status</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={year} onChange={e => setYear(+e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/30">
            {[2024,2025,2026,2027].map(y => <option key={y}>{y}</option>)}
          </select>
          <a href="https://internship.jobsmato.com/admin/invoices" target="_blank" rel="noopener noreferrer"
            className="rounded-xl border border-blue-300 px-4 py-2 text-[13px] font-semibold text-blue-600 hover:bg-blue-50 transition-colors">
            Full Admin →
          </a>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <IconSpinner />
        </div>
      ) : !data ? (
        <div className="rounded-2xl border border-slate-200 p-10 text-center">
          <div className="flex justify-center mb-3 text-slate-300"><IconFileText /></div>
          <p className="text-slate-500 font-medium">No billing data available</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Collected', value: `₹${Number(data.summary.total_collected).toLocaleString('en-IN')}`, bg: 'bg-green-50', color: 'text-green-700', Icon: IconFileText },
              { label: 'Pending', value: `₹${Number(data.summary.total_pending).toLocaleString('en-IN')}`, bg: 'bg-amber-50', color: 'text-amber-700', Icon: IconTrendingUp },
              { label: 'Billing Queue', value: String(data.billingQueueCount), bg: 'bg-blue-50', color: 'text-blue-700', Icon: IconUsers },
              { label: 'Credit Notes', value: String(data.summary.credit_notes), bg: 'bg-red-50', color: 'text-red-600', Icon: IconRupee },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] text-slate-500">{c.label}</span>
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${c.bg} ${c.color}`}>
                    <c.Icon />
                  </div>
                </div>
                <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Invoice Status Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Invoice Status ({year})</h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {[
                { key: 'raised', label: 'Raised' },
                { key: 'payment_pending', label: 'Pending' },
                { key: 'payment_received', label: 'Received' },
                { key: 'closed', label: 'Closed' },
                { key: 'declined', label: 'Declined' },
              ].map(s => (
                <div key={s.key} className="text-center">
                  <p className="text-2xl font-bold text-slate-900">{(data.summary as Record<string, number | string>)[s.key] || 0}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Monthly Revenue ({year})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Month','Invoices','Collected','Pending'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.monthly.map(m => (
                    <tr key={m.month} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-3 py-2 font-medium">{MONTHS[m.month - 1]}</td>
                      <td className="px-3 py-2">{m.invoices}</td>
                      <td className="px-3 py-2 text-green-700 font-semibold">₹{Number(m.collected).toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-amber-700">₹{Number(m.pending).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info Box */}
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4">
            <p className="text-[13px] text-slate-600 leading-relaxed">
              <strong>Full billing management</strong> (create invoices, define criteria, record payments, issue credit notes) is available in the{' '}
              <a href="https://internship.jobsmato.com/admin/invoices" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                Internship Admin panel
              </a>. This page shows the financial dashboard for HRMS billing.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
