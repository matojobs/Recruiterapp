import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

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
