'use client'

import { useEffect, useState } from 'react'
import { getActivityLogs, exportActivityLogs } from '@/lib/admin/api'
import { PermissionGuard, useHasPermission } from '@/components/admin/PermissionGuard'
import { DataTable } from '@/components/admin/DataTable'
import type { Column } from '@/components/admin/DataTable'

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const canExport = useHasPermission('export_data')

  useEffect(() => {
    getActivityLogs({ page: 1, limit: 50 })
      .then((res) => {
        const data = (res as { data?: unknown[] }).data ?? (res as { logs?: unknown[] }).logs ?? []
        setLogs(Array.isArray(data) ? (data as Record<string, unknown>[]) : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleExport = async () => {
    try {
      const blob = await exportActivityLogs() as Blob
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'activity-logs.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // ignore
    }
  }

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'action', header: 'Action', render: (r) => String(r.action ?? '-') },
    { key: 'entity', header: 'Entity', render: (r) => String(r.entity ?? '-') },
    {
      key: 'adminUser',
      header: 'Admin',
      render: (r) => {
        const u = r.adminUser as { email?: string } | undefined
        return u?.email ?? '-'
      },
    },
    {
      key: 'date',
      header: 'Date',
      render: (r) => (r.date ? new Date(String(r.date)).toLocaleString() : '-'),
    },
    {
      key: 'metadata',
      header: 'Metadata',
      render: (r) => (r.metadata ? JSON.stringify(r.metadata) : '-'),
    },
  ]

  return (
    <PermissionGuard permission="view_logs" fallback={<p className="text-amber-600">No permission.</p>}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Logs</h1>
          {canExport && (
            <button
              type="button"
              onClick={handleExport}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Export
            </button>
          )}
        </div>
        <DataTable
          columns={columns}
          data={logs}
          keyExtractor={(r) => String(r.id ?? Math.random())}
          loading={loading}
          emptyMessage="No activity logs"
        />
      </div>
    </PermissionGuard>
  )
}
