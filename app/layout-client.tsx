'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-helper'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    async function checkAuth() {
      try {
        const currentUser = await getCurrentUser()
        const isLoginPage = pathname?.startsWith('/login')
        
        if (!currentUser && !isLoginPage) {
          setIsAuthenticated(false)
        } else {
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Auth check error:', error)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [pathname])

  const isLoginPage = pathname?.startsWith('/login')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // Show login page without sidebar/header
  if (isLoginPage || !isAuthenticated) {
    return <>{children}</>
  }

  // Show main layout with sidebar/header
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
