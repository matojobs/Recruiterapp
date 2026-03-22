'use client'

import { useState, useMemo } from 'react'
import type { Application } from '@/types/database'
import { formatDate, calculateJoinedAge, formatJoinedAge } from '@/lib/utils'
import EditCandidateModal from './EditCandidateModal'

function EditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden>
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  )
}

const CALL_COLORS: Record<string, string> = {
  Connected: 'bg-emerald-100 text-emerald-700',
  RNR: 'bg-yellow-100 text-yellow-700',
  Busy: 'bg-orange-100 text-orange-700',
  'Wrong Number': 'bg-red-100 text-red-600',
  'Switched Off': 'bg-gray-100 text-gray-600',
  'Incoming Off': 'bg-gray-100 text-gray-600',
  'Call Back': 'bg-blue-100 text-blue-700',
  Invalid: 'bg-red-100 text-red-600',
  'Out of network': 'bg-gray-100 text-gray-500',
}

function Badge({ value, type }: { value: string | null | undefined; type?: string }) {
  if (!value) return <span className="text-gray-300">—</span>
  let cls = 'bg-gray-100 text-gray-600'
  if (type === 'call') cls = CALL_COLORS[value] ?? 'bg-gray-100 text-gray-600'
  else if (type === 'interested') cls = value === 'Yes' ? 'bg-emerald-100 text-emerald-700' : value === 'No' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700'
  else if (type === 'interview') cls = value === 'Done' ? 'bg-emerald-100 text-emerald-700' : value === 'Scheduled' ? 'bg-blue-100 text-blue-700' : value === 'Not Attended' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
  else if (type === 'selection') cls = value === 'Selected' ? 'bg-violet-100 text-violet-700' : value === 'Not Selected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'
  else if (type === 'joining') cls = value === 'Joined' ? 'bg-pink-100 text-pink-700' : value === 'Not Joined' ? 'bg-red-100 text-red-600' : value === 'Backed Out' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cls}`}>{value}</span>
}

interface Props {
  applications: Application[]
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (limit: number) => void
  onUpdate: (id: string, updates: Partial<Application>) => Promise<void>
}

const COLS = [
  { label: 'Edit', freeze: true, width: 'min-w-[70px]', left: 'left-0' },
  { label: 'Name', freeze: true, width: 'min-w-[150px]', left: 'left-[70px]' },
  { label: 'Phone', freeze: true, width: 'min-w-[120px]', left: 'left-[220px]' },
  { label: 'Company', width: 'min-w-[130px]' },
  { label: 'Role', width: 'min-w-[130px]' },
  { label: 'Call Status', width: 'min-w-[110px]' },
  { label: 'Interested', width: 'min-w-[90px]' },
  { label: 'Portal', width: 'min-w-[90px]' },
  { label: 'Assigned', width: 'min-w-[95px]' },
  { label: 'Call Date', width: 'min-w-[90px]' },
  { label: 'Interview', width: 'min-w-[90px]' },
  { label: 'IV Date', width: 'min-w-[85px]' },
  { label: 'IV Outcome', width: 'min-w-[100px]' },
  { label: 'Selection', width: 'min-w-[95px]' },
  { label: 'Joining', width: 'min-w-[95px]' },
  { label: 'Join Date', width: 'min-w-[90px]' },
  { label: 'Joined Age', width: 'min-w-[85px]' },
  { label: 'Backout', width: 'min-w-[90px]' },
  { label: 'Followup', width: 'min-w-[90px]' },
  { label: 'Age', width: 'min-w-[70px]' },
  { label: 'Notes', width: 'min-w-[120px]' },
]

export default function ApplicationsTable({ applications, page, limit, total, onPageChange, onPageSizeChange, onUpdate }: Props) {
  const [editingApp, setEditingApp] = useState<Application | null>(null)

  const totalPages = Math.max(1, Math.ceil((total || 0) / (limit || 1)))
  const startIndex = total === 0 ? 0 : (page - 1) * limit + 1
  const endIndex = total === 0 ? 0 : Math.min(page * limit, total)

  async function handleSave(id: string, updates: Partial<Application>) {
    await onUpdate(id, updates)
    setEditingApp(null)
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table toolbar: rows-per-page + count + pagination all in one row */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span>Show</span>
            <select
              value={String(limit)}
              onChange={e => onPageSizeChange(parseInt(e.target.value))}
              className="px-2 py-1 border border-gray-200 rounded-md text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>per page</span>
          </div>

          {total > 0 && (
            <span className="text-xs text-gray-400">
              {startIndex}–{endIndex} of <span className="font-semibold text-gray-600">{total}</span>
            </span>
          )}

          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => onPageChange(1)} disabled={page === 1}
              className="px-2 py-1 text-xs border border-gray-200 rounded-md disabled:opacity-30 hover:bg-gray-100 transition-colors">«</button>
            <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}
              className="px-2.5 py-1 text-xs border border-gray-200 rounded-md disabled:opacity-30 hover:bg-gray-100 transition-colors">‹</button>
            <span className="px-3 py-1 text-xs text-gray-600 font-medium">{page} / {totalPages}</span>
            <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
              className="px-2.5 py-1 text-xs border border-gray-200 rounded-md disabled:opacity-30 hover:bg-gray-100 transition-colors">›</button>
            <button onClick={() => onPageChange(totalPages)} disabled={page === totalPages}
              className="px-2 py-1 text-xs border border-gray-200 rounded-md disabled:opacity-30 hover:bg-gray-100 transition-colors">»</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {COLS.map(col => (
                  <th
                    key={col.label}
                    className={`px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${col.width} ${col.freeze ? `sticky ${col.left} bg-gray-50 z-20 border-r border-gray-200` : ''}`}
                  >
                    {col.label === 'Edit' ? (
                      <span className="flex items-center gap-1"><EditIcon /> Edit</span>
                    ) : col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={COLS.length} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <svg className="w-10 h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-sm font-medium">No candidates found</p>
                      <p className="text-xs">Try adjusting your filters or add a new candidate</p>
                    </div>
                  </td>
                </tr>
              ) : (
                applications.map((app, i) => (
                  <tr key={app.id} className={`hover:bg-indigo-50/30 transition-colors group ${i % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}`}>
                    {/* Edit — frozen */}
                    <td className={`px-3 py-2 sticky left-0 z-10 border-r border-gray-100 ${i % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'} group-hover:bg-indigo-50/30`}>
                      <button
                        onClick={() => setEditingApp(app)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-md transition-colors font-medium"
                        title="Edit candidate"
                      >
                        <EditIcon />
                        Edit
                      </button>
                    </td>

                    {/* Name — frozen */}
                    <td className={`px-3 py-2 sticky left-[70px] z-10 border-r border-gray-100 ${i % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'} group-hover:bg-indigo-50/30 font-medium text-gray-900 whitespace-nowrap`}>
                      {app.candidate?.candidate_name || '—'}
                    </td>

                    {/* Phone — frozen */}
                    <td className={`px-3 py-2 sticky left-[220px] z-10 border-r border-gray-100 ${i % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'} group-hover:bg-indigo-50/30 text-gray-600 whitespace-nowrap font-mono text-xs`}>
                      {app.candidate?.phone || '—'}
                    </td>

                    <td className="px-3 py-2 whitespace-nowrap text-gray-700 text-xs">{(app.job_role as any)?.company?.company_name || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-700 text-xs">{app.job_role?.job_role || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap"><Badge value={app.call_status} type="call" /></td>
                    <td className="px-3 py-2 whitespace-nowrap"><Badge value={app.interested_status} type="interested" /></td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{app.portal || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{formatDate(app.assigned_date)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{formatDate(app.call_date)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {app.interview_scheduled ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Yes</span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{formatDate(app.interview_date)}</td>
                    <td className="px-3 py-2 whitespace-nowrap"><Badge value={app.interview_status} type="interview" /></td>
                    <td className="px-3 py-2 whitespace-nowrap"><Badge value={app.selection_status} type="selection" /></td>
                    <td className="px-3 py-2 whitespace-nowrap"><Badge value={app.joining_status} type="joining" /></td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{formatDate(app.joining_date)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {app.joining_status === 'Joined' && app.joining_date ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                          {formatJoinedAge(calculateJoinedAge(app.joining_date))}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{formatDate(app.backout_date)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{formatDate(app.followup_date)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                      {app.candidate?.age ? `${app.candidate.age}y` : '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500 max-w-[150px]">
                      <div className="truncate" title={app.notes || ''}>{app.notes || '—'}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom pagination */}
        {total > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-gray-50/60">
            <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => onPageChange(1)} disabled={page === 1}
                className="px-2 py-1 text-xs border border-gray-200 rounded-md disabled:opacity-30 hover:bg-gray-100 transition-colors">«</button>
              <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}
                className="px-2.5 py-1 text-xs border border-gray-200 rounded-md disabled:opacity-30 hover:bg-gray-100 transition-colors">‹ Prev</button>
              <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                className="px-2.5 py-1 text-xs border border-gray-200 rounded-md disabled:opacity-30 hover:bg-gray-100 transition-colors">Next ›</button>
              <button onClick={() => onPageChange(totalPages)} disabled={page === totalPages}
                className="px-2 py-1 text-xs border border-gray-200 rounded-md disabled:opacity-30 hover:bg-gray-100 transition-colors">»</button>
            </div>
          </div>
        )}
      </div>

      <EditCandidateModal
        isOpen={!!editingApp}
        onClose={() => setEditingApp(null)}
        application={editingApp}
        onSave={handleSave}
      />
    </>
  )
}
