'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getApplicationsPage, getSourcedJobRoles, updateApplication } from '@/lib/data'
import type { Application } from '@/types/database'
import ApplicationsTable from '@/components/candidates/ApplicationsTable'

export default function SourcingJobRolePage() {
  const params = useParams()
  const router = useRouter()
  const jobRoleId = params?.jobRoleId as string
  const [applications, setApplications] = useState<Application[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)
  const [jobRoleName, setJobRoleName] = useState<string>('')
  const [companyName, setCompanyName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadApplications = useCallback(async () => {
    if (!jobRoleId) return
    try {
      setLoading(true)
      setError(null)
      const [appsPage, roles] = await Promise.all([
        getApplicationsPage({ job_role_id: jobRoleId, page, limit }),
        getSourcedJobRoles(),
      ])
      setApplications(appsPage.applications)
      setTotal(appsPage.total)
      const role = roles.find((r) => r.jobRoleId === Number(jobRoleId))
      if (role) {
        setJobRoleName(role.jobRoleName)
        setCompanyName(role.companyName)
      } else if (appsPage.applications.length > 0 && appsPage.applications[0].job_role) {
        setJobRoleName(appsPage.applications[0].job_role.job_role || '')
        setCompanyName(appsPage.applications[0].job_role.company?.company_name || '')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load candidates')
    } finally {
      setLoading(false)
    }
  }, [jobRoleId, page, limit])

  useEffect(() => {
    loadApplications()
  }, [loadApplications])

  // Reset to first page when jobRoleId changes
  useEffect(() => {
    setPage(1)
  }, [jobRoleId])

  async function handleUpdate(id: string, updates: Partial<Application>) {
    const { updateApplication: update } = await import('@/lib/data')
    await update(id, updates)
    await loadApplications()
  }

  if (!jobRoleId) {
    router.replace('/sourcing')
    return null
  }

  if (loading && applications.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <Link href="/sourcing" className="text-primary-600 hover:underline text-sm">← Sourcing</Link>
        </div>
        <div className="text-center py-8 text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="mb-6">
          <Link href="/sourcing" className="text-primary-600 hover:underline text-sm">← Sourcing</Link>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>
      </div>
    )
  }

  const title = jobRoleName || `Job role #${jobRoleId}`
  const subtitle = companyName ? `${companyName}` : ''

  return (
    <div>
      <div className="mb-6">
        <Link href="/sourcing" className="text-primary-600 hover:underline text-sm">← Sourcing</Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
      <p className="text-gray-500 text-sm mt-2">
        {total} sourced candidate{total !== 1 ? 's' : ''}
      </p>
      <div className="mt-6">
        <ApplicationsTable
          applications={applications}
          page={page}
          limit={limit}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(nextLimit) => {
            setLimit(nextLimit)
            setPage(1)
          }}
          onUpdate={handleUpdate}
        />
      </div>
    </div>
  )
}
