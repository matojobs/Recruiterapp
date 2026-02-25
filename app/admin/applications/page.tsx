'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  getApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
} from '@/lib/admin/api'
import type { AdminJobApplication } from '@/lib/admin/types'
import { PermissionGuard, useHasPermission } from '@/components/admin/PermissionGuard'
import { DataTable } from '@/components/admin/DataTable'
import type { Column } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'

const APPLICATION_STATUSES = [
  'pending',
  'reviewing',
  'shortlisted',
  'interview',
  'rejected',
  'accepted',
  'withdrawn',
] as const

function applicationStatusVariant(
  status: string
): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  const s = (status || '').toLowerCase()
  if (['accepted', 'shortlisted'].includes(s)) return 'success'
  if (['pending', 'reviewing'].includes(s)) return 'warning'
  if (['rejected', 'withdrawn'].includes(s)) return 'danger'
  if (s === 'interview') return 'info'
  return 'neutral'
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<AdminJobApplication[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 20
  const [jobId, setJobId] = useState('')
  const [userId, setUserId] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewOpen, setViewOpen] = useState<AdminJobApplication | null>(null)
  const [detailApp, setDetailApp] = useState<AdminJobApplication | null>(null)
  const [editStatusOpen, setEditStatusOpen] = useState<AdminJobApplication | null>(null)
  const [deleteOpen, setDeleteOpen] = useState<{ id: number; candidateName: string } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const canView = useHasPermission('view_applications')
  const canEdit = useHasPermission('edit_applications')
  const canDelete = useHasPermission('delete_applications')

  const load = useCallback(() => {
    setLoading(true)
    getApplications({
      page,
      limit,
      jobId: jobId ? Number(jobId) : undefined,
      userId: userId ? Number(userId) : undefined,
      status: status || undefined,
    })
      .then((res) => {
        setApplications(res.applications ?? [])
        setTotal(res.total ?? 0)
      })
      .catch(() => {
        setApplications([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [page, limit, jobId, userId, status])

  useEffect(() => {
    load()
  }, [load])

  const openView = useCallback((row: AdminJobApplication) => {
    setViewOpen(row)
    setDetailApp(null)
    getApplicationById(row.id)
      .then(setDetailApp)
      .catch(() => setDetailApp(row))
  }, [])

  const cols: Column<AdminJobApplication>[] = [
    { key: 'id', header: 'ID', render: (r) => r.id },
    {
      key: 'candidate',
      header: 'Candidate',
      render: (r) =>
        r.candidateName ?? ([r.user?.firstName, r.user?.lastName].filter(Boolean).join(' ') || `User #${r.userId}`),
    },
    {
      key: 'email',
      header: 'Email',
      render: (r) => r.candidateEmail ?? r.user?.email ?? '—',
    },
    {
      key: 'job',
      header: 'Job',
      render: (r) => r.job?.title ?? '—',
    },
    {
      key: 'company',
      header: 'Company',
      render: (r) => r.job?.company?.name ?? '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <StatusBadge variant={applicationStatusVariant(r.status)}>{r.status || '—'}</StatusBadge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Applied',
      render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'),
    },
    ...(canView || canEdit || canDelete
      ? [
          {
            key: 'actions',
            header: 'Actions',
            render: (r: AdminJobApplication) => (
              <div className="flex flex-wrap gap-2">
                {canView && (
                  <button
                    type="button"
                    onClick={() => openView(r)}
                    className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    View
                  </button>
                )}
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setEditStatusOpen(r)}
                    className="rounded border border-indigo-300 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 dark:border-indigo-600 dark:text-indigo-400"
                  >
                    Edit status
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteOpen({
                        id: r.id,
                        candidateName:
                          r.candidateName ??
                          ([r.user?.firstName, r.user?.lastName].filter(Boolean).join(' ') || `#${r.id}`),
                      })
                    }
                    className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400"
                  >
                    Delete
                  </button>
                )}
              </div>
            ),
          } as Column<AdminJobApplication>,
        ]
      : []),
  ]

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <PermissionGuard permission="view_applications" fallback={<p className="text-amber-600">No permission to view applications.</p>}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Job Applications</h1>
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="number"
            placeholder="Job ID"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <input
            type="number"
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="">All statuses</option>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setPage(1)}
            className="rounded-lg bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200"
          >
            Apply filters
          </button>
        </div>
        <DataTable
          columns={cols}
          data={applications}
          keyExtractor={(r) => r.id}
          loading={loading}
          emptyMessage="No applications found"
        />
        {total > limit && (
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-600"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages} ({total} total)
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-600"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* View detail modal */}
      {viewOpen && (
        <ViewApplicationModal
          application={detailApp ?? viewOpen}
          loading={!detailApp && !!viewOpen}
          onClose={() => {
            setViewOpen(null)
            setDetailApp(null)
          }}
          onEditStatus={canEdit ? () => setEditStatusOpen(viewOpen) : undefined}
          onDelete={canDelete ? () => setDeleteOpen({ id: viewOpen.id, candidateName: viewOpen.candidateName ?? `#${viewOpen.id}` }) : undefined}
        />
      )}

      {/* Edit status modal */}
      {editStatusOpen && (
        <EditStatusModal
          application={editStatusOpen}
          onClose={() => setEditStatusOpen(null)}
          onSuccess={() => {
            setEditStatusOpen(null)
            load()
            if (viewOpen?.id === editStatusOpen.id && detailApp) {
              getApplicationById(editStatusOpen.id).then(setDetailApp).catch(() => {})
            }
          }}
          loading={actionLoading}
          setLoading={setActionLoading}
        />
      )}

      {/* Delete confirm */}
      {deleteOpen && (
        <ConfirmDialog
          open={!!deleteOpen}
          onClose={() => setDeleteOpen(null)}
          onConfirm={async () => {
            if (!deleteOpen) return
            setActionLoading(true)
            try {
              await deleteApplication(deleteOpen.id)
              setDeleteOpen(null)
              setViewOpen(null)
              setDetailApp(null)
              load()
            } catch (err: unknown) {
              const status = err && typeof err === 'object' && 'response' in err
                ? (err as { response?: { status?: number; data?: { message?: string } } }).response?.status
                : null
              const message = err && typeof err === 'object' && 'response' in err
                ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                : null
              if (status === 403) {
                alert('Permission denied.')
              } else {
                alert(message || 'Failed to delete application.')
              }
            } finally {
              setActionLoading(false)
            }
          }}
          title="Delete application"
          description={`Delete application for "${deleteOpen.candidateName}"? This cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          loading={actionLoading}
        />
      )}
    </PermissionGuard>
  )
}

function ViewApplicationModal({
  application,
  loading,
  onClose,
  onEditStatus,
  onDelete,
}: {
  application: AdminJobApplication
  loading: boolean
  onClose: () => void
  onEditStatus?: () => void
  onDelete?: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Application #{application.id}</h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">
            ×
          </button>
        </div>
        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : (
          <div className="space-y-4 text-sm">
            <p><span className="font-medium text-gray-600 dark:text-gray-400">Candidate:</span> {application.candidateName ?? ([application.user?.firstName, application.user?.lastName].filter(Boolean).join(' ') || String(application.userId))}</p>
            <p><span className="font-medium text-gray-600 dark:text-gray-400">Email:</span> {application.candidateEmail ?? application.user?.email ?? '—'}</p>
            <p><span className="font-medium text-gray-600 dark:text-gray-400">Phone:</span> {application.candidatePhone ?? application.user?.phone ?? '—'}</p>
            <p><span className="font-medium text-gray-600 dark:text-gray-400">Job:</span> {application.job?.title ?? '—'}</p>
            <p><span className="font-medium text-gray-600 dark:text-gray-400">Company:</span> {application.job?.company?.name ?? '—'}</p>
            <p><span className="font-medium text-gray-600 dark:text-gray-400">Status:</span> {application.status ?? '—'}</p>
            <p><span className="font-medium text-gray-600 dark:text-gray-400">Applied:</span> {application.createdAt ? new Date(application.createdAt).toLocaleString() : '—'}</p>
            {application.coverLetter && (
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Cover letter:</span>
                <div className="mt-1 rounded border border-gray-200 p-2 dark:border-gray-600 whitespace-pre-wrap">{application.coverLetter}</div>
              </div>
            )}
            {application.resume && (
              <p>
                <span className="font-medium text-gray-600 dark:text-gray-400">Resume:</span>{' '}
                <a href={application.resume} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  Open link
                </a>
              </p>
            )}
          </div>
        )}
        <div className="mt-6 flex gap-2">
          {onEditStatus && (
            <button type="button" onClick={onEditStatus} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Edit status
            </button>
          )}
          {onDelete && (
            <button type="button" onClick={onDelete} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400">
              Delete
            </button>
          )}
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium dark:border-gray-600">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function EditStatusModal({
  application,
  onClose,
  onSuccess,
  loading,
  setLoading,
}: {
  application: AdminJobApplication
  onClose: () => void
  onSuccess: () => void
  loading: boolean
  setLoading: (v: boolean) => void
}) {
  const [status, setStatus] = useState(application.status)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await updateApplicationStatus(application.id, { status })
      onSuccess()
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null
      alert(message || 'Failed to update status.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit application status</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium dark:border-gray-600">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
