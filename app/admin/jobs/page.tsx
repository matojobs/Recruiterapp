'use client'

import { useEffect, useState, useCallback } from 'react'
import { getJobs, updateJobStatus, deleteJob, bulkJobAction } from '@/lib/admin/api'
import type { AdminJob } from '@/lib/admin/types'
import { PermissionGuard, useHasPermission } from '@/components/admin/PermissionGuard'
import { DataTable } from '@/components/admin/DataTable'
import type { Column } from '@/components/admin/DataTable'
import { StatusBadge, statusToVariant } from '@/components/admin/StatusBadge'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'

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
  const [statusOpen, setStatusOpen] = useState<AdminJob | null>(null)
  const [deleteOpen, setDeleteOpen] = useState<{ id: number; title: string } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const canEdit = useHasPermission('edit_jobs')
  const canDelete = useHasPermission('delete_jobs')
  const canBulk = useHasPermission('bulk_operations')

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
    ...(canBulk
      ? [
          {
            key: 'select',
            header: '',
            render: (r: AdminJob) => (
              <input
                type="checkbox"
                checked={selectedIds.has(r.id)}
                onChange={(e) => {
                  setSelectedIds((prev) => {
                    const next = new Set(prev)
                    if (e.target.checked) next.add(r.id)
                    else next.delete(r.id)
                    return next
                  })
                }}
                className="rounded border-gray-300"
              />
            ),
          } as Column<AdminJob>,
        ]
      : []),
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
    ...((canEdit || canDelete)
      ? [
          {
            key: 'actions',
            header: 'Actions',
            render: (r: AdminJob) => (
              <div className="flex flex-wrap gap-2">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setStatusOpen(r)}
                    className="rounded border border-indigo-300 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 dark:border-indigo-600 dark:text-indigo-400"
                  >
                    Status
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => setDeleteOpen({ id: r.id, title: r.title })}
                    className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400"
                  >
                    Delete
                  </button>
                )}
              </div>
            ),
          } as Column<AdminJob>,
        ]
      : []),
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Jobs</h1>
        {canBulk && selectedIds.size > 0 && (
          <button
            type="button"
            onClick={() => setBulkOpen(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Bulk action ({selectedIds.size} selected)
          </button>
        )}
      </div>
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

      {statusOpen && (
        <JobStatusModal
          job={statusOpen}
          onClose={() => setStatusOpen(null)}
          onSuccess={() => {
            setStatusOpen(null)
            load()
          }}
        />
      )}

      {deleteOpen && (
        <ConfirmDialog
          open={!!deleteOpen}
          onClose={() => setDeleteOpen(null)}
          onConfirm={async () => {
            if (!deleteOpen) return
            setActionLoading(true)
            await deleteJob(deleteOpen.id)
            setActionLoading(false)
            setDeleteOpen(null)
            load()
          }}
          title="Delete job"
          description={`Delete "${deleteOpen.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          loading={actionLoading}
        />
      )}

      {bulkOpen && selectedIds.size > 0 && (
        <BulkJobActionModal
          jobIds={Array.from(selectedIds)}
          onClose={() => {
            setBulkOpen(false)
            setSelectedIds(new Set())
          }}
          onSuccess={() => {
            setBulkOpen(false)
            setSelectedIds(new Set())
            load()
          }}
        />
      )}
    </div>
  )
}

function JobStatusModal({ job, onClose, onSuccess }: { job: AdminJob; onClose: () => void; onSuccess: () => void }) {
  const [status, setStatus] = useState((job.status || job.adminStatus) as string || 'draft')
  const [adminNotes, setAdminNotes] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await updateJobStatus(job.id, { status, adminNotes: adminNotes.trim() || undefined })
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-gray-800">
        <h2 className="text-lg font-semibold">Update job status</h2>
        <p className="text-sm text-gray-500 mt-1">{job.title}</p>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
            <option value="pending">Pending (admin)</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
          <textarea placeholder="Admin notes" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2">Cancel</button>
            <button type="submit" disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-50">Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BulkJobActionModal({
  jobIds,
  onClose,
  onSuccess,
}: { jobIds: number[]; onClose: () => void; onSuccess: () => void }) {
  const [action, setAction] = useState('approve')
  const [adminNotes, setAdminNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ processed: number; failed: number; errors: unknown[] } | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const res = await bulkJobAction({ action, jobIds, adminNotes: adminNotes.trim() || undefined })
      setResult({ processed: res.processed, failed: res.failed, errors: res.errors })
      if (res.failed === 0) setTimeout(onSuccess, 1500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-gray-800">
        <h2 className="text-lg font-semibold">Bulk job action</h2>
        <p className="text-sm text-gray-500 mt-1">{jobIds.length} job(s) selected</p>
        {result != null && (
          <div className="mt-3 rounded-lg bg-gray-100 p-3 text-sm dark:bg-gray-700">
            Processed: {result.processed}, Failed: {result.failed}
            {result.errors.length > 0 && <pre className="mt-2 text-xs">{JSON.stringify(result.errors)}</pre>}
          </div>
        )}
        <form onSubmit={submit} className="mt-4 space-y-3">
          <select value={action} onChange={(e) => setAction(e.target.value)} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
            <option value="suspend">Suspend</option>
            <option value="pause">Pause</option>
            <option value="close">Close</option>
            <option value="activate">Activate</option>
          </select>
          <textarea placeholder="Admin notes" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2">Cancel</button>
            <button type="submit" disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-50">
              {loading ? 'Applying...' : 'Apply'}
            </button>
          </div>
        </form>
      </div>
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
