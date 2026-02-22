'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminStore } from '@/lib/admin/store'

export default function AdminIndexPage() {
  const router = useRouter()

  useEffect(() => {
    useAdminStore.getState().hydrate()
    const token = useAdminStore.getState().accessToken
    if (token) router.replace('/admin/dashboard')
    else router.replace('/admin/login')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <p className="text-gray-500">Redirecting...</p>
    </div>
  )
}
