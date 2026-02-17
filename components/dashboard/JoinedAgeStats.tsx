'use client'

import { useMemo } from 'react'
import type { Application } from '@/types/database'
import { calculateJoinedAge } from '@/lib/utils'

interface JoinedAgeStatsProps {
  applications: Application[]
}

export default function JoinedAgeStats({ applications }: JoinedAgeStatsProps) {
  const stats = useMemo(() => {
    // Filter only joined candidates (exclude backed out)
    const joinedCandidates = applications.filter(
      (app) => app.joining_status === 'Joined' && app.joining_date
    )

    // Debug logging (remove in production)
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('JoinedAgeStats - Total applications:', applications.length)
      console.log('JoinedAgeStats - Joined candidates:', joinedCandidates.length)
      joinedCandidates.forEach((app, idx) => {
        const days = calculateJoinedAge(app.joining_date)
        console.log(`JoinedAgeStats - Candidate ${idx + 1}:`, {
          name: app.candidate?.candidate_name,
          joining_date: app.joining_date,
          days_ago: days,
        })
      })
    }

    // Calculate age ranges
    const ranges = {
      '1-7 days': 0,
      '10-30 days': 0,
      '>45 days': 0,
      '>60 days': 0,
      '>90 days': 0,
    }

    joinedCandidates.forEach((app) => {
      if (!app.joining_date) return

      const days = calculateJoinedAge(app.joining_date)

      if (days >= 1 && days <= 7) {
        ranges['1-7 days']++
      } else if (days >= 10 && days <= 30) {
        ranges['10-30 days']++
      } else if (days > 45 && days <= 60) {
        ranges['>45 days']++
      } else if (days > 60 && days <= 90) {
        ranges['>60 days']++
      } else if (days > 90) {
        ranges['>90 days']++
      }
      // Note: Days 8-9 and 31-45 are not included in any range
    })

    return ranges
  }, [applications])

  const totalJoined = Object.values(stats).reduce((sum, count) => sum + count, 0)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Candidate Joined Age Statistics
      </h2>
      {totalJoined === 0 ? (
        <p className="text-sm text-gray-500">No joined candidates yet.</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">1-7 days</span>
            <span className="text-lg font-bold text-blue-700">{stats['1-7 days']} Candidate{stats['1-7 days'] !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">10-30 days</span>
            <span className="text-lg font-bold text-green-700">{stats['10-30 days']} Candidate{stats['10-30 days'] !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">&gt;45 days</span>
            <span className="text-lg font-bold text-yellow-700">{stats['>45 days']} Candidate{stats['>45 days'] !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">&gt;60 days</span>
            <span className="text-lg font-bold text-orange-700">{stats['>60 days']} Candidate{stats['>60 days'] !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Greater than 90 days</span>
            <span className="text-lg font-bold text-red-700">{stats['>90 days']} Candidate{stats['>90 days'] !== 1 ? 's' : ''}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Total Joined</span>
              <span className="text-xl font-bold text-gray-900">{totalJoined} Candidate{totalJoined !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
