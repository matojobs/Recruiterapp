'use client'

import { useEffect, useState, useCallback } from 'react'
import { getJobs } from '@/lib/admin/api'
import type { AdminJob } from '@/lib/admin/types'
import { PermissionGuard } from '@/components/admin/PermissionGuard'
import { DataTable } from '@/components/admin/DataTable'
import type { Column } from '@/components/admin/DataTable'
import { StatusBadge, statusToVariant } from '@/components/admin/StatusBadge'

function JobsContent() {
  const [jobs, setJobs] = useState<AdminJob[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [adminStatus, setAdminStatus] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    getJobs({
      page,
      limit,
      search: search || undefined,
      status: status || undefined,
      adminStatus: adminStatus || undefined,
      companyId: companyId ? parseInt(companyId, 10) : undefined,
      sortBy,
      sortOrder,
    })
      .then((res) => {
        setJobs(res.jobs ?? [])
        setTotal(res.total ?? 0)
      })
      .catch(() => {
        setJobs([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [page, limit, search, status, adminStatus, companyId, sortBy, sortOrder])

  useEffect(() => {
    load()
  }, [load])

  const columns: Column<AdminJob>[] = [
    { key: 'id', header: 'ID', render: (r) => r.id },
    { key: 'title', header: 'Title', render: (r) => r.title },
    { key: 'company', header: 'Company', render: (r) => (r.company?.name ?? '-') },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge variant={statusToVariant((r.status || r.adminStatus) || '')}>{(r.status || r.adminStatus) || 'N/A'}</StatusBadge>,
    },
    {
      key: 'postedDate',
      header: 'Posted',
      render: (r) => (r.postedDate || r.createdAt ? new Date((r.postedDate || r.createdAt) as string).toLocaleDateString() : '-'),
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Jobs</h1>
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Search title, slug, category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">All job status</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={adminStatus}
          onChange={(e) => setAdminStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">All admin status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>
        <input
          type="number"
          placeholder="Company ID"
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          min={1}
          className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [s, o] = e.target.value.split('-') as [string, 'asc' | 'desc']
            setSortBy(s)
            setSortOrder(o)
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="created_at-desc">Newest first</option>
          <option value="created_at-asc">Oldest first</option>
          <option value="updated_at-desc">Updated (newest)</option>
          <option value="updated_at-asc">Updated (oldest)</option>
        </select>
      </div>
      <DataTable columns={columns} data={jobs} keyExtractor={(r) => r.id} loading={loading} emptyMessage="No jobs" />
      {total > limit && (
        <div className="flex justify-between">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded border px-3 py-1 disabled:opacity-50">
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {page}</span>
          <button type="button" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage((p) => p + 1)} className="rounded border px-3 py-1 disabled:opacity-50">
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default function AdminJobsPage() {
  return (
    <PermissionGuard permission="view_jobs" fallback={<p className="text-amber-600">No permission.</p>}>
      <JobsContent />
    </PermissionGuard>
  )
}
