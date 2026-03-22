'use client'

import { useEffect, useState, useCallback } from 'react'
import { getApplicationsPage, getRecruiters, getCompanies, getJobRoles, getRecruiterTodayProgress, updateApplication } from '@/lib/data'
import { getCurrentUser } from '@/lib/auth-helper'
import type { Application, ApplicationFilters, Recruiter, Company, JobRole, PipelineFlow } from '@/types/database'
import { EMPTY_PIPELINE_FLOW } from '@/types/database'
import { calculateJoinedAge, formatJoinedAge } from '@/lib/utils'
import ApplicationsTable from '@/components/candidates/ApplicationsTable'
import Filters from '@/components/candidates/Filters'
import FlowTracking from '@/components/candidates/FlowTracking'
import AddApplicationModal from '@/components/candidates/AddApplicationModal'
import * as XLSX from 'xlsx'

export default function CandidatesPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [recruiters, setRecruiters] = useState<Recruiter[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [jobRoles, setJobRoles] = useState<JobRole[]>([])
  const [flow, setFlow] = useState<PipelineFlow>(EMPTY_PIPELINE_FLOW)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ApplicationFilters>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true)
      const user = await getCurrentUser()
      const recruiterId = user?.recruiter_id ? String(user.recruiter_id) : undefined

      const [pageResult, flowData] = await Promise.all([
        getApplicationsPage({
          ...filters,
          recruiter_id: recruiterId,
          search: searchQuery.trim() || undefined,
          page,
          limit,
        }),
        getRecruiterTodayProgress(recruiterId),
      ])

      setApplications(pageResult.applications)
      setTotal(pageResult.total)
      setFlow(flowData)
    } catch (error) {
      console.error('Error loading applications:', error)
      setFlow(EMPTY_PIPELINE_FLOW)
    } finally {
      setLoading(false)
    }
  }, [filters, searchQuery, page, limit])

  useEffect(() => {
    loadApplications()
  }, [loadApplications])

  useEffect(() => { setPage(1) }, [filters, searchQuery])

  async function loadData() {
    try {
      const [recs, comps, roles] = await Promise.all([
        getRecruiters(),
        getCompanies(),
        getJobRoles(),
      ])
      setRecruiters(recs)
      setCompanies(comps)
      setJobRoles(roles)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  async function handleUpdate(id: string, updates: Partial<Application>) {
    try {
      await updateApplication(id, updates)
      await loadApplications()
    } catch (error) {
      console.error('Error updating application:', error)
      alert('Failed to update candidate status. Please try again.')
      throw error
    }
  }

  async function handleAddApplication(payload: any) {
    try {
      const { createApplicationWithCandidate } = await import('@/lib/data')
      await createApplicationWithCandidate({
        candidate: payload.candidate,
        application: {
          ...payload.application,
          job_role_id: Number(payload.application.job_role_id),
        },
      })
      await loadApplications()
    } catch (error) {
      console.error('Error creating application with candidate:', error)
      throw error
    }
  }

  function handleExport() {
    const exportData = applications.map((app) => ({
      Portal: app.portal || '',
      'Job Role': app.job_role?.job_role || '',
      Company: (app.job_role as any)?.company?.company_name || '',
      'Assigned Date': app.assigned_date || '',
      'Candidate Age': app.candidate?.age ? `${app.candidate.age} years` : '',
      Recruiter: app.recruiter?.name || '',
      Candidate: app.candidate?.candidate_name || '',
      Phone: app.candidate?.phone || '',
      'Call Date': app.call_date || '',
      'Call Status': app.call_status || '',
      Interested: app.interested_status || '',
      'Interview Scheduled': app.interview_scheduled ? 'Yes' : 'No',
      'Interview Date': app.interview_date || '',
      'Interview Status': app.interview_status || '',
      'Selection Status': app.selection_status || '',
      'Joining Status': app.joining_status || '',
      'Joining Date': app.joining_date || '',
      'Joined Age': app.joining_status === 'Joined' && app.joining_date
        ? formatJoinedAge(calculateJoinedAge(app.joining_date))
        : '',
      'Followup Date': app.followup_date || '',
      Notes: app.notes || '',
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Applications')
    XLSX.writeFile(wb, `candidates_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <div className="space-y-0">
      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Candidates</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and track all your sourcing candidates</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Candidate
        </button>
      </div>

      {/* Today's progress — compact pills, only visible when there's data */}
      <FlowTracking flow={flow} />

      {/* Unified search + filter toolbar */}
      <Filters
        companies={companies}
        jobRoles={jobRoles}
        onFilterChange={setFilters}
        onSearchChange={setSearchQuery}
        onExport={handleExport}
        total={total}
        loading={loading}
      />

      {/* Table (with loading skeleton) */}
      {loading && applications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['', 'Name', 'Phone', 'Company', 'Role', 'Call Status', 'Interested', 'Selection', 'Joining', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(8)].map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-gray-50">
                    {[...Array(10)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className={`h-4 bg-gray-100 rounded ${j === 1 ? 'w-32' : j === 0 ? 'w-12' : 'w-20'}`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <ApplicationsTable
          applications={applications}
          page={page}
          limit={limit}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(nextLimit) => { setLimit(nextLimit); setPage(1) }}
          onUpdate={handleUpdate}
        />
      )}

      <AddApplicationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddApplication}
        recruiters={recruiters}
        companies={companies}
      />
    </div>
  )
}
