'use client'

import { useState, useEffect } from 'react'
import type { Recruiter, Company, JobRole, Candidate } from '@/types/database'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

interface AddApplicationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
  recruiters: Recruiter[]
  companies: Company[]
  jobRoles: JobRole[]
}

export default function AddApplicationModal({
  isOpen,
  onClose,
  onSave,
  recruiters,
  companies,
  jobRoles,
}: AddApplicationModalProps) {
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
    recruiter_id: '',
    call_date: '',
    call_status: '',
    interested_status: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [filteredJobRoles, setFilteredJobRoles] = useState<JobRole[]>([])

  useEffect(() => {
    if (formData.company_id) {
      const filtered = jobRoles.filter((jr) => (jr as any).company?.id === formData.company_id)
      setFilteredJobRoles(filtered)
      // Reset job_role_id if current selection is not in filtered list
      if (formData.job_role_id && !filtered.find((jr) => jr.id === formData.job_role_id)) {
        setFormData((prev) => ({ ...prev, job_role_id: '' }))
      }
    } else {
      setFilteredJobRoles(jobRoles)
    }
  }, [formData.company_id, formData.job_role_id, jobRoles])

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
        recruiter_id: '',
        call_date: '',
        call_status: '',
        interested_status: '',
        notes: '',
      })
      setFilteredJobRoles(jobRoles)
    }
  }, [isOpen, jobRoles])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // First create candidate
      const { createCandidate } = await import('@/lib/local-queries')
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
        recruiter_id: formData.recruiter_id || null,
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
              <Select
                label="Company"
                value={formData.company_id}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                options={companies.map((c) => ({ value: c.id, label: c.company_name }))}
              />
              <Select
                label="Job Role"
                value={formData.job_role_id}
                onChange={(e) => setFormData({ ...formData, job_role_id: e.target.value })}
                options={filteredJobRoles.map((jr) => ({ value: jr.id, label: jr.job_role }))}
                disabled={!formData.company_id}
              />
              <Input
                label="Assigned Date"
                type="date"
                value={formData.assigned_date}
                onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })}
              />
              <Select
                label="Recruiter"
                value={formData.recruiter_id}
                onChange={(e) => setFormData({ ...formData, recruiter_id: e.target.value })}
                options={recruiters.map((r) => ({ value: r.id, label: r.name }))}
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
