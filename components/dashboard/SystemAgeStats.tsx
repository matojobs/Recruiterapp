'use client'

import type { Application } from '@/types/database'

interface SystemAgeStatsProps {
  applications: Application[]
}

export default function SystemAgeStats({ applications }: SystemAgeStatsProps) {
  if (applications.length === 0) {
    return null
  }

  const candidateAges = applications
    .map((app) => app.candidate?.age)
    .filter((age): age is number => age !== null && age !== undefined && age > 0)

  const hasAgeData = candidateAges.length > 0
  const averageAge = hasAgeData
    ? Math.round(candidateAges.reduce((sum, age) => sum + age, 0) / candidateAges.length)
    : null
  const oldestAge = hasAgeData ? Math.max(...candidateAges) : null
  const youngestAge = hasAgeData ? Math.min(...candidateAges) : null

  const ageGroups = {
    young: candidateAges.filter((age) => age < 25).length,
    mid: candidateAges.filter((age) => age >= 25 && age < 35).length,
    senior: candidateAges.filter((age) => age >= 35).length,
  }
  const noAgeDataNote = applications.length > 0 && !hasAgeData

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidate Age Statistics</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{averageAge != null ? averageAge : '—'}</div>
          <div className="text-sm text-gray-600 mt-1">Average Age</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{oldestAge != null ? oldestAge : '—'}</div>
          <div className="text-sm text-gray-600 mt-1">Oldest Candidate</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{youngestAge != null ? youngestAge : '—'}</div>
          <div className="text-sm text-gray-600 mt-1">Youngest Candidate</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{applications.length}</div>
          <div className="text-sm text-gray-600 mt-1">Total Candidates</div>
        </div>
      </div>
      {noAgeDataNote && (
        <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          Age data is not provided by the backend for these candidates. Average/oldest/youngest and breakdown will show once candidate age is available.
        </p>
      )}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-gray-600">Young (&lt;25 years):</span>
            <span className="font-semibold text-gray-900">{ageGroups.young}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="text-gray-600">Mid (25-35 years):</span>
            <span className="font-semibold text-gray-900">{ageGroups.mid}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-gray-600">Senior (&gt;35 years):</span>
            <span className="font-semibold text-gray-900">{ageGroups.senior}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
