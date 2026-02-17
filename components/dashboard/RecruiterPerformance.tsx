'use client'

import type { RecruiterPerformance } from '@/types/database'

interface RecruiterPerformanceProps {
  performance: RecruiterPerformance[]
}

export default function RecruiterPerformanceTable({ performance }: RecruiterPerformanceProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recruiter Performance</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recruiter
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Calls Made
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Connected
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Connected Rate
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Interested
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Interested Rate
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Interviews
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Selected
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {performance.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  No recruiter performance data available
                </td>
              </tr>
            ) : (
              performance.map((perf) => (
                <tr key={perf.recruiter_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {perf.recruiter_name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-700">
                    {perf.callsMade}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-700">
                    {perf.connected}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      perf.connectedRate >= 50
                        ? 'bg-green-100 text-green-800'
                        : perf.connectedRate >= 30
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {perf.connectedRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-700">
                    {perf.interested}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      perf.interestedRate >= 50
                        ? 'bg-green-100 text-green-800'
                        : perf.interestedRate >= 30
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {perf.interestedRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-700">
                    {perf.interviewsScheduled}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-700">
                    {perf.selected}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-700">
                    {perf.joined}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
