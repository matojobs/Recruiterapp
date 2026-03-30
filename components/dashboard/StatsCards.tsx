'use client'

import type { DashboardStats } from '@/types/database'

interface StatsCardsProps {
  stats: DashboardStats
  periodLabel?: string
}

// SVG icons as inline components for clean rendering
const Icons = {
  sourced: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  calls: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  connected: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  interested: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
    </svg>
  ),
  notInterested: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  target: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  joined: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  pending: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

export default function StatsCards({ stats, periodLabel }: StatsCardsProps) {
  const pl = periodLabel ? ` (${periodLabel})` : ''
  const cards = [
    {
      title: 'Total Sourced',
      value: stats.totalSourced,
      icon: Icons.sourced,
      accent: 'border-blue-500',
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Calls Done',
      value: stats.callsDoneToday,
      icon: Icons.calls,
      accent: 'border-cyan-500',
      iconBg: 'bg-cyan-50 text-cyan-600',
    },
    {
      title: 'Connected',
      value: stats.connectedToday,
      icon: Icons.connected,
      accent: 'border-emerald-500',
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Interested',
      value: stats.interestedToday,
      icon: Icons.interested,
      accent: 'border-teal-500',
      iconBg: 'bg-teal-50 text-teal-600',
    },
    {
      title: 'Not Interested',
      value: stats.notInterestedToday,
      icon: Icons.notInterested,
      accent: 'border-red-400',
      iconBg: 'bg-red-50 text-red-500',
    },
    {
      title: 'Int. Scheduled',
      value: stats.interviewsScheduled,
      icon: Icons.calendar,
      accent: 'border-yellow-500',
      iconBg: 'bg-yellow-50 text-yellow-600',
    },
    {
      title: 'Int. Done',
      value: stats.interviewsDoneToday,
      icon: Icons.check,
      accent: 'border-orange-500',
      iconBg: 'bg-orange-50 text-orange-600',
    },
    {
      title: `Selected${pl}`,
      value: stats.selectedThisMonth,
      icon: Icons.target,
      accent: 'border-purple-500',
      iconBg: 'bg-purple-50 text-purple-600',
    },
    {
      title: `Joined${pl}`,
      value: stats.joinedThisMonth,
      icon: Icons.joined,
      accent: 'border-pink-500',
      iconBg: 'bg-pink-50 text-pink-600',
    },
    {
      title: 'Pending Joining',
      value: stats.pendingJoining,
      icon: Icons.pending,
      accent: 'border-indigo-500',
      iconBg: 'bg-indigo-50 text-indigo-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${card.accent} p-4 flex items-center gap-3 hover:shadow-md transition-shadow`}
        >
          <div className={`${card.iconBg} p-2.5 rounded-lg flex-shrink-0`}>
            {card.icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500 truncate leading-tight">{card.title}</p>
            <p className="text-2xl font-bold text-gray-900 leading-tight mt-0.5">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
