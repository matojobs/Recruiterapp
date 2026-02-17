'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { localDB } from '@/lib/local-db'
import { getApplications } from '@/lib/local-queries'
import { useNotifications } from '@/hooks/useNotifications'
import Button from '@/components/ui/Button'
import NotificationsDropdown from '@/components/notifications/NotificationsDropdown'
import type { Application } from '@/types/database'

export default function Header() {
  const [recruiterName, setRecruiterName] = useState('')
  const [recruiterId, setRecruiterId] = useState<string | undefined>()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  const notifications = useNotifications(applications, recruiterId)

  useEffect(() => {
    async function loadRecruiter() {
      try {
        const currentUser = await localDB.getCurrentUser()
        if (currentUser) {
          setRecruiterId(currentUser.recruiter_id)
          const recruiter = await localDB.getRecruiterByEmail(currentUser.email)
          if (recruiter) {
            setRecruiterName(recruiter.name)
          }
          // Load applications for notifications
          const apps = await getApplications({ recruiter_id: currentUser.recruiter_id })
          setApplications(apps)
        }
      } catch (error) {
        console.error('Error loading recruiter:', error)
      } finally {
        setLoading(false)
      }
    }
    loadRecruiter()
  }, [])

  async function handleLogout() {
    await localDB.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Recruitment Sourcing Tracker
        </h2>
        <div className="flex items-center space-x-4">
          {!loading && recruiterName && (
            <span className="text-sm font-medium text-gray-700">
              Welcome, {recruiterName}
            </span>
          )}
          <span className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          {!loading && <NotificationsDropdown notifications={notifications} />}
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
