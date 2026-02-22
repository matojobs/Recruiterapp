'use client'

import { cn } from '@/lib/utils'

export function StatusBadge({
  children,
  variant = 'neutral',
  className,
}: {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'info'
  className?: string
}) {
  const v = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
    neutral: 'bg-gray-100 text-gray-800',
    info: 'bg-indigo-100 text-indigo-800',
  }
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', v[variant], className)}>
      {children}
    </span>
  )
}

export function statusToVariant(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  const s = (status || '').toLowerCase()
  if (['active', 'approved', 'verified'].includes(s)) return 'success'
  if (['pending', 'suspended', 'draft'].includes(s)) return 'warning'
  if (['inactive', 'rejected', 'deleted'].includes(s)) return 'danger'
  return 'neutral'
}
