'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { localDB } from '@/lib/local-db'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const { initializeLocalData } = await import('@/lib/local-storage')
      initializeLocalData()
      
      const currentUser = await localDB.getCurrentUser()
      if (currentUser) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-gray-500">Loading...</div>
    </div>
  )
}
