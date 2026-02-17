'use client'

import { useEffect, useState } from 'react'
import { getJobRoles, getCompanies } from '@/lib/local-queries'
import type { JobRole, Company } from '@/types/database'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

export default function JobsPage() {
  const [jobRoles, setJobRoles] = useState<JobRole[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    job_role: '',
    company_id: '',
  })

  useEffect(() => {
    // Initialize local data
    import('@/lib/local-storage').then(({ initializeLocalData }) => {
      initializeLocalData()
      loadData()
    })
  }, [])

  async function loadData() {
    try {
      const [roles, comps] = await Promise.all([
        getJobRoles(),
        getCompanies(),
      ])
      setJobRoles(roles)
      setCompanies(comps)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      // In local mode, we'll add to localStorage
      const { localDB } = await import('@/lib/local-db')
      const jobRoles = await localDB.getJobRoles()
      const companies = await localDB.getCompanies()
      const company = companies.find((c) => c.id === formData.company_id)
      
      const newJobRole = {
        id: Date.now().toString(),
        job_role: formData.job_role,
        company_id: formData.company_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        company: company,
      }
      
      const { LocalStorage } = await import('@/lib/local-storage')
      LocalStorage.set('job_roles', [...jobRoles, newJobRole])
      
      await loadData()
      setShowForm(false)
      setFormData({ job_role: '', company_id: '' })
    } catch (error) {
      console.error('Error creating job role:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Job Role'}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Job Role</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Job Role"
              value={formData.job_role}
              onChange={(e) => setFormData({ ...formData, job_role: e.target.value })}
              required
            />
            <Select
              label="Company"
              value={formData.company_id}
              onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
              options={companies.map((c) => ({ value: c.id, label: c.company_name }))}
              required
            />
            <div className="flex space-x-3">
              <Button type="submit">Create</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Industry
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobRoles.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No job roles found. Create your first job role above.
                  </td>
                </tr>
              ) : (
                jobRoles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {role.job_role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {(role as any).company?.company_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {(role as any).company?.industry || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
