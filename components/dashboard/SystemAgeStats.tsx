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

  const averageAge = candidateAges.length > 0
    ? Math.round(candidateAges.reduce((sum, age) => sum + age, 0) / candidateAges.length)
    : 0

  const oldestAge = candidateAges.length > 0 ? Math.max(...candidateAges) : 0
  const youngestAge = candidateAges.length > 0 ? Math.min(...candidateAges) : 0

  const ageGroups = {
    young: candidateAges.filter((age) => age < 25).length,
    mid: candidateAges.filter((age) => age >= 25 && age < 35).length,
    senior: candidateAges.filter((age) => age >= 35).length,
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidate Age Statistics</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{averageAge || '-'}</div>
          <div className="text-sm text-gray-600 mt-1">Average Age</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{oldestAge || '-'}</div>
          <div className="text-sm text-gray-600 mt-1">Oldest Candidate</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{youngestAge || '-'}</div>
          <div className="text-sm text-gray-600 mt-1">Youngest Candidate</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{applications.length}</div>
          <div className="text-sm text-gray-600 mt-1">Total Candidates</div>
        </div>
      </div>
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
