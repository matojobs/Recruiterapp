'use client'

import { useAdminStore } from '@/lib/admin/store'
import type { Permission } from '@/lib/admin/types'

interface PermissionGuardProps {
  permission: Permission | string
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGuard({ permission, fallback = null, children }: PermissionGuardProps) {
  const hasPermission = useAdminStore((s) => s.hasPermission(permission))
  if (!hasPermission) return <>{fallback}</>
  return <>{children}</>
}

export function useHasPermission(permission: Permission | string): boolean {
  return useAdminStore((s) => s.hasPermission(permission))
}
