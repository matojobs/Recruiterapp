'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAdminStore } from '@/lib/admin/store'
import { cn } from '@/lib/utils'

const items: { name: string; href: string; permission?: string; icon: string }[] = [
  { name: 'Dashboard', href: '/admin/dashboard', permission: 'view_dashboard', icon: 'D' },
  { name: 'Users', href: '/admin/users', permission: 'view_users', icon: 'U' },
  { name: 'Companies', href: '/admin/companies', permission: 'view_companies', icon: 'C' },
  { name: 'Jobs', href: '/admin/jobs', permission: 'view_jobs', icon: 'J' },
  { name: 'Job Applications', href: '/admin/applications', icon: 'P' },
  { name: 'Bulk Upload', href: '/admin/bulk-upload', permission: 'bulk_operations', icon: 'B' },
  { name: 'Settings', href: '/admin/settings', permission: 'manage_settings', icon: 'S' },
  { name: 'Logs', href: '/admin/logs', icon: 'L' },
  { name: 'Activity Logs', href: '/admin/activity-logs', permission: 'view_logs', icon: 'A' },
]

export function AdminSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname()
  const hasPermission = useAdminStore((s) => s.hasPermission)
  const visible = items.filter((i) => !i.permission || hasPermission(i.permission))

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
        {!collapsed && <span className="text-lg font-bold text-indigo-600">Admin</span>}
        <button type="button" onClick={onToggle} className="rounded p-2 hover:bg-gray-100">
          {collapsed ? '>' : '<'}
        </button>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {visible.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <span>{item.icon}</span>
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
