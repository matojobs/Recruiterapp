'use client'

import { useEffect, useState } from 'react'
import { getErrorLogs } from '@/lib/admin/api'

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getErrorLogs({ page: 1, limit: 50 })
      .then((res) => setLogs((res as { logs?: unknown[] }).logs || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Error Logs</h1>
      {loading ? <p className="text-gray-500">Loading...</p> : (
        <div className="overflow-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <pre className="p-4 text-xs">{JSON.stringify(logs, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
