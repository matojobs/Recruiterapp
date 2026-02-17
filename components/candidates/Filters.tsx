'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import type { Recruiter, Company, JobRole } from '@/types/database'

interface FiltersProps {
  recruiters: Recruiter[]
  companies: Company[]
  jobRoles: JobRole[]
  onFilterChange: (filters: any) => void
  onExport: () => void
}

export default function Filters({ recruiters, companies, jobRoles, onFilterChange, onExport }: FiltersProps) {
  const [filters, setFilters] = useState({
    recruiter_id: '',
    company_id: '',
    job_role_id: '',
    portal: '',
    call_status: '',
    interested_status: '',
    interview_status: '',
    selection_status: '',
    joining_status: '',
    date_from: '',
    date_to: '',
  })

  function handleFilterChange(field: string, value: string) {
    const newFilters = { ...filters, [field]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  function handleReset() {
    const emptyFilters = {
      recruiter_id: '',
      company_id: '',
      job_role_id: '',
      portal: '',
      call_status: '',
      interested_status: '',
      interview_status: '',
      selection_status: '',
      joining_status: '',
      date_from: '',
      date_to: '',
    }
    setFilters(emptyFilters)
    onFilterChange(emptyFilters)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset
          </Button>
          <Button variant="primary" size="sm" onClick={onExport}>
            Export Excel
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select
          label="Recruiter"
          value={filters.recruiter_id}
          onChange={(e) => handleFilterChange('recruiter_id', e.target.value)}
          options={recruiters.map((r) => ({ value: r.id, label: r.name }))}
        />
        <Select
          label="Company"
          value={filters.company_id}
          onChange={(e) => handleFilterChange('company_id', e.target.value)}
          options={companies.map((c) => ({ value: c.id, label: c.company_name }))}
        />
        <Select
          label="Job Role"
          value={filters.job_role_id}
          onChange={(e) => handleFilterChange('job_role_id', e.target.value)}
          options={jobRoles.map((j) => ({ value: j.id, label: j.job_role }))}
        />
        <Input
          label="Portal"
          value={filters.portal}
          onChange={(e) => handleFilterChange('portal', e.target.value)}
          placeholder="Search portal..."
        />
        <Select
          label="Call Status"
          value={filters.call_status}
          onChange={(e) => handleFilterChange('call_status', e.target.value)}
          options={[
            { value: 'Busy', label: 'Busy' },
            { value: 'RNR', label: 'RNR' },
            { value: 'Connected', label: 'Connected' },
            { value: 'Wrong Number', label: 'Wrong Number' },
          ]}
        />
        <Select
          label="Interested Status"
          value={filters.interested_status}
          onChange={(e) => handleFilterChange('interested_status', e.target.value)}
          options={[
            { value: 'Yes', label: 'Yes' },
            { value: 'No', label: 'No' },
            { value: 'Call Back Later', label: 'Call Back Later' },
          ]}
        />
        <Select
          label="Interview Status"
          value={filters.interview_status}
          onChange={(e) => handleFilterChange('interview_status', e.target.value)}
          options={[
            { value: 'Scheduled', label: 'Scheduled' },
            { value: 'Done', label: 'Done' },
            { value: 'Not Attended', label: 'Not Attended' },
            { value: 'Rejected', label: 'Rejected' },
          ]}
        />
        <Select
          label="Selection Status"
          value={filters.selection_status}
          onChange={(e) => handleFilterChange('selection_status', e.target.value)}
          options={[
            { value: 'Selected', label: 'Selected' },
            { value: 'Not Selected', label: 'Not Selected' },
            { value: 'Pending', label: 'Pending' },
          ]}
        />
        <Select
          label="Joining Status"
          value={filters.joining_status}
          onChange={(e) => handleFilterChange('joining_status', e.target.value)}
          options={[
            { value: 'Joined', label: 'Joined' },
            { value: 'Not Joined', label: 'Not Joined' },
            { value: 'Pending', label: 'Pending' },
          ]}
        />
        <Input
          label="Date From"
          type="date"
          value={filters.date_from}
          onChange={(e) => handleFilterChange('date_from', e.target.value)}
        />
        <Input
          label="Date To"
          type="date"
          value={filters.date_to}
          onChange={(e) => handleFilterChange('date_to', e.target.value)}
        />
      </div>
    </div>
  )
}
