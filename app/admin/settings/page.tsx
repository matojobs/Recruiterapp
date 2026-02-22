'use client'

import { useEffect, useState } from 'react'
import { getSettings, updateSettings } from '@/lib/admin/api'
import type { SettingItem } from '@/lib/admin/types'
import { PermissionGuard } from '@/components/admin/PermissionGuard'

export default function AdminSettingsPage() {
  const [items, setItems] = useState<SettingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getSettings()
      .then((res) => {
        if (Array.isArray(res)) setItems(res)
        else setItems(Object.entries(res as Record<string, unknown>).map(([key, value]) => ({ key, value })))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSettings(items.map((i) => ({ key: i.key, value: i.value })))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-gray-500">Loading settings...</p>

  return (
    <PermissionGuard permission="manage_settings" fallback={<p className="text-amber-600">No permission.</p>}>
      <div className="space-y-6">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <button type="button" onClick={handleSave} disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-50">Save</button>
        </div>
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Key</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {items.map((item, idx) => (
                <tr key={item.key}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{item.key}</td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={typeof item.value === 'object' ? JSON.stringify(item.value) : String(item.value)}
                      onChange={(e) => {
                        const next = [...items]
                        try {
                          (next[idx] as SettingItem).value = JSON.parse(e.target.value)
                        } catch {
                          (next[idx] as SettingItem).value = e.target.value
                        }
                        setItems(next)
                      }}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PermissionGuard>
  )
}
