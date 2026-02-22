'use client'

import { useEffect, useState, useCallback } from 'react'
import { getCompanies } from '@/lib/admin/api'
import type { AdminCompany } from '@/lib/admin/types'
import { PermissionGuard } from '@/components/admin/PermissionGuard'
import { DataTable } from '@/components/admin/DataTable'
import type { Column } from '@/components/admin/DataTable'
import { StatusBadge, statusToVariant } from '@/components/admin/StatusBadge'

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
  ]

  return (
    <PermissionGuard permission="view_companies" fallback={<p className="text-amber-600">No permission.</p>}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Companies</h1>
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
    </PermissionGuard>
  )
}
