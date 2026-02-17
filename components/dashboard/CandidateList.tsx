'use client'

import { useState } from 'react'
import type { Application } from '@/types/database'
import { formatDate, calculateJoinedAge, formatJoinedAge } from '@/lib/utils'
import CandidateDetailsModal from './CandidateDetailsModal'
import Button from '@/components/ui/Button'

interface CandidateListProps {
  applications: Application[]
}

export default function CandidateList({ applications }: CandidateListProps) {
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [showModal, setShowModal] = useState(false)

  function handleViewDetails(app: Application) {
    setSelectedApplication(app)
    setShowModal(true)
  }

  // Group applications by status for better organization
  const groupedByStatus = {
    joined: applications.filter((app) => app.joining_status === 'Joined' && app.joining_status !== 'Backed Out'),
    backedOut: applications.filter((app) => app.joining_status === 'Backed Out'),
    selected: applications.filter(
      (app) => app.selection_status === 'Selected' && app.joining_status !== 'Joined' && app.joining_status !== 'Backed Out'
    ),
    interviewScheduled: applications.filter(
      (app) => app.interview_scheduled && app.interview_status !== 'Done'
    ),
    interested: applications.filter(
      (app) => app.interested_status === 'Yes' && !app.interview_scheduled
    ),
    connected: applications.filter(
      (app) => app.call_status === 'Connected' && app.interested_status !== 'Yes'
    ),
    other: applications.filter(
      (app) =>
        app.joining_status !== 'Joined' &&
        app.selection_status !== 'Selected' &&
        !app.interview_scheduled &&
        app.interested_status !== 'Yes' &&
        app.call_status !== 'Connected'
    ),
  }

  const statusGroups = [
    { title: 'Joined', apps: groupedByStatus.joined, color: 'bg-green-50' },
    { title: 'Backed Out', apps: groupedByStatus.backedOut, color: 'bg-red-50' },
    { title: 'Selected (Pending Joining)', apps: groupedByStatus.selected, color: 'bg-blue-50' },
    { title: 'Interview Scheduled', apps: groupedByStatus.interviewScheduled, color: 'bg-yellow-50' },
    { title: 'Interested', apps: groupedByStatus.interested, color: 'bg-emerald-50' },
    { title: 'Connected', apps: groupedByStatus.connected, color: 'bg-teal-50' },
    { title: 'Others', apps: groupedByStatus.other, color: 'bg-gray-50' },
  ]

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Your Candidates ({applications.length})
        </h3>

        {applications.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No candidates found</p>
        ) : (
          <div className="space-y-6">
            {statusGroups.map(
              (group) =>
                group.apps.length > 0 && (
                  <div key={group.title} className={`${group.color} p-4 rounded-lg`}>
                    <h4 className="font-medium text-gray-900 mb-3">
                      {group.title} ({group.apps.length})
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                              Candidate
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                              Job Role
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                              Company
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                              Status
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                              Assigned Date
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                              Candidate Age
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                              Joined Age
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {group.apps.map((app) => (
                            <tr key={app.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {app.candidate?.candidate_name || '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                {(app.job_role as any)?.job_role || '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                {(app.job_role as any)?.company?.company_name || '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    app.joining_status === 'Joined'
                                      ? 'bg-green-100 text-green-800'
                                      : app.selection_status === 'Selected'
                                      ? 'bg-blue-100 text-blue-800'
                                      : app.interview_scheduled
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : app.interested_status === 'Yes'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : app.call_status === 'Connected'
                                      ? 'bg-teal-100 text-teal-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {app.joining_status === 'Joined'
                                    ? 'Joined'
                                    : app.selection_status === 'Selected'
                                    ? 'Selected'
                                    : app.interview_scheduled
                                    ? 'Interview Scheduled'
                                    : app.interested_status === 'Yes'
                                    ? 'Interested'
                                    : app.call_status === 'Connected'
                                    ? 'Connected'
                                    : 'In Progress'}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                {formatDate(app.assigned_date)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                {app.candidate?.age ? (
                                  <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    {app.candidate.age} years
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                {app.joining_status === 'Joined' && app.joining_date ? (
                                  <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                    {formatJoinedAge(calculateJoinedAge(app.joining_date))}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(app)}
                                >
                                  View Details
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
            )}
          </div>
        )}
      </div>

      <CandidateDetailsModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedApplication(null)
        }}
        application={selectedApplication}
      />
    </>
  )
}
