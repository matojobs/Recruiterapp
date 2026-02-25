'use client'

import { useEffect, useState, useCallback } from 'react'
import { getUsers, createUser, updateUser, deleteUser, verifyUser, suspendUser } from '@/lib/admin/api'
import type { AdminUser, AdminUserRole } from '@/lib/admin/types'
import { PermissionGuard, useHasPermission } from '@/components/admin/PermissionGuard'
import { DataTable } from '@/components/admin/DataTable'
import type { Column } from '@/components/admin/DataTable'
import { StatusBadge, statusToVariant } from '@/components/admin/StatusBadge'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import LocationDropdown from '@/components/ui/LocationDropdown'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [suspendOpen, setSuspendOpen] = useState<{ id: number; name: string } | null>(null)
  const [deleteOpen, setDeleteOpen] = useState<{ id: number; name: string } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const canCreate = useHasPermission('create_users')
  const canEdit = useHasPermission('edit_users')
  const canDelete = useHasPermission('delete_users')
  const canVerify = useHasPermission('verify_users')
  const canSuspend = useHasPermission('suspend_users')
  const [editOpen, setEditOpen] = useState<AdminUser | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    getUsers({ page, limit, search: search || undefined, role: role || undefined, status: status || undefined, sortBy, sortOrder })
      .then((res) => {
        setUsers(res.users ?? [])
        setTotal(res.total ?? 0)
      })
      .catch(() => {
        setUsers([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [page, limit, search, role, status, sortBy, sortOrder])

  useEffect(() => {
    load()
  }, [load])

  const columns: Column<AdminUser>[] = [
    { key: 'id', header: 'ID', render: (r) => r.id },
    {
      key: 'name',
      header: 'Name',
      render: (r) => `${r.firstName || ''} ${r.lastName || ''}`.trim() || '-',
    },
    { key: 'email', header: 'Email', render: (r) => r.email },
    { key: 'role', header: 'Role', render: (r) => r.role },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge variant={statusToVariant(r.status)}>{r.status || (r.isActive ? 'active' : 'inactive')}</StatusBadge>,
    },
    {
      key: 'company',
      header: 'Company',
      render: (r) => (r.company?.name ?? '-'),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'),
    },
    ...((canEdit || canDelete || canVerify || canSuspend)
      ? [
          {
            key: 'actions',
            header: 'Actions',
            render: (r: AdminUser) => (
              <div className="flex flex-wrap gap-2">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setEditOpen(r)}
                    className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => setDeleteOpen({ id: r.id, name: `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.email })}
                    className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Delete
                  </button>
                )}
                {canVerify && (
                  <button
                    type="button"
                    onClick={async () => {
                      setActionLoading(true)
                      await verifyUser(r.id)
                      setActionLoading(false)
                      load()
                    }}
                    disabled={actionLoading}
                    className="rounded border border-green-300 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/20 disabled:opacity-50"
                  >
                    Verify
                  </button>
                )}
                {canSuspend && (
                  <button
                    type="button"
                    onClick={() => setSuspendOpen({ id: r.id, name: `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.email })}
                    className="rounded border border-amber-300 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-900/20"
                  >
                    Suspend
                  </button>
                )}
              </div>
            ),
          } as Column<AdminUser>,
        ]
      : []),
  ]

  return (
    <PermissionGuard
      permission="view_users"
      fallback={
        <div className="rounded-lg bg-amber-50 p-4 text-amber-800">
          You do not have permission to view users.
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
          {canCreate && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Create User
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          <input
            type="search"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="">All roles</option>
            <option value="job_seeker">Job Seeker</option>
            <option value="employer">Employer</option>
            <option value="recruiter">Recruiter</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <DataTable<AdminUser>
          columns={columns}
          data={users}
          keyExtractor={(r) => r.id}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={(key) => {
            setSortBy(key)
            setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
          }}
          emptyMessage="No users found"
        />

        {total > limit && (
          <div className="flex justify-between">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded border px-3 py-1 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {Math.ceil(total / limit)}
            </span>
            <button
              type="button"
              disabled={page >= Math.ceil(total / limit)}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border px-3 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {createOpen && (
        <CreateUserModal
          onClose={() => setCreateOpen(false)}
          onSuccess={() => {
            setCreateOpen(false)
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
            await deleteUser(deleteOpen.id)
            setActionLoading(false)
            setDeleteOpen(null)
            load()
          }}
          title="Delete user"
          description={`Delete ${deleteOpen.name}? This cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          loading={actionLoading}
        />
      )}

      {suspendOpen && (
        <ConfirmDialog
          open={!!suspendOpen}
          onClose={() => setSuspendOpen(null)}
          onConfirm={async () => {
            if (!suspendOpen) return
            setActionLoading(true)
            await suspendUser(suspendOpen.id, { reason: 'Suspended from admin panel' })
            setActionLoading(false)
            setSuspendOpen(null)
            load()
          }}
          title="Suspend user"
          description={`Suspend ${suspendOpen.name}?`}
          confirmLabel="Suspend"
          variant="danger"
          loading={actionLoading}
        />
      )}

      {editOpen && (
        <EditUserModal
          user={editOpen}
          onClose={() => setEditOpen(null)}
          onSuccess={() => {
            setEditOpen(null)
            load()
          }}
        />
      )}
    </PermissionGuard>
  )
}

function EditUserModal({ user, onClose, onSuccess }: { user: AdminUser; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    role: user.role || 'recruiter',
    isActive: user.isActive ?? true,
    isVerified: user.isVerified ?? false,
    canPostForAnyCompany: user.canPostForAnyCompany ?? false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await updateUser(user.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        role: form.role,
        isActive: form.isActive,
        isVerified: form.isVerified,
        canPostForAnyCompany: form.canPostForAnyCompany,
      })
      onSuccess()
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Failed to update user'
      setError(String(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-gray-800">
        <h2 className="text-lg font-semibold">Edit User</h2>
        <form onSubmit={submit} className="mt-4 space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <input
            placeholder="First name"
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <input
            placeholder="Last name"
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <input
            required
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as AdminUserRole }))}
            className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="job_seeker">Job Seeker</option>
            <option value="employer">Employer</option>
            <option value="recruiter">Recruiter</option>
            <option value="admin">Admin</option>
          </select>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Active</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isVerified}
              onChange={(e) => setForm((f) => ({ ...f, isVerified: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Verified</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.canPostForAnyCompany}
              onChange={(e) => setForm((f) => ({ ...f, canPostForAnyCompany: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Can post jobs for any company on job portal</span>
          </label>
          {form.role === 'recruiter' && (
            <p className="text-xs text-gray-500 dark:text-gray-400">When enabled, this recruiter will see all companies in the job portal and can post/manage jobs for any company.</p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 dark:border-gray-600">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-50">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CreateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'recruiter',
    phone: '',
    location: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await createUser({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        role: form.role,
        phone: form.phone || undefined,
        location: form.location || undefined,
      })
      onSuccess()
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Failed to create user'
      setError(String(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-gray-800">
        <h2 className="text-lg font-semibold">Create User</h2>
        {form.role === 'recruiter' && (
          <p className="mt-1 text-xs text-gray-500">Creating a recruiter also creates a sourcing.recruiters row.</p>
        )}
        <form onSubmit={submit} className="mt-4 space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <input
            required
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full rounded-lg border px-3 py-2"
          />
          <input
            required
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="w-full rounded-lg border px-3 py-2"
          />
          <input
            placeholder="First name"
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            className="w-full rounded-lg border px-3 py-2"
          />
          <input
            placeholder="Last name"
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            className="w-full rounded-lg border px-3 py-2"
          />
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as AdminUserRole }))}
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="job_seeker">Job Seeker</option>
            <option value="employer">Employer</option>
            <option value="recruiter">Recruiter</option>
            <option value="admin">Admin</option>
          </select>
          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="w-full rounded-lg border px-3 py-2"
          />
          <LocationDropdown
            placeholder="Search city..."
            value={form.location}
            onChange={(location) => setForm((f) => ({ ...f, location }))}
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-50">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
