'use client'

import type { DashboardStats } from '@/types/database'

interface StatsCardsProps {
  stats: DashboardStats
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Sourced',
      value: stats.totalSourced,
      icon: '📋',
      color: 'bg-blue-500',
    },
    {
      title: 'Calls Done Today',
      value: stats.callsDoneToday,
      icon: '📞',
      color: 'bg-green-500',
    },
    {
      title: 'Connected Today',
      value: stats.connectedToday,
      icon: '✅',
      color: 'bg-emerald-500',
    },
    {
      title: 'Interested Today',
      value: stats.interestedToday,
      icon: '👍',
      color: 'bg-teal-500',
    },
    {
      title: 'Not Interested Today',
      value: stats.notInterestedToday,
      icon: '👎',
      color: 'bg-red-500',
    },
    {
      title: 'Interviews Scheduled',
      value: stats.interviewsScheduled,
      icon: '📅',
      color: 'bg-yellow-500',
    },
    {
      title: 'Interviews Done Today',
      value: stats.interviewsDoneToday,
      icon: '✔️',
      color: 'bg-orange-500',
    },
    {
      title: 'Selected This Month',
      value: stats.selectedThisMonth,
      icon: '🎯',
      color: 'bg-purple-500',
    },
    {
      title: 'Joined This Month',
      value: stats.joinedThisMonth,
      icon: '🎉',
      color: 'bg-pink-500',
    },
    {
      title: 'Pending Joining',
      value: stats.pendingJoining,
      icon: '⏳',
      color: 'bg-indigo-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
            <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
