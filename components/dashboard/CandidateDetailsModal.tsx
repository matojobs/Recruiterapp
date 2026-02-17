'use client'

import type { Application } from '@/types/database'
import { formatDate, formatCurrency } from '@/lib/utils'
import Button from '@/components/ui/Button'

interface CandidateDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  application: Application | null
}

export default function CandidateDetailsModal({
  isOpen,
  onClose,
  application,
}: CandidateDetailsModalProps) {
  if (!isOpen || !application) return null

  const candidate = application.candidate
  const jobRole = application.job_role as any

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Candidate Details - {candidate?.candidate_name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Candidate Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Candidate Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-sm text-gray-900 mt-1">{candidate?.candidate_name || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-sm text-gray-900 mt-1">{candidate?.phone || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm text-gray-900 mt-1">{candidate?.email || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Qualification</label>
                <p className="text-sm text-gray-900 mt-1">{candidate?.qualification || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Age</label>
                <p className="text-sm text-gray-900 mt-1">{candidate?.age || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Location</label>
                <p className="text-sm text-gray-900 mt-1">{candidate?.location || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Work Experience</label>
                <p className="text-sm text-gray-900 mt-1">
                  {candidate?.work_exp_years ? `${candidate.work_exp_years} years` : '-'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Current CTC</label>
                <p className="text-sm text-gray-900 mt-1">
                  {candidate?.current_ctc ? formatCurrency(candidate.current_ctc) : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Application Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Application Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Portal</label>
                <p className="text-sm text-gray-900 mt-1">{application.portal || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Job Role</label>
                <p className="text-sm text-gray-900 mt-1">{jobRole?.job_role || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Company</label>
                <p className="text-sm text-gray-900 mt-1">
                  {jobRole?.company?.company_name || '-'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Assigned Date</label>
                <p className="text-sm text-gray-900 mt-1">
                  {formatDate(application.assigned_date)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Call Date</label>
                <p className="text-sm text-gray-900 mt-1">
                  {formatDate(application.call_date)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Call Status</label>
                <p className="text-sm text-gray-900 mt-1">{application.call_status || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Interested Status</label>
                <p className="text-sm text-gray-900 mt-1">
                  {application.interested_status || '-'}
                </p>
              </div>
              {application.not_interested_remark && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">
                    Not Interested Remark
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {application.not_interested_remark}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Interview Scheduled</label>
                <p className="text-sm text-gray-900 mt-1">
                  {application.interview_scheduled ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Interview Date</label>
                <p className="text-sm text-gray-900 mt-1">
                  {formatDate(application.interview_date)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Interview Status</label>
                <p className="text-sm text-gray-900 mt-1">
                  {application.interview_status || '-'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Selection Status</label>
                <p className="text-sm text-gray-900 mt-1">
                  {application.selection_status || '-'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Joining Status</label>
                <p className="text-sm text-gray-900 mt-1">
                  {application.joining_status || '-'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Joining Date</label>
                <p className="text-sm text-gray-900 mt-1">
                  {formatDate(application.joining_date)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Followup Date</label>
                <p className="text-sm text-gray-900 mt-1">
                  {formatDate(application.followup_date)}
                </p>
              </div>
              {application.hiring_manager_feedback && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">
                    Hiring Manager Feedback
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {application.hiring_manager_feedback}
                  </p>
                </div>
              )}
              {application.notes && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                    {application.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
