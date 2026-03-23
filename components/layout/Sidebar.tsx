'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getApplications } from '@/lib/data'
import { getCurrentUser } from '@/lib/auth-helper'
import { computeFollowUpCount, isFinalStage, UNREACHABLE_STATUSES } from '@/app/follow-ups/page-client'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Jobs', href: '/jobs', icon: '💼' },
  { name: 'Candidates', href: '/candidates', icon: '👥' },
  { name: 'Sourcing', href: '/sourcing', icon: '🔍' },
  { name: 'Pending Applications', href: '/pending-applications', icon: '⏳' },
  { name: 'Follow-ups', href: '/follow-ups', icon: '🔔' },
  { name: 'Reports', href: '/reports', icon: '📈' },
]

const CACHE_KEY = 'followup_count'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export default function Sidebar() {
  const pathname = usePathname()
  const [followUpCount, setFollowUpCount] = useState<number | null>(null)

  useEffect(() => {
    async function loadCount() {
      try {
        // Check sessionStorage cache first
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          const { count, ts } = JSON.parse(cached)
          if (Date.now() - ts < CACHE_TTL) {
            setFollowUpCount(count)
            return
          }
        }
        // Fetch fresh
        const user = await getCurrentUser()
        const rid = user?.recruiter_id ? String(user.recruiter_id) : undefined
        const apps = await getApplications({ recruiter_id: rid, limit: 1000 })
        const count = computeFollowUpCount(apps)
        setFollowUpCount(count)
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ count, ts: Date.now() }))
      } catch {
        // Silently fail — badge is non-critical
      }
    }
    loadCount()
  }, [pathname]) // Re-check on navigation (uses cache so not expensive)

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">HRMS Jobsmato</h1>
        <p className="text-sm text-gray-500 mt-1">Recruitment</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href + '/'))
          const isFollowUps = item.href === '/follow-ups'
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              <span className="flex-1">{item.name}</span>
              {isFollowUps && followUpCount !== null && followUpCount > 0 && (
                <span className="ml-2 text-xs font-bold bg-red-500 text-white rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                  {followUpCount > 99 ? '99+' : followUpCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
