'use client'

import { create } from 'zustand'
import type { Permission } from './types'

const ADMIN_TOKEN_KEY = 'admin_access_token'
const ADMIN_USER_KEY = 'admin_user'

export interface AdminState {
  accessToken: string | null
  permissions: string[]
  adminName: string | null
  setAuth: (token: string, permissions: string[], adminName: string) => void
  setPermissions: (permissions: string[]) => void
  hasPermission: (permission: Permission | string) => boolean
  clearAuth: () => void
  hydrate: () => void
}

export const useAdminStore = create<AdminState>((set, get) => ({
  accessToken: null,
  permissions: [],
  adminName: null,

  setAuth: (token, permissions, adminName) => {
    const list = Array.isArray(permissions) ? permissions : []
    if (typeof window !== 'undefined') {
      localStorage.setItem(ADMIN_TOKEN_KEY, token)
      localStorage.setItem(ADMIN_USER_KEY, adminName ?? '')
      localStorage.setItem('admin_permissions', JSON.stringify(list))
    }
    set({ accessToken: token, permissions: list, adminName: adminName ?? null })
  },

  setPermissions: (permissions) => {
    const list = Array.isArray(permissions) ? permissions : []
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_permissions', JSON.stringify(list))
    }
    set({ permissions: list })
  },

  hasPermission: (permission) => {
    const { permissions } = get()
    if (!Array.isArray(permissions)) return false
    return permissions.includes(permission)
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ADMIN_TOKEN_KEY)
      localStorage.removeItem(ADMIN_USER_KEY)
      localStorage.removeItem('admin_permissions')
    }
    set({ accessToken: null, permissions: [], adminName: null })
  },

  hydrate: () => {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem(ADMIN_TOKEN_KEY)
    const name = localStorage.getItem(ADMIN_USER_KEY)
    let permissions: string[] = []
    try {
      const raw = localStorage.getItem('admin_permissions')
      if (raw) {
        const parsed = JSON.parse(raw)
        permissions = Array.isArray(parsed) ? parsed : []
      }
    } catch {
      permissions = []
    }
    set({ accessToken: token, permissions, adminName: name })
  },
}))
