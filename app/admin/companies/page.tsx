'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  updateCompanyStatus,
  verifyCompany,
} from '@/lib/admin/api'
import type { AdminCompany } from '@/lib/admin/types'
import { PermissionGuard, useHasPermission } from '@/components/admin/PermissionGuard'
import { DataTable } from '@/components/admin/DataTable'
import type { Column } from '@/components/admin/DataTable'
import { StatusBadge, statusToVariant } from '@/components/admin/StatusBadge'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import LocationDropdown from '@/components/ui/LocationDropdown'

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<AdminCompany[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 20
  const [search, setSearch] = useState('')
  const [adminStatus, setAdminStatus] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState<AdminCompany | null>(null)
  const [deleteOpen, setDeleteOpen] = useState<{ id: number; name: string } | null>(null)
  const [statusOpen, setStatusOpen] = useState<AdminCompany | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const canCreate = useHasPermission('create_companies')
  const canEdit = useHasPermission('edit_companies')
  const canDelete = useHasPermission('delete_companies')
  const canVerify = useHasPermission('verify_companies')

  const load = useCallback(() => {
    setLoading(true)
    getCompanies({ page, limit, search: search || undefined, adminStatus: adminStatus || undefined, sortBy, sortOrder })
      .then((res) => {
        setCompanies(res.companies ?? [])
        setTotal(res.total ?? 0)
      })
      .catch(() => {
        setCompanies([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [page, limit, search, adminStatus, sortBy, sortOrder])

  useEffect(() => {
    load()
  }, [load])

  const cols: Column<AdminCompany>[] = [
    { key: 'id', header: 'ID', render: (r) => r.id },
    { key: 'name', header: 'Company name', render: (r) => r.name },
    { key: 'adminStatus', header: 'Status', render: (r) => <StatusBadge variant={statusToVariant((r.adminStatus || r.status) || '')}>{(r.adminStatus || r.status) || 'N/A'}</StatusBadge> },
    { key: 'isVerified', header: 'Verified', render: (r) => (r.isVerified ? 'Yes' : 'No') },
    { key: 'createdAt', header: 'Created', render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-') },
    ...((canEdit || canDelete || canVerify)
      ? [
          {
            key: 'actions',
            header: 'Actions',
            render: (r: AdminCompany) => (
              <div className="flex flex-wrap gap-2">
                {canEdit && (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditOpen(r)}
                      className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusOpen(r)}
                      className="rounded border border-indigo-300 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 dark:border-indigo-600 dark:text-indigo-400"
                    >
                      Status
                    </button>
                  </>
                )}
                {canVerify && (
                  <button
                    type="button"
                    onClick={async () => {
                      setActionLoading(true)
                      await verifyCompany(r.id)
                      setActionLoading(false)
                      load()
                    }}
                    disabled={actionLoading}
                    className="rounded border border-green-300 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 dark:border-green-600 dark:text-green-400 disabled:opacity-50"
                  >
                    Verify
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => setDeleteOpen({ id: r.id, name: r.name })}
                    className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400"
                  >
                    Delete
                  </button>
                )}
              </div>
            ),
          } as Column<AdminCompany>,
        ]
      : []),
  ]

  return (
    <PermissionGuard permission="view_companies" fallback={<p className="text-amber-600">No permission.</p>}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Companies</h1>
          {canCreate && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Create Company
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="text"
            placeholder="Search name, slug, industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <select
            value={adminStatus}
            onChange={(e) => setAdminStatus(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
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
        <DataTable columns={cols} data={companies} keyExtractor={(r) => r.id} loading={loading} emptyMessage="No data" />
        {total > limit && (
          <div className="flex justify-between">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded border px-3 py-1 disabled:opacity-50">Previous</button>
            <span className="text-sm text-gray-600">Page {page}</span>
            <button type="button" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage((p) => p + 1)} className="rounded border px-3 py-1 disabled:opacity-50">Next</button>
          </div>
        )}
      </div>

      {createOpen && (
        <CreateCompanyModal
          onClose={() => setCreateOpen(false)}
          onSuccess={() => {
            setCreateOpen(false)
            load()
          }}
        />
      )}

      {editOpen && (
        <EditCompanyModal
          company={editOpen}
          onClose={() => setEditOpen(null)}
          onSuccess={() => {
            setEditOpen(null)
            load()
          }}
        />
      )}

      {statusOpen && (
        <CompanyStatusModal
          company={statusOpen}
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
            try {
              await deleteCompany(deleteOpen.id)
              setDeleteOpen(null)
              load()
            } catch (err: unknown) {
              const status = err && typeof err === 'object' && 'response' in err
                ? (err as { response?: { status?: number; data?: { message?: string } } }).response?.status
                : null
              const message = err && typeof err === 'object' && 'response' in err
                ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                : null
              if (status === 403) {
                alert('Permission denied. You may not have permission to delete companies.')
              } else if (status === 400 && message) {
                alert(message)
              } else {
                alert(message || 'Failed to delete company. Please try again.')
              }
            } finally {
              setActionLoading(false)
            }
          }}
          title="Delete company"
          description={`Delete "${deleteOpen.name}"? This cannot be undone. Company must have no jobs.`}
          confirmLabel="Delete"
          variant="danger"
          loading={actionLoading}
        />
      )}
    </PermissionGuard>
  )
}

function CreateCompanyModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    userId: '',
    name: '',
    slug: '',
    description: '',
    website: '',
    industry: '',
    size: 'medium',
    location: '',
    foundedYear: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const uid = parseInt(form.userId, 10)
    if (!form.name.trim() || !form.userId || isNaN(uid)) {
      setError('User ID and Company name are required.')
      return
    }
    setLoading(true)
    try {
      await createCompany({
        userId: uid,
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim() || undefined,
        website: form.website.trim() || undefined,
        industry: form.industry.trim() || undefined,
        size: form.size || undefined,
        location: form.location.trim() || undefined,
        foundedYear: form.foundedYear ? parseInt(form.foundedYear, 10) : undefined,
      })
      onSuccess()
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Failed to create company'
      setError(String(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold">Create Company</h2>
        <form onSubmit={submit} className="mt-4 space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <input
            required
            placeholder="Owner User ID *"
            type="number"
            min={1}
            value={form.userId}
            onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
            className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <input
            required
            placeholder="Company name *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <input placeholder="Slug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          <input placeholder="Website" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          <input placeholder="Industry" value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          <select value={form.size} onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
            <option value="startup">Startup</option>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <LocationDropdown placeholder="Search city..." value={form.location} onChange={(location) => setForm((f) => ({ ...f, location }))} />
          <input placeholder="Founded year" type="number" value={form.foundedYear} onChange={(e) => setForm((f) => ({ ...f, foundedYear: e.target.value }))} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2">Cancel</button>
            <button type="submit" disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-50">Create</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditCompanyModal({ company, onClose, onSuccess }: { company: AdminCompany; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: (company.name as string) || '',
    description: (company.description as string) || '',
    website: (company.website as string) || '',
    industry: (company.industry as string) || '',
    size: (company.size as string) || 'medium',
    location: (company.location as string) || '',
    foundedYear: company.foundedYear != null ? String(company.foundedYear) : '',
    adminNotes: (company.adminNotes as string) || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await updateCompany(company.id, {
        name: form.name.trim() || undefined,
        description: form.description.trim() || undefined,
        website: form.website.trim() || undefined,
        industry: form.industry.trim() || undefined,
        size: form.size || undefined,
        location: form.location.trim() || undefined,
        foundedYear: form.foundedYear ? parseInt(form.foundedYear, 10) : undefined,
        adminNotes: form.adminNotes.trim() || undefined,
      })
      onSuccess()
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Failed to update company'
      setError(String(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold">Edit Company</h2>
        <form onSubmit={submit} className="mt-4 space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <input placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          <input placeholder="Website" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          <input placeholder="Industry" value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          <select value={form.size} onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
            <option value="startup">Startup</option>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <LocationDropdown placeholder="Search city..." value={form.location} onChange={(location) => setForm((f) => ({ ...f, location }))} />
          <input placeholder="Founded year" type="number" value={form.foundedYear} onChange={(e) => setForm((f) => ({ ...f, foundedYear: e.target.value }))} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          <textarea placeholder="Admin notes" value={form.adminNotes} onChange={(e) => setForm((f) => ({ ...f, adminNotes: e.target.value }))} rows={2} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2">Cancel</button>
            <button type="submit" disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-50">Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CompanyStatusModal({ company, onClose, onSuccess }: { company: AdminCompany; onClose: () => void; onSuccess: () => void }) {
  const [status, setStatus] = useState((company.adminStatus || company.status) as string || 'pending')
  const [adminNotes, setAdminNotes] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await updateCompanyStatus(company.id, { status, adminNotes: adminNotes.trim() || undefined })
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-gray-800">
        <h2 className="text-lg font-semibold">Update company status</h2>
        <p className="text-sm text-gray-500 mt-1">{company.name}</p>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
            <option value="pending">Pending</option>
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
