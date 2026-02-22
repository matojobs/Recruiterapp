'use client'

import Link from 'next/link'

export default function AdminForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 p-8">
      <h1 className="text-2xl font-bold text-amber-800">403 Forbidden</h1>
      <p className="mt-2 text-amber-700">You do not have permission to access this page.</p>
      <Link href="/admin/dashboard" className="mt-6 rounded-lg bg-amber-600 px-4 py-2 text-white hover:bg-amber-700">
        Back to Dashboard
      </Link>
    </div>
  )
}
