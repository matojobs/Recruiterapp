'use client'

import { useMemo } from 'react'
import type { Application, Notification } from '@/types/database'
import { formatDate } from '@/lib/utils'

export function useNotifications(applications: Application[], recruiterId?: string): Notification[] {
  return useMemo(() => {
    const notifications: Notification[] = []
    const today = new Date().toISOString().split('T')[0]

    // Filter applications for this recruiter
    const recruiterApplications = recruiterId
      ? applications.filter((app) => app.recruiter_id === recruiterId)
      : applications

    recruiterApplications.forEach((app) => {
      const candidateName = app.candidate?.candidate_name || 'Unknown Candidate'

      // 1. Interviews scheduled today
      if (
        app.interview_scheduled &&
        app.interview_date === today &&
        app.interview_status !== 'Done' &&
        app.interview_status !== 'Not Attended' &&
        app.interview_status !== 'Rejected'
      ) {
        notifications.push({
          id: `interview-${app.id}`,
          type: 'interview',
          title: 'Interview Today',
          message: `${candidateName} has an interview scheduled today for ${app.job_role?.job_role || 'position'}`,
          applicationId: app.id,
          candidateName,
          date: app.interview_date,
          priority: 'high',
          application: app,
        })
      }

      // 2. Follow-ups due today
      if (app.followup_date === today) {
        notifications.push({
          id: `followup-${app.id}`,
          type: 'followup',
          title: 'Follow-up Due Today',
          message: `Follow-up required for ${candidateName}${app.job_role ? ` (${app.job_role.job_role})` : ''}`,
          applicationId: app.id,
          candidateName,
          date: app.followup_date,
          priority: 'medium',
          application: app,
        })
      }

      // 3. Joining follow-ups (for candidates who joined and need follow-up)
      if (
        app.joining_status === 'Joined' &&
        app.joining_date &&
        app.followup_date &&
        app.followup_date === today
      ) {
        notifications.push({
          id: `joining-followup-${app.id}`,
          type: 'joining_followup',
          title: 'Joining Follow-up Due',
          message: `Follow-up needed for ${candidateName} who joined on ${formatDate(app.joining_date)}`,
          applicationId: app.id,
          candidateName,
          date: app.followup_date,
          priority: 'medium',
          application: app,
        })
      }

      // 4. Pending calls (assigned but no call made yet)
      if (
        app.assigned_date &&
        app.assigned_date <= today &&
        !app.call_date &&
        app.call_status === null
      ) {
        const assignedDate = new Date(app.assigned_date)
        const daysSinceAssigned = Math.floor(
          (new Date().getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysSinceAssigned >= 0) {
          notifications.push({
            id: `pending-call-${app.id}`,
            type: 'pending_call',
            title: 'Pending Call',
            message: `Call pending for ${candidateName}${daysSinceAssigned > 0 ? ` (${daysSinceAssigned} day${daysSinceAssigned > 1 ? 's' : ''} overdue)` : ''}`,
            applicationId: app.id,
            candidateName,
            date: app.assigned_date,
            priority: daysSinceAssigned > 2 ? 'high' : 'medium',
            application: app,
          })
        }
      }

      // 5. Interviews scheduled for tomorrow (upcoming)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]

      if (
        app.interview_scheduled &&
        app.interview_date === tomorrowStr &&
        app.interview_status !== 'Done' &&
        app.interview_status !== 'Not Attended' &&
        app.interview_status !== 'Rejected'
      ) {
        notifications.push({
          id: `interview-tomorrow-${app.id}`,
          type: 'interview',
          title: 'Interview Tomorrow',
          message: `${candidateName} has an interview scheduled tomorrow for ${app.job_role?.job_role || 'position'}`,
          applicationId: app.id,
          candidateName,
          date: app.interview_date,
          priority: 'medium',
          application: app,
        })
      }
    })

    // Sort by priority and date
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    notifications.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return a.date.localeCompare(b.date)
    })

    return notifications
  }, [applications, recruiterId])
}
