'use client'

import { useState, useEffect } from 'react'
import { getCompanies, getCompanyById, createCandidate } from '@/lib/data'
import type { Recruiter, Company, JobRole, Candidate } from '@/types/database'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

interface AddApplicationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
  recruiters: Recruiter[]
  companies?: Company[] // Optional - will fetch from API if not provided
}

export default function AddApplicationModal({
  isOpen,
  onClose,
  onSave,
  recruiters,
  companies: propCompanies,
}: AddApplicationModalProps) {
  const [companies, setCompanies] = useState<Company[]>(propCompanies || [])
  /** Job roles for the selected company only (from API GET company by id) */
  const [companyJobRoles, setCompanyJobRoles] = useState<JobRole[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [loadingJobRoles, setLoadingJobRoles] = useState(false)
  const [formData, setFormData] = useState({
    // Candidate fields
    candidate_name: '',
    phone: '',
    email: '',
    qualification: '',
    age: '',
    location: '',
    work_exp_years: '',
    current_ctc: '',
    // Application fields
    portal: '',
    job_role_id: '',
    company_id: '',
    assigned_date: '',
    call_date: '',
    call_status: '',
    interested_status: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)

  // Fetch companies from API when modal opens (no recruiter job-roles list)
  useEffect(() => {
    if (isOpen) {
      async function loadCompanies() {
        try {
          setLoadingCompanies(true)
          const companiesData = await getCompanies()
          setCompanies(companiesData)
        } catch (error) {
          console.error('Error loading companies:', error)
          if (propCompanies?.length) setCompanies(propCompanies)
        } finally {
          setLoadingCompanies(false)
        }
      }
      loadCompanies()
    } else {
      setCompanies(propCompanies || [])
      setCompanyJobRoles([])
    }
  }, [isOpen, propCompanies])

  // When user selects a company, fetch its related job roles from API (GET company by id)
  useEffect(() => {
    if (!formData.company_id) {
      setCompanyJobRoles([])
      return
    }
    let cancelled = false
    async function loadJobRolesForCompany() {
      try {
        setLoadingJobRoles(true)
        const { jobRoles: roles } = await getCompanyById(formData.company_id)
        if (!cancelled) setCompanyJobRoles(roles)
      } catch (error) {
        console.error('Error loading job roles for company:', error)
        if (!cancelled) setCompanyJobRoles([])
      } finally {
        if (!cancelled) setLoadingJobRoles(false)
      }
    }
    loadJobRolesForCompany()
    return () => { cancelled = true }
  }, [formData.company_id])

  useEffect(() => {
    if (isOpen) {
      // Initialize form when modal opens
      setFormData({
        candidate_name: '',
        phone: '',
        email: '',
        qualification: '',
        age: '',
        location: '',
        work_exp_years: '',
        current_ctc: '',
        portal: '',
        job_role_id: '',
        company_id: '',
        assigned_date: new Date().toISOString().split('T')[0],
        call_date: '',
        call_status: '',
        interested_status: '',
        notes: '',
      })
      setCompanyJobRoles([])
    }
  }, [isOpen])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // First create candidate via API
      const candidate = await createCandidate({
        candidate_name: formData.candidate_name,
        phone: formData.phone || null,
        email: formData.email || null,
        qualification: formData.qualification || null,
        age: formData.age ? parseInt(formData.age) : null,
        location: formData.location || null,
        work_exp_years: formData.work_exp_years ? parseInt(formData.work_exp_years) : null,
        current_ctc: formData.current_ctc ? parseFloat(formData.current_ctc) : null,
      })

      // Then create application
      const applicationData = {
        portal: formData.portal || null,
        job_role_id: formData.job_role_id || null,
        assigned_date: formData.assigned_date || null,
        candidate_id: candidate.id,
        call_date: formData.call_date || null,
        call_status: formData.call_status || null,
        interested_status: formData.interested_status || null,
        notes: formData.notes || null,
      }

      await onSave(applicationData)
      onClose()
    } catch (error) {
      console.error('Error creating application:', error)
      alert('Failed to create application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Add New Candidate</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Candidate Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Candidate Name *"
                value={formData.candidate_name}
                onChange={(e) => setFormData({ ...formData, candidate_name: e.target.value })}
                required
              />
              <Input
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                label="Qualification"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              />
              <Input
                label="Age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />
              <Input
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              <Input
                label="Work Experience (Years)"
                type="number"
                value={formData.work_exp_years}
                onChange={(e) => setFormData({ ...formData, work_exp_years: e.target.value })}
              />
              <Input
                label="Current CTC"
                type="number"
                step="0.01"
                value={formData.current_ctc}
                onChange={(e) => setFormData({ ...formData, current_ctc: e.target.value })}
              />
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Application Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Portal"
                value={formData.portal}
                onChange={(e) => setFormData({ ...formData, portal: e.target.value })}
                placeholder="e.g., Naukri, LinkedIn, etc."
              />
              <div>
                <Select
                  label="Company"
                  value={formData.company_id}
                onChange={(e) => {
                  setFormData({ ...formData, company_id: e.target.value, job_role_id: '' })
                }}
                options={companies.map((c) => ({ value: c.id, label: c.company_name }))}
                disabled={loadingCompanies}
              />
              {loadingCompanies && (
                <div className="text-sm text-gray-500 mt-1">Loading companies...</div>
              )}
              {!loadingCompanies && companies.length === 0 && (
                <div className="text-sm text-red-500 mt-1">No companies available.</div>
              )}
              </div>
              <div>
                <Select
                  label="Job Role"
                  value={formData.job_role_id}
                  onChange={(e) => setFormData({ ...formData, job_role_id: e.target.value })}
                  options={companyJobRoles.map((jr) => ({ value: jr.id, label: jr.job_role }))}
                  disabled={!formData.company_id || loadingJobRoles}
                />
                {!formData.company_id && (
                  <div className="text-sm text-gray-500 mt-1">Select a company first</div>
                )}
                {formData.company_id && loadingJobRoles && (
                  <div className="text-sm text-gray-500 mt-1">Loading job roles for this company...</div>
                )}
                {formData.company_id && !loadingJobRoles && companyJobRoles.length === 0 && (
                  <div className="text-sm text-gray-500 mt-1">No job roles for this company</div>
                )}
              </div>
              <Input
                label="Assigned Date"
                type="date"
                value={formData.assigned_date}
                onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })}
              />
              <Input
                label="Call Date"
                type="date"
                value={formData.call_date}
                onChange={(e) => setFormData({ ...formData, call_date: e.target.value })}
              />
              <Select
                label="Call Status"
                value={formData.call_status}
                onChange={(e) => setFormData({ ...formData, call_status: e.target.value })}
                options={[
                  { value: 'Busy', label: 'Busy' },
                  { value: 'RNR', label: 'RNR' },
                  { value: 'Connected', label: 'Connected' },
                  { value: 'Wrong Number', label: 'Wrong Number' },
                ]}
              />
              <Select
                label="Interested Status"
                value={formData.interested_status}
                onChange={(e) => setFormData({ ...formData, interested_status: e.target.value })}
                options={[
                  { value: 'Yes', label: 'Yes' },
                  { value: 'No', label: 'No' },
                  { value: 'Call Back Later', label: 'Call Back Later' },
                ]}
              />
              <div className="md:col-span-2">
                <Input
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.candidate_name}>
              {loading ? 'Creating...' : 'Create Application'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
