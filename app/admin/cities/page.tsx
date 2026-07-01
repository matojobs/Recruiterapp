'use client'

import { useEffect, useState } from 'react'
import { PermissionGuard } from '@/components/admin/PermissionGuard'
import {
  createMasterCity,
  getMasterCities,
  updateMasterCity,
  type AdminCity,
} from '@/lib/admin/api'

type FormState = {
  name: string
  state: string
  isActive: boolean
}

const emptyForm: FormState = {
  name: '',
  state: '',
  isActive: true,
}

function messageFromError(error: unknown) {
  const err = error as { response?: { data?: { message?: string | string[] } } }
  const message = err.response?.data?.message
  return Array.isArray(message) ? message.join(', ') : message || 'Request failed'
}

export default function AdminCitiesPage() {
  const [rows, setRows] = useState<AdminCity[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [editing, setEditing] = useState<AdminCity | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const params: { search?: string; isActive?: boolean } = {}
      if (search.trim()) params.search = search.trim()
      if (statusFilter !== 'all') params.isActive = statusFilter === 'active'
      const res = await getMasterCities(params)
      setRows(res.cities || [])
    } catch (err) {
      setError(messageFromError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setError('')
  }

  const openEdit = (row: AdminCity) => {
    setEditing(row)
    setForm({
      name: row.name,
      state: row.state || '',
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
        name: form.name.trim(),
        state: form.state.trim(),
      }
      if (editing) {
        await updateMasterCity(editing.id, { ...payload, isActive: form.isActive })
      } else {
        await createMasterCity(payload)
      }
      openCreate()
      await load()
    } catch (err) {
      setError(messageFromError(err))
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (row: AdminCity) => {
    setError('')
    try {
      await updateMasterCity(row.id, { isActive: !row.isActive })
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
            <h1 className="text-2xl font-semibold text-gray-900">Cities</h1>
            <p className="mt-1 text-sm text-gray-500">Manage the city master used for locations, vacancies, and filters.</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            New City
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          <form onSubmit={submit} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">{editing ? 'Edit city' : 'Add city'}</h2>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">City name</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  maxLength={120}
                  placeholder="Bengaluru"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">State</span>
                <input
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
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
              <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                Deactivate a city to stop showing it for new selections while keeping existing candidate/job history intact.
              </p>
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create City'}
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
              <div className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void load() }}
                  placeholder="Search city or state"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
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
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">City</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">State</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">Loading...</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">No cities found</td></tr>
                  ) : rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{row.name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{row.state || '-'}</td>
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
