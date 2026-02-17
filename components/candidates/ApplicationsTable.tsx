'use client'

import { useState, useMemo, useEffect } from 'react'
import type { Application } from '@/types/database'
import { formatDate, calculateJoinedAge, formatJoinedAge } from '@/lib/utils'
import EditCandidateModal from './EditCandidateModal'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'

interface ApplicationsTableProps {
  applications: Application[]
  onUpdate: (id: string, updates: Partial<Application>) => Promise<void>
}

export default function ApplicationsTable({ applications, onUpdate }: ApplicationsTableProps) {
  const [editingApplication, setEditingApplication] = useState<Application | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  // Calculate pagination - ensure minimum 10 rows per page (unless total is less than 10)
  let effectiveRowsPerPage = rowsPerPage
  if (rowsPerPage >= applications.length) {
    effectiveRowsPerPage = applications.length
  } else if (applications.length >= 10) {
    // If we have 10+ candidates, enforce minimum 10 rows per page
    effectiveRowsPerPage = Math.max(10, rowsPerPage)
  } else {
    // If we have less than 10 candidates, show all
    effectiveRowsPerPage = applications.length
  }
  const totalPages = Math.max(1, Math.ceil(applications.length / effectiveRowsPerPage))
  const startIndex = (currentPage - 1) * effectiveRowsPerPage
  const endIndex = startIndex + effectiveRowsPerPage
  const paginatedApplications = useMemo(() => {
    return applications.slice(startIndex, endIndex)
  }, [applications, startIndex, endIndex])

  // Reset to page 1 when rows per page changes - ensure minimum 10 (unless total is less)
  const handleRowsPerPageChange = (value: string) => {
    const newRowsPerPage = parseInt(value)
    // If selecting "All", use total count, otherwise use the selected value (will be enforced to min 10 in effectiveRowsPerPage)
    setRowsPerPage(newRowsPerPage)
    setCurrentPage(1)
  }

  // Reset to page 1 when applications change or when current page is invalid
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [applications.length, totalPages])

  function handleEdit(app: Application) {
    setEditingApplication(app)
    setShowEditModal(true)
  }

  async function handleSave(id: string, updates: Partial<Application>) {
    await onUpdate(id, updates)
    setShowEditModal(false)
    setEditingApplication(null)
  }

  function getStatusColor(status: string | null | undefined, type: 'call' | 'interested' | 'interview' | 'selection' | 'joining') {
    if (!status) return 'bg-gray-100 text-gray-700'
    
    if (type === 'call') {
      if (status === 'Connected') return 'bg-green-100 text-green-800'
      if (status === 'Busy' || status === 'RNR') return 'bg-yellow-100 text-yellow-800'
      return 'bg-red-100 text-red-800'
    }
    
    if (type === 'interested') {
      if (status === 'Yes') return 'bg-green-100 text-green-800'
      if (status === 'Call Back Later') return 'bg-yellow-100 text-yellow-800'
      return 'bg-red-100 text-red-800'
    }
    
    if (type === 'interview' || type === 'selection' || type === 'joining') {
      if (status.includes('Selected') || status.includes('Joined') || status === 'Done') return 'bg-green-100 text-green-800'
      if (status === 'Backed Out') return 'bg-red-200 text-red-900'
      if (status.includes('Pending') || status === 'Scheduled') return 'bg-yellow-100 text-yellow-800'
      return 'bg-red-100 text-red-800'
    }
    
    return 'bg-gray-100 text-gray-700'
  }

  return (
    <>
      {/* Pagination Controls - Top */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Show:</label>
          <Select
            value={rowsPerPage >= applications.length ? applications.length.toString() : rowsPerPage.toString()}
            onChange={(e) => handleRowsPerPageChange(e.target.value)}
            options={[
              { value: '10', label: '10' },
              { value: '20', label: '20' },
              { value: '50', label: '50' },
              { value: '100', label: '100' },
              ...(applications.length > 0 ? [{ value: applications.length.toString(), label: `All (${applications.length})` }] : []),
            ]}
            className="w-36"
          />
          <span className="text-sm text-gray-600 whitespace-nowrap">
            rows per page
          </span>
        </div>
        {applications.length > 0 && (
          <div className="text-sm text-gray-600 whitespace-nowrap">
            Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, applications.length)}</span> of <span className="font-medium">{applications.length}</span> candidate{applications.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {/* Edit - Frozen Column 1 */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20 border-r border-gray-200 min-w-[80px]">
                  Edit
                </th>
                {/* Name - Frozen Column 2 */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-[80px] bg-gray-50 z-20 border-r border-gray-200 min-w-[150px]">
                  Name
                </th>
                {/* Number - Frozen Column 3 */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-[230px] bg-gray-50 z-20 border-r border-gray-200 min-w-[120px]">
                  Number
                </th>
                {/* Email - Frozen Column 4 */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-[350px] bg-gray-50 z-20 border-r border-gray-200 min-w-[220px]">
                  Email
                </th>
                {/* Designation */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Designation
                </th>
                {/* Location */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                {/* Call Status */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Call Status
                </th>
                {/* Portal */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Portal
                </th>
                {/* Company */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                {/* Assigned Date */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Date
                </th>
                {/* Candidate Age */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Candidate Age
                </th>
                {/* Recruiter */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recruiter
                </th>
                {/* Call Date */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Call Date
                </th>
                {/* Interested */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interested
                </th>
                {/* Interview Scheduled */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interview Scheduled
                </th>
                {/* Interview Date */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interview Date
                </th>
                {/* Interview Status */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interview Status
                </th>
                {/* Selection Status */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Selection Status
                </th>
                {/* Joining Status */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joining Status
                </th>
                {/* Joining Date */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joining Date
                </th>
                {/* Joined Age */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined Age
                </th>
                {/* Backout Date */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Backout Date
                </th>
                {/* Backout Reason */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Backout Reason
                </th>
                {/* Followup Date */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Followup Date
                </th>
                {/* Notes */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={24} className="px-6 py-8 text-center text-gray-500">
                    No candidates found. Add your first candidate.
                  </td>
                </tr>
              ) : paginatedApplications.length === 0 ? (
                <tr>
                  <td colSpan={24} className="px-6 py-8 text-center text-gray-500">
                    No candidates on this page.
                  </td>
                </tr>
              ) : (
                paginatedApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    {/* Edit - Frozen Column 1 */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm sticky left-0 bg-white z-10 border-r border-gray-200 min-w-[80px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(app)}
                      >
                        Edit
                      </Button>
                    </td>

                    {/* Name - Frozen Column 2 */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium sticky left-[80px] bg-white z-10 border-r border-gray-200 min-w-[150px]">
                      {app.candidate?.candidate_name || '-'}
                    </td>

                    {/* Number - Frozen Column 3 */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 sticky left-[230px] bg-white z-10 border-r border-gray-200 min-w-[120px]">
                      {app.candidate?.phone || '-'}
                    </td>

                    {/* Email - Frozen Column 4 */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 sticky left-[350px] bg-white z-10 border-r border-gray-200 min-w-[220px]">
                      {app.candidate?.email ? (
                        <a
                          href={`mailto:${app.candidate.email}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline truncate block max-w-[200px]"
                          title={app.candidate.email}
                        >
                          {app.candidate.email}
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Designation */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                      {app.job_role?.job_role || '-'}
                    </td>

                    {/* Location */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                      {app.candidate?.location || '-'}
                    </td>

                    {/* Call Status */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {app.call_status ? (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(app.call_status, 'call')}`}>
                          {app.call_status}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Portal */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {app.portal || '-'}
                    </td>

                    {/* Company */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                      {(app.job_role as any)?.company?.company_name || '-'}
                    </td>

                    {/* Assigned Date */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(app.assigned_date)}
                    </td>

                    {/* Candidate Age */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                      {app.candidate?.age ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {app.candidate.age} years
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Recruiter */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                      {app.recruiter?.name || '-'}
                    </td>

                    {/* Call Date */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(app.call_date)}
                    </td>

                    {/* Interested */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {app.interested_status ? (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(app.interested_status, 'interested')}`}>
                          {app.interested_status}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Interview Scheduled */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-center">
                      {app.interview_scheduled ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Yes
                        </span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>

                    {/* Interview Date */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(app.interview_date)}
                    </td>

                    {/* Interview Status */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {app.interview_status ? (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(app.interview_status, 'interview')}`}>
                          {app.interview_status}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Selection Status */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {app.selection_status ? (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(app.selection_status, 'selection')}`}>
                          {app.selection_status}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Joining Status */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {app.joining_status ? (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(app.joining_status, 'joining')}`}>
                          {app.joining_status}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Joining Date */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(app.joining_date)}
                    </td>

                    {/* Joined Age - Only show for joined candidates */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {app.joining_status === 'Joined' && app.joining_date ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          {formatJoinedAge(calculateJoinedAge(app.joining_date))}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Backout Date */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                      {app.backout_date ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-red-200 text-red-900">
                          {formatDate(app.backout_date)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Backout Reason */}
                    <td className="px-3 py-2 text-sm text-gray-700 max-w-xs">
                      {app.backout_reason ? (
                        <div className="truncate" title={app.backout_reason}>
                          {app.backout_reason}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Followup Date */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(app.followup_date)}
                    </td>

                    {/* Notes */}
                    <td className="px-3 py-2 text-sm text-gray-700 max-w-xs">
                      <div className="truncate" title={app.notes || ''}>
                        {app.notes || '-'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls - Bottom */}
      {applications.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-sm text-gray-700">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </Button>
          </div>
        </div>
      )}

      <EditCandidateModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingApplication(null)
        }}
        application={editingApplication}
        onSave={handleSave}
      />
    </>
  )
}
