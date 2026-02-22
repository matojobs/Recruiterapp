'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AdminSidebar } from './AdminSidebar'
import { useAdminStore } from '@/lib/admin/store'
import { getAdminPermissions } from '@/lib/admin/api'
import { cn } from '@/lib/utils'

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const accessToken = useAdminStore((s) => s.accessToken)
  const adminName = useAdminStore((s) => s.adminName)
  const setPermissions = useAdminStore((s) => s.setPermissions)
  const clearAuth = useAdminStore((s) => s.clearAuth)

  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    useAdminStore.getState().hydrate()
  }, [])

  // Sync state from DOM: dark class present = dark theme = darkMode false
  useEffect(() => {
    if (typeof window === 'undefined') return
    const isDark = document.documentElement.classList.contains('dark')
    setDarkMode(!isDark)
  }, [])

  useEffect(() => {
    if (isLoginPage) return
    if (!accessToken) {
      router.replace('/admin/login')
      return
    }
    getAdminPermissions()
      .then((res) => setPermissions(res.permissions))
      .catch(() => {})
  }, [accessToken, isLoginPage, setPermissions, router])

  const toggleDark = () => {
    setDarkMode((d) => {
      const next = !d
      document.documentElement.classList.toggle('dark', !next)
      return next
    })
  }

  const handleLogout = async () => {
    try {
      const { adminLogout } = await import('@/lib/admin/api')
      await adminLogout()
    } catch {
      clearAuth()
    }
    router.push('/admin/login')
  }

  if (isLoginPage) return <>{children}</>

  if (!accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className={cn('flex min-h-screen bg-gray-50 dark:bg-gray-900')}>
      <AdminSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((c) => !c)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-800">
          <div />
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">{adminName || 'Admin'}</span>
            <button
              type="button"
              onClick={toggleDark}
              className="rounded p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
