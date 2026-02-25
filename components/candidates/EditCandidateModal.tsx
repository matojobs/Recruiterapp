'use client'

import { useState, useEffect } from 'react'
import type { Application } from '@/types/database'
import { formatDate } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

interface EditCandidateModalProps {
  isOpen: boolean
  onClose: () => void
  application: Application | null
  onSave: (id: string, updates: Partial<Application>) => Promise<void>
}

export default function EditCandidateModal({
  isOpen,
  onClose,
  application,
  onSave,
}: EditCandidateModalProps) {
  const [formData, setFormData] = useState<Partial<Application>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (application) {
      const callStatus = (application.call_status as string | null) === 'call connected' ? 'Connected' : (application.call_status || '')
      setFormData({
        portal: application.portal || '',
        assigned_date: application.assigned_date || '',
        call_date: application.call_date || '',
        call_status: callStatus,
        interested_status: application.interested_status || '',
        not_interested_remark: application.not_interested_remark || '',
        interview_scheduled: application.interview_scheduled || false,
        interview_date: application.interview_date || '',
        turnup: application.turnup || false,
        interview_status: application.interview_status || '',
        selection_status: application.selection_status || '',
        joining_status: application.joining_status || '',
        joining_date: application.joining_date || '',
        backout_date: application.backout_date || '',
        backout_reason: application.backout_reason || '',
        hiring_manager_feedback: application.hiring_manager_feedback || '',
        followup_date: application.followup_date || '',
        notes: application.notes || '',
      } as Partial<Application>)
    }
  }, [application])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!application) return

    setLoading(true)
    try {
      const updates: any = {}
      
      // Convert empty strings to null; normalize call_status (backend no longer stores "call connected")
      Object.keys(formData).forEach((key) => {
        let value = formData[key as keyof Application]
        if (key === 'call_status' && value === 'call connected') value = 'Connected'
        updates[key] = value === '' ? null : value
      })

      // Handle boolean fields (form may have boolean or string 'Yes')
      updates.interview_scheduled = formData.interview_scheduled === true || (formData.interview_scheduled as unknown) === 'Yes'
      updates.turnup = formData.turnup === true || (formData.turnup as unknown) === 'Yes'

      await onSave(application.id, updates)
      onClose()
    } catch (error) {
      console.error('Error updating candidate:', error)
      alert('Failed to update candidate status')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !application) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit Candidate Status - {application.candidate?.candidate_name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Candidate</label>
              <p className="text-sm text-gray-900">{application.candidate?.candidate_name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Role</label>
              <p className="text-sm text-gray-900">{(application.job_role as any)?.job_role || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <p className="text-sm text-gray-900">{(application.job_role as any)?.company?.company_name || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Portal</label>
              <Input
                value={formData.portal || ''}
                onChange={(e) => setFormData({ ...formData, portal: e.target.value })}
                placeholder="e.g., Naukri, LinkedIn"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Date</label>
              <Input
                type="date"
                value={formData.assigned_date || ''}
                onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Call Date</label>
              <Input
                type="date"
                value={formData.call_date || ''}
                onChange={(e) => setFormData({ ...formData, call_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Call Status</label>
              <Select
                value={formData.call_status || ''}
                onChange={(e) => setFormData({ ...formData, call_status: e.target.value as any })}
                options={[
                  { value: '', label: 'Select...' },
                  { value: 'Busy', label: 'Busy' },
                  { value: 'RNR', label: 'RNR' },
                  { value: 'Connected', label: 'Connected' },
                  { value: 'Wrong Number', label: 'Wrong Number' },
                  { value: 'Switch off', label: 'Switch off' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interested Status</label>
              <Select
                value={formData.interested_status || ''}
                onChange={(e) => setFormData({ ...formData, interested_status: e.target.value as any })}
                options={[
                  { value: 'Yes', label: 'Yes' },
                  { value: 'No', label: 'No' },
                  { value: 'Call Back Later', label: 'Call Back Later' },
                ]}
              />
            </div>
            {formData.interested_status === 'No' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Not Interested Remark</label>
                <Input
                  value={formData.not_interested_remark || ''}
                  onChange={(e) => setFormData({ ...formData, not_interested_remark: e.target.value })}
                  placeholder="Reason for not being interested..."
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interview Scheduled</label>
              <Select
                value={formData.interview_scheduled ? 'Yes' : 'No'}
                onChange={(e) => setFormData({ ...formData, interview_scheduled: e.target.value === 'Yes' })}
                options={[
                  { value: 'Yes', label: 'Yes' },
                  { value: 'No', label: 'No' },
                ]}
              />
            </div>
            {formData.interview_scheduled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interview Date</label>
                  <Input
                    type="date"
                    value={formData.interview_date || ''}
                    onChange={(e) => setFormData({ ...formData, interview_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interview Status</label>
                  <Select
                    value={formData.interview_status || ''}
                    onChange={(e) => setFormData({ ...formData, interview_status: e.target.value as any })}
                    options={[
                      { value: 'Scheduled', label: 'Scheduled' },
                      { value: 'Done', label: 'Done' },
                      { value: 'Not Attended', label: 'Not Attended' },
                      { value: 'Rejected', label: 'Rejected' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Turnup</label>
                  <Select
                    value={formData.turnup ? 'Yes' : 'No'}
                    onChange={(e) => setFormData({ ...formData, turnup: e.target.value === 'Yes' })}
                    options={[
                      { value: 'Yes', label: 'Yes' },
                      { value: 'No', label: 'No' },
                    ]}
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selection Status</label>
              <Select
                value={formData.selection_status || ''}
                onChange={(e) => setFormData({ ...formData, selection_status: e.target.value as any })}
                options={[
                  { value: 'Selected', label: 'Selected' },
                  { value: 'Not Selected', label: 'Not Selected' },
                  { value: 'Pending', label: 'Pending' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Joining Status</label>
              <Select
                value={formData.joining_status || ''}
                onChange={(e) => {
                  const newStatus = e.target.value as any
                  setFormData({ 
                    ...formData, 
                    joining_status: newStatus,
                    // Clear backout fields if not backing out
                    ...(newStatus !== 'Backed Out' ? { backout_date: '', backout_reason: '' } : {}),
                    // Clear joining date if backing out
                    ...(newStatus === 'Backed Out' ? { joining_date: '' } : {})
                  })
                }}
                options={[
                  { value: 'Joined', label: 'Joined' },
                  { value: 'Not Joined', label: 'Not Joined' },
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Backed Out', label: 'Backed Out' },
                ]}
              />
            </div>
            {formData.joining_status === 'Joined' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                <Input
                  type="date"
                  value={formData.joining_date || ''}
                  onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                />
              </div>
            )}
            {formData.joining_status === 'Backed Out' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Backout Date</label>
                  <Input
                    type="date"
                    value={formData.backout_date || ''}
                    onChange={(e) => setFormData({ ...formData, backout_date: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Backout Reason</label>
                  <textarea
                    value={formData.backout_reason || ''}
                    onChange={(e) => setFormData({ ...formData, backout_reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={2}
                    placeholder="Reason for backing out..."
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Followup Date</label>
              <Input
                type="date"
                value={formData.followup_date || ''}
                onChange={(e) => setFormData({ ...formData, followup_date: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hiring Manager Feedback</label>
              <textarea
                value={formData.hiring_manager_feedback || ''}
                onChange={(e) => setFormData({ ...formData, hiring_manager_feedback: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="Feedback from hiring manager..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="Additional notes..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
