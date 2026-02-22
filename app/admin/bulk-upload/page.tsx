'use client'

import { useEffect, useState } from 'react'
import { validateBulkUpload, processBulkUpload, getUploadHistory } from '@/lib/admin/api'
import { PermissionGuard } from '@/components/admin/PermissionGuard'

export default function AdminBulkUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [validateResult, setValidateResult] = useState<unknown>(null)
  const [uploadResult, setUploadResult] = useState<unknown>(null)
  const [history, setHistory] = useState<unknown[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getUploadHistory().then((res) => setHistory(res.uploads || [])).catch(() => {})
  }, [])

  const handleValidate = async () => {
    if (!file) return
    setLoading(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const arr = Array.isArray(data) ? data : data.data || []
      const res = await validateBulkUpload({ data: arr })
      setValidateResult(res)
    } catch (err) {
      setValidateResult({ error: String(err) })
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const arr = Array.isArray(data) ? data : data.data || []
      const res = await processBulkUpload({ data: arr })
      setUploadResult(res)
      const hist = await getUploadHistory()
      setHistory(hist.uploads || [])
    } catch (err) {
      setUploadResult({ error: String(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <PermissionGuard permission="bulk_operations" fallback={<p className="text-amber-600">No permission.</p>}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bulk Upload</h1>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <input type="file" accept=".json" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm" />
          <div className="mt-4 flex gap-3">
            <button type="button" onClick={handleValidate} disabled={!file || loading} className="rounded-lg border px-4 py-2 disabled:opacity-50">Validate</button>
            <button type="button" onClick={handleUpload} disabled={!file || loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-50">Upload</button>
          </div>
          {validateResult && <pre className="mt-4 overflow-auto rounded-lg bg-gray-100 p-4 text-xs">{JSON.stringify(validateResult, null, 2)}</pre>}
          {uploadResult && <pre className="mt-4 overflow-auto rounded-lg bg-gray-100 p-4 text-xs">{JSON.stringify(uploadResult, null, 2)}</pre>}
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold">Upload history</h2>
          <pre className="mt-2 text-xs">{JSON.stringify(history, null, 2)}</pre>
        </div>
      </div>
    </PermissionGuard>
  )
}
