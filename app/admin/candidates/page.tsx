'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { getAdminSourcingApplications } from '@/lib/admin/api'
import { CALL_STATUS_OPTIONS } from '@/lib/constants'

// ── Types ────────────────────────────────────────────────────────────────────
interface SourcingCandidate {
  id: string | number
  candidateName: string
  phone: string | null
  company: string
  jobRole: string
  recruiter: string
  callStatus: string | null
  interestedStatus: string | null
  interviewStatus: string | null
  selectionStatus: string | null
  joiningStatus: string | null
  assignedDate: string | null
}

// ── Badge helpers ─────────────────────────────────────────────────────────────
function StatusBadge({ value, type }: { value: string | null; type: 'call' | 'interest' | 'interview' | 'selection' | 'joining' }) {
  if (!value) return <span className="text-gray-300 text-xs">—</span>

  const classes: Record<string, string> = {
    // Call status
    Connected: 'bg-emerald-100 text-emerald-700',
    RNR: 'bg-yellow-100 text-yellow-700',
    Busy: 'bg-orange-100 text-orange-700',
    'Wrong Number': 'bg-red-100 text-red-600',
    'Switched Off': 'bg-gray-100 text-gray-600',
    'Incoming Off': 'bg-gray-100 text-gray-600',
    'Call Back': 'bg-blue-100 text-blue-700',
    Invalid: 'bg-red-100 text-red-600',
    'Out of network': 'bg-gray-100 text-gray-500',
    // Interest
    Yes: 'bg-emerald-100 text-emerald-700',
    No: 'bg-red-100 text-red-600',
    'Call Back Later': 'bg-yellow-100 text-yellow-700',
    // Interview
    Done: 'bg-emerald-100 text-emerald-700',
    Scheduled: 'bg-blue-100 text-blue-700',
    'Not Attended': 'bg-red-100 text-red-600',
    Rejected: 'bg-gray-100 text-gray-600',
    // Selection
    Selected: 'bg-violet-100 text-violet-700',
    'Not Selected': 'bg-red-100 text-red-600',
    Pending: 'bg-yellow-100 text-yellow-700',
    // Joining
    Joined: 'bg-pink-100 text-pink-700',
    'Not Joined': 'bg-red-100 text-red-600',
    'Backed Out': 'bg-orange-100 text-orange-700',
  }
  const cls = classes[value] || 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {value}
    </span>
  )
}

function mapRow(app: any): SourcingCandidate {
  const candidate = app.candidate ?? app.user ?? {}
  const firstName = candidate.firstName ?? candidate.first_name ?? ''
  const lastName = candidate.lastName ?? candidate.last_name ?? ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  const candidateName =
    candidate.candidate_name ?? (fullName || `Candidate #${app.candidate_id ?? app.id}`)

  const jobRole = app.job_role?.role_name ?? app.job_role?.job_role ?? app.jobRole?.title ?? '—'
  const company =
    app.job_role?.company?.name ??
    app.job_role?.company?.company_name ??
    app.company?.name ??
    '—'
  const recruiter = app.recruiter?.name ?? app.recruiterName ?? '—'

  return {
    id: app.id,
    candidateName,
    phone: candidate.phone ?? null,
    company,
    jobRole,
    recruiter,
    callStatus: app.call_status ?? null,
    interestedStatus: app.interested_status ?? null,
    interviewStatus: app.interview_status ?? null,
    selectionStatus: app.selection_status ?? null,
    joiningStatus: app.joining_status ?? null,
    assignedDate: app.assigned_date ?? app.created_at?.split('T')[0] ?? null,
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 25

export default function AdminCandidatesPage() {
  const [rows, setRows] = useState<SourcingCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterCall, setFilterCall] = useState('')
  const [filterSelection, setFilterSelection] = useState('')
  const [filterJoining, setFilterJoining] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await getAdminSourcingApplications({
      page,
      limit: PAGE_SIZE,
      call_status: filterCall || undefined,
      selection_status: filterSelection || undefined,
      joining_status: filterJoining || undefined,
      search: search || undefined,
    })
    if (!result) {
      setError('Unable to load sourcing candidates. This may require additional backend configuration to allow admin access to sourcing data.')
      setRows([])
    } else {
      setRows((result.applications as any[]).map(mapRow))
      setTotal(result.total)
      setTotalPages(result.total_pages ?? (Math.ceil(result.total / PAGE_SIZE) || 1))
    }
    setLoading(false)
  }, [page, filterCall, filterSelection, filterJoining, search])

  useEffect(() => { loadData() }, [loadData])

  // Reset to page 1 on filter change
  useEffect(() => { setPage(1) }, [filterCall, filterSelection, filterJoining, search])

  const stats = useMemo(() => ({
    total,
    connected: rows.filter(r => r.callStatus === 'Connected').length,
    interested: rows.filter(r => r.interestedStatus === 'Yes').length,
    selected: rows.filter(r => r.selectionStatus === 'Selected').length,
    joined: rows.filter(r => r.joiningStatus === 'Joined').length,
  }), [rows, total])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">All Candidates</h1>
        <p className="text-sm text-gray-500 mt-0.5">All sourcing candidates across all recruiters</p>
      </div>

      {/* Summary cards */}
      {!error && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: total, color: 'border-l-slate-500' },
            { label: 'Connected', value: stats.connected, color: 'border-l-cyan-500' },
            { label: 'Interested', value: stats.interested, color: 'border-l-emerald-500' },
            { label: 'Selected', value: stats.selected, color: 'border-l-violet-500' },
            { label: 'Joined', value: stats.joined, color: 'border-l-pink-500' },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-xl border border-gray-100 shadow-sm p-4 border-l-4 ${s.color}`}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{loading ? '—' : s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name, phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
        <select
          value={filterCall}
          onChange={e => setFilterCall(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-700"
        >
          <option value="">All Call Statuses</option>
          {CALL_STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filterSelection}
          onChange={e => setFilterSelection(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-700"
        >
          <option value="">All Selection Statuses</option>
          <option value="Selected">Selected</option>
          <option value="Not Selected">Not Selected</option>
          <option value="Pending">Pending</option>
        </select>
        <select
          value={filterJoining}
          onChange={e => setFilterJoining(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-700"
        >
          <option value="">All Joining Statuses</option>
          <option value="Joined">Joined</option>
          <option value="Not Joined">Not Joined</option>
          <option value="Pending">Pending</option>
          <option value="Backed Out">Backed Out</option>
        </select>
        {(filterCall || filterSelection || filterJoining || search) && (
          <button
            onClick={() => { setSearch(''); setFilterCall(''); setFilterSelection(''); setFilterJoining('') }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Clear
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800">
          <p className="font-semibold mb-1">Could not load sourcing candidates</p>
          <p className="text-amber-700">{error}</p>
          <p className="text-amber-600 mt-2 text-xs">
            To enable this page, the backend needs to allow admin access to{' '}
            <code className="bg-amber-100 px-1 rounded">/api/recruiter/applications</code> or expose a dedicated{' '}
            <code className="bg-amber-100 px-1 rounded">/api/admin/sourcing/applications</code> endpoint.
          </p>
          <button onClick={loadData} className="mt-3 text-sm font-medium text-amber-800 underline">Retry</button>
        </div>
      )}

      {/* Table */}
      {!error && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Candidate', 'Phone', 'Company', 'Job Role', 'Recruiter', 'Call Status', 'Interested', 'Interview', 'Selected', 'Joining', 'Assigned'].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[...Array(11)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 rounded w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-sm text-gray-400">
                      No candidates found
                    </td>
                  </tr>
                ) : (
                  rows.map((row, i) => (
                    <tr key={row.id} className={`hover:bg-gray-50 transition-colors ${i % 2 === 1 ? 'bg-gray-50/40' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{row.candidateName}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.phone || '—'}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{row.company}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{row.jobRole}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.recruiter}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge value={row.callStatus} type="call" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge value={row.interestedStatus} type="interest" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge value={row.interviewStatus} type="interview" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge value={row.selectionStatus} type="selection" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge value={row.joiningStatus} type="joining" />
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {row.assignedDate ?? '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Page {page} of {totalPages} · {total} candidates total
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
