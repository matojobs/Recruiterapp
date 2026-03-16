'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Something went wrong</h1>
      <p className="max-w-md text-center text-sm text-gray-600 dark:text-gray-400">
        A client-side error occurred. Try refreshing or going back to the dashboard. If it persists, try logging out and back in.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Try again
        </button>
        <Link
          href="/admin/dashboard"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          Dashboard
        </Link>
        <Link
          href="/admin/login"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          Login
        </Link>
      </div>
    </div>
  )
}
