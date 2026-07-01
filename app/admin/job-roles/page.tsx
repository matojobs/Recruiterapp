'use client'

import { useEffect, useMemo, useState } from 'react'
import { PermissionGuard } from '@/components/admin/PermissionGuard'
import {
  createMasterJobRole,
  getCompanies,
  getMasterJobRoles,
  updateMasterJobRole,
  type AdminMasterJobRole,
} from '@/lib/admin/api'
import type { AdminCompany } from '@/lib/admin/types'

type FormState = {
  companyId: string
  roleName: string
  department: string
  isActive: boolean
}

const emptyForm: FormState = {
  companyId: '',
  roleName: '',
  department: '',
  isActive: true,
}

function messageFromError(error: unknown) {
  const err = error as { response?: { data?: { message?: string | string[] } } }
  const message = err.response?.data?.message
  return Array.isArray(message) ? message.join(', ') : message || 'Request failed'
}

export default function AdminJobRolesPage() {
  const [rows, setRows] = useState<AdminMasterJobRole[]>([])
  const [companies, setCompanies] = useState<AdminCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [editing, setEditing] = useState<AdminMasterJobRole | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState('')

  const selectedCompanyName = useMemo(() => {
    const found = companies.find((c) => String(c.id) === form.companyId)
    return found?.name || ''
  }, [companies, form.companyId])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const params: { search?: string; companyId?: number; isActive?: boolean } = {}
      if (search.trim()) params.search = search.trim()
      if (companyFilter) params.companyId = Number(companyFilter)
      if (statusFilter !== 'all') params.isActive = statusFilter === 'active'
      const [rolesRes, companiesRes] = await Promise.all([
        getMasterJobRoles(params),
        getCompanies({ limit: 100 }),
      ])
      setRows(rolesRes.jobRoles || [])
      setCompanies(companiesRes.companies || [])
    } catch (err) {
      setError(messageFromError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyFilter, statusFilter])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setError('')
  }

  const openEdit = (row: AdminMasterJobRole) => {
    setEditing(row)
    setForm({
      companyId: String(row.companyId),
      roleName: row.roleName,
      department: row.department || '',
      isActive: row.isActive,
    })
    setError('')
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        companyId: Number(form.companyId),
        roleName: form.roleName.trim(),
        department: form.department.trim(),
        isActive: form.isActive,
      }
      if (editing) {
        await updateMasterJobRole(editing.id, payload)
      } else {
        await createMasterJobRole(payload)
      }
      openCreate()
      await load()
    } catch (err) {
      setError(messageFromError(err))
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (row: AdminMasterJobRole) => {
    setError('')
    try {
      await updateMasterJobRole(row.id, { isActive: !row.isActive })
      await load()
    } catch (err) {
      setError(messageFromError(err))
    }
  }

  return (
    <PermissionGuard permission="view_companies" fallback={<p className="text-amber-600">No permission.</p>}>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Job Roles</h1>
            <p className="mt-1 text-sm text-gray-500">Manage company-specific sourcing roles used by recruiters.</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            New Job Role
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <form onSubmit={submit} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">{editing ? 'Edit job role' : 'Add job role'}</h2>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Company</span>
                <select
                  value={form.companyId}
                  onChange={(e) => setForm((f) => ({ ...f, companyId: e.target.value }))}
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Role name</span>
                <input
                  value={form.roleName}
                  onChange={(e) => setForm((f) => ({ ...f, roleName: e.target.value }))}
                  required
                  maxLength={120}
                  placeholder="Customer Support Executive"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Department</span>
                <input
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                  maxLength={120}
                  placeholder="Optional"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                Active
              </label>
              {selectedCompanyName && (
                <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                  This role will appear under {selectedCompanyName} when recruiters add or edit candidates.
                </p>
              )}
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Role'}
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={openCreate}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>

          <div className="space-y-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="grid gap-3 md:grid-cols-[1fr_220px_160px_auto]">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void load() }}
                  placeholder="Search role or company"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">All companies</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <button type="button" onClick={() => void load()} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">
                  Search
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">Loading...</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">No job roles found</td></tr>
                  ) : rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{row.companyName}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{row.roleName}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{row.department || '-'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${row.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {row.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                        <button type="button" onClick={() => openEdit(row)} className="mr-3 text-indigo-600 hover:text-indigo-800">Edit</button>
                        <button type="button" onClick={() => void toggleActive(row)} className="text-gray-600 hover:text-gray-900">
                          {row.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  )
}
