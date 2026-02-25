'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSourcedJobRoles } from '@/lib/data'
import type { SourcedJobRole } from '@/lib/data'

export default function SourcingPage() {
  const [roles, setRoles] = useState<SourcedJobRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const data = await getSourcedJobRoles()
        if (!cancelled) setRoles(data)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load sourced job roles')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading && roles.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Sourcing</h1>
        <div className="text-center py-8 text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Sourcing</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sourcing</h1>
      <p className="text-gray-600 mb-6">
        Job roles you have sourced candidates for. Click a job to view sourced candidates.
      </p>
      {roles.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-600">
          No sourced job roles yet. Add candidates to job roles from the Candidates page to see them here.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <Link
              key={role.jobRoleId}
              href={`/sourcing/${role.jobRoleId}`}
              className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-primary-300 hover:shadow"
            >
              <h2 className="font-semibold text-gray-900">{role.jobRoleName}</h2>
              <p className="mt-1 text-sm text-gray-600">{role.companyName}</p>
              {role.department && (
                <p className="mt-0.5 text-sm text-gray-500">{role.department}</p>
              )}
              <p className="mt-3 text-sm font-medium text-primary-600">
                {role.applicationCount} candidate{role.applicationCount !== 1 ? 's' : ''} sourced
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
