'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  getPendingJobApplications,
} from '@/lib/data'
import type { PendingJobApplication } from '@/lib/data'
import RecruiterCallModal from '@/components/applications/RecruiterCallModal'

function formatDate(s: string | undefined | null): string {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  return d.toLocaleDateString()
}

export default function PendingApplicationsPage() {
  const [list, setList] = useState<PendingJobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedApplication, setSelectedApplication] = useState<PendingJobApplication | null>(null)

  const loadList = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getPendingJobApplications()
      setList(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pending applications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadList()
  }, [loadList])

  function openModal(app: PendingJobApplication) {
    setSelectedId(app.id)
    setSelectedApplication(app)
  }

  function closeModal() {
    setSelectedId(null)
    setSelectedApplication(null)
  }

  if (loading && list.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Pending Applications</h1>
        <div className="text-center py-8 text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Pending Applications</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pending Applications</h1>
      <p className="text-gray-600 mb-6">
        Job portal applications waiting for call date, call status, and interest. Click a row to fill and submit.
      </p>
      {list.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-600">
          No pending applications. New applications from the job portal will appear here until you submit call details.
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {list.map((app) => {
                const name =
                  app.user &&
                  [app.user.firstName, app.user.lastName].filter(Boolean).join(' ')
                const p1 = app.user?.phone
                const p2 = app.user?.profile?.phone
                const phoneDisplay =
                  p1 && p2 && p1 !== p2 ? `${p1} / ${p2}` : p1 || p2 || '—'
                return (
                  <tr
                    key={app.id}
                    onClick={() => openModal(app)}
                    className="bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900">{name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{phoneDisplay}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{app.job?.title ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{app.job?.company?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(app.appliedAt ?? app.createdAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <RecruiterCallModal
        applicationId={selectedId}
        initialApplication={selectedApplication}
        isOpen={selectedId != null}
        onClose={closeModal}
        onSuccess={loadList}
      />
    </div>
  )
}
