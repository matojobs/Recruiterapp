'use client'

import { useEffect, useState, useCallback } from 'react'
import { getApplications, getRecruiters, getCompanies, getJobRoles, getPipelineFlow, updateApplication } from '@/lib/data'
import type { Application, ApplicationFilters, Recruiter, Company, JobRole, PipelineFlow } from '@/types/database'
import { EMPTY_PIPELINE_FLOW } from '@/types/database'
import { calculateJoinedAge, formatJoinedAge, computePipelineFlowFromApplications } from '@/lib/utils'
import ApplicationsTable from '@/components/candidates/ApplicationsTable'
import Filters from '@/components/candidates/Filters'
import FlowTracking from '@/components/candidates/FlowTracking'
import AddApplicationModal from '@/components/candidates/AddApplicationModal'
import Button from '@/components/ui/Button'
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

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true)
      // Create filters without company_id (will filter client-side)
      const { company_id, ...serverFilters } = filters
      let data = await getApplications(serverFilters)
      
      // Filter by company_id client-side if provided
      if (company_id) {
        data = data.filter((app) => app.job_role?.company?.id === company_id)
      }
      
      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        data = data.filter((app) => {
          const candidateName = app.candidate?.candidate_name?.toLowerCase() || ''
          const phone = app.candidate?.phone?.toLowerCase() || ''
          const email = app.candidate?.email?.toLowerCase() || ''
          const jobRole = app.job_role?.job_role?.toLowerCase() || ''
          const company = app.job_role?.company?.company_name?.toLowerCase() || ''
          const portal = app.portal?.toLowerCase() || ''
          
          return (
            candidateName.includes(query) ||
            phone.includes(query) ||
            email.includes(query) ||
            jobRole.includes(query) ||
            company.includes(query) ||
            portal.includes(query)
          )
        })
      }
      
      setApplications(data)
    } catch (error) {
      console.error('Error loading applications:', error)
    } finally {
      setLoading(false)
    }
  }, [filters, searchQuery])

  const loadFlow = useCallback(async () => {
    try {
      // Create filters without company_id (will calculate client-side)
      const { company_id, ...serverFilters } = filters
      let flowData = await getPipelineFlow(serverFilters)
      
      // If company_id filter is active, recalculate flow from current applications
      if (company_id) {
        const filteredApps = applications.filter((app) => app.job_role?.company?.id === company_id)
        if (filteredApps.length > 0) {
          flowData = computePipelineFlowFromApplications(filteredApps)
        }
      }
      
      setFlow(flowData)
    } catch (error) {
      console.error('Error loading flow:', error)
    }
  }, [filters, applications])

  useEffect(() => {
    loadApplications()
  }, [loadApplications])

  useEffect(() => {
    if (applications.length > 0 || Object.keys(filters).length === 0) {
      loadFlow()
    }
  }, [loadFlow, applications.length, filters])

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
      const { updateApplication } = await import('@/lib/data')
      await updateApplication(id, updates)
      // Reload applications and flow immediately
      await Promise.all([
        loadApplications(),
        loadFlow(),
      ])
    } catch (error) {
      console.error('Error updating application:', error)
      alert('Failed to update candidate status. Please try again.')
      throw error // Re-throw so the table can handle it
    }
  }

  async function handleAddApplication(applicationData: any) {
    try {
      const { createApplication } = await import('@/lib/data')
      await createApplication(applicationData)
      await loadApplications()
      // Flow will update automatically via useEffect
    } catch (error) {
      console.error('Error creating application:', error)
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
    XLSX.writeFile(wb, `applications_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  if (loading && applications.length === 0) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
        <Button onClick={() => setShowAddModal(true)}>+ Add Candidate</Button>
      </div>

      <AddApplicationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddApplication}
        recruiters={recruiters}
        companies={companies}
      />

      <FlowTracking flow={flow} />

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search candidates by name, phone, email, job role, company, or portal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Clear
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-500 mt-2">
            Found {applications.length} candidate{applications.length !== 1 ? 's' : ''} matching &quot;{searchQuery}&quot;
          </p>
        )}
      </div>

      <ApplicationsTable applications={applications} onUpdate={handleUpdate} />

      <Filters
        recruiters={recruiters}
        companies={companies}
        jobRoles={jobRoles}
        onFilterChange={setFilters}
        onExport={handleExport}
      />
    </div>
  )
}
