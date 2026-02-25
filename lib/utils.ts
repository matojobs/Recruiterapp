import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Application, PipelineFlow, DashboardStats } from '@/types/database'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatCurrency(amount: number | null | undefined): string {
  if (!amount) return '-'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0
  return Math.round((part / total) * 100)
}

export function calculateSystemAge(assignedDate: string | null | undefined): number {
  if (!assignedDate) return 0
  const assigned = new Date(assignedDate)
  const today = new Date()
  const diffTime = today.getTime() - assigned.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function formatSystemAge(days: number): string {
  if (days === 0) return 'Today'
  if (days === 1) return '1 day'
  if (days < 30) return `${days} days`
  const months = Math.floor(days / 30)
  const remainingDays = days % 30
  if (months === 1 && remainingDays === 0) return '1 month'
  if (remainingDays === 0) return `${months} months`
  return `${months}m ${remainingDays}d`
}

export function calculateJoinedAge(joiningDate: string | null | undefined): number {
  if (!joiningDate) return 0
  const joined = new Date(joiningDate)
  const today = new Date()
  const diffTime = today.getTime() - joined.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function formatJoinedAge(days: number): string {
  if (days === 0) return 'Joined Today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  const remainingDays = days % 30
  if (months === 1 && remainingDays === 0) return '1 month ago'
  if (remainingDays === 0) return `${months} months ago`
  return `${months}m ${remainingDays}d ago`
}

/** Compute pipeline flow counts from a list of applications (single source of truth). */
export function computePipelineFlowFromApplications(applications: Application[]): PipelineFlow {
  return {
    sourced: applications.length,
    callDone: applications.filter((app) => app.call_date != null).length,
    connected: applications.filter((app) => app.call_status === 'Connected').length,
    interested: applications.filter((app) => app.interested_status === 'Yes').length,
    notInterested: applications.filter((app) => app.interested_status === 'No').length,
    interviewScheduled: applications.filter((app) => app.interview_scheduled).length,
    interviewDone: applications.filter((app) => app.interview_status === 'Done').length,
    selected: applications.filter((app) => app.selection_status === 'Selected').length,
    joined: applications.filter((app) => app.joining_status === 'Joined').length,
  }
}

const todayStr = () => new Date().toISOString().slice(0, 10)
const thisMonthStart = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

/** Compute dashboard stats from applications (single source of truth for dashboard). */
export function computeDashboardStatsFromApplications(applications: Application[]): DashboardStats {
  const today = todayStr()
  const monthStart = thisMonthStart()
  return {
    totalSourced: applications.length,
    callsDoneToday: applications.filter((app) => app.call_date && app.call_date.slice(0, 10) === today).length,
    connectedToday: applications.filter((app) => app.call_date && app.call_date.slice(0, 10) === today && app.call_status === 'Connected').length,
    interestedToday: applications.filter((app) => app.call_date && app.call_date.slice(0, 10) === today && app.interested_status === 'Yes').length,
    notInterestedToday: applications.filter((app) => app.call_date && app.call_date.slice(0, 10) === today && app.interested_status === 'No').length,
    interviewsScheduled: applications.filter((app) => app.interview_scheduled).length,
    interviewsDoneToday: applications.filter((app) => app.interview_date && app.interview_date.toString().slice(0, 10) === today && app.interview_status === 'Done').length,
    selectedThisMonth: applications.filter((app) => app.selection_status === 'Selected').length,
    joinedThisMonth: applications.filter((app) => app.joining_status === 'Joined' && app.joining_date && app.joining_date.slice(0, 10) >= monthStart).length,
    pendingJoining: applications.filter((app) => app.selection_status === 'Selected' && app.joining_status !== 'Joined').length,
  }
}
