'use client'

import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import * as XLSX from 'xlsx'
import {
  getRecruiterPerformanceDOD,
  getRecruiterPerformanceMTD,
  getRecruiterPerformanceIndividual,
  getRecruiterPerformanceCompanyWise,
  getRecruiterPerformanceNegativeFunnel,
  getRecruiterPerformanceInterviewStatusCompany,
} from '@/lib/admin/api'
import type {
  RecruiterPerformanceDODResponse,
  RecruiterPerformanceMTDResponse,
  RecruiterPerformanceIndividualResponse,
  RecruiterPerformanceCompanyWiseResponse,
  RecruiterPerformanceNegativeFunnelResponse,
  RecruiterPerformanceInterviewStatusResponse,
  NegativeFunnelRemark,
} from '@/lib/admin/types'

type TabId = 'dod' | 'mtd' | 'individual' | 'company' | 'negative' | 'interview-status'

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function safeVal(obj: unknown, key: string): string | number {
  if (obj == null || typeof obj !== 'object') return ''
  const v = (obj as Record<string, unknown>)[key]
  if (typeof v === 'number') return v
  return v != null ? String(v) : ''
}

function pct(numerator: number, denominator: number): number {
  if (!denominator || !isFinite(denominator)) return 0
  return Math.round((numerator / denominator) * 100)
}

function fmtPct(n: number): string {
  return `${n}%`
}

function exportToXlsx(filename: string, headers: string[], rows: object[], columnKeys: string[]) {
  const data = [headers, ...rows.map((r) => columnKeys.map((k) => safeVal(r, k)))]
  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Report')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

// ---------------------------------------------------------------------------
// KPI Cards
// ---------------------------------------------------------------------------

interface KPIItem {
  label: string
  value: string | number
}

function KPICards({
  items,
  prevItems,
}: {
  items: KPIItem[]
  prevItems?: KPIItem[]
}) {
  const prevMap = useMemo(() => {
    if (!prevItems) return null
    const m: Record<string, string | number> = {}
    for (const pi of prevItems) m[pi.label] = pi.value
    return m
  }, [prevItems])

  if (!items.length) return null

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map(({ label, value }) => {
        const curr = typeof value === 'number' ? value : Number(value) || 0
        const prev = prevMap ? (typeof prevMap[label] === 'number' ? prevMap[label] as number : Number(prevMap[label]) || 0) : null
        let delta: React.ReactNode = null
        if (prev !== null) {
          const diff = curr - prev
          if (diff > 0) {
            delta = <span className="ml-1 text-xs font-semibold text-green-600">↑ +{diff}</span>
          } else if (diff < 0) {
            delta = <span className="ml-1 text-xs font-semibold text-red-500">↓ {diff}</span>
          } else {
            delta = <span className="ml-1 text-xs text-gray-400">—</span>
          }
        }
        return (
          <div
            key={label}
            className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm dark:border-gray-600 dark:from-gray-800 dark:to-gray-800"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
            <p className="mt-1 flex items-baseline text-2xl font-bold text-gray-900 dark:text-white">
              {value}
              {delta}
            </p>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Conversion Funnel
// ---------------------------------------------------------------------------

interface FunnelStep {
  from: string
  to: string
  fromVal: number
  toVal: number
}

function pctColorClass(p: number): string {
  if (!isFinite(p) || isNaN(p)) return 'bg-red-100 text-red-600 border-red-200'
  if (p >= 50) return 'bg-green-100 text-green-700 border-green-200'
  if (p >= 20) return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-red-100 text-red-600 border-red-200'
}

function ConversionFunnel({ steps }: { steps: FunnelStep[] }) {
  if (!steps.length) return null
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Conversion Funnel</h4>
      <div className="flex flex-wrap items-center gap-0">
        {steps.map((step, i) => {
          const p = pct(step.toVal, step.fromVal)
          const colorCls = pctColorClass(p)
          return (
            <div key={i} className="flex items-center">
              {/* Stage box */}
              <div className="flex flex-col items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center dark:border-gray-600 dark:bg-gray-700 min-w-[80px]">
                <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{step.from}</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{step.fromVal}</span>
              </div>
              {/* Arrow with percentage */}
              <div className="flex flex-col items-center mx-1">
                <span className={`rounded border px-1.5 py-0.5 text-xs font-semibold ${colorCls}`}>{fmtPct(p)}</span>
                <span className="text-gray-400 text-sm">→</span>
              </div>
              {/* Last step: show the "to" box too */}
              {i === steps.length - 1 && (
                <div className="flex flex-col items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center dark:border-gray-600 dark:bg-gray-700 min-w-[80px]">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{step.to}</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{step.toVal}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ReportBarChart — multi-metric selector
// ---------------------------------------------------------------------------

const BAR_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#c084fc', '#d8b4fe', '#818cf8']

function ReportBarChart({
  data,
  nameKey,
  metrics,
  defaultMetric,
  maxBars = 12,
}: {
  data: object[]
  nameKey: string
  metrics: { key: string; label: string }[]
  defaultMetric?: string
  maxBars?: number
}) {
  const [activeMetric, setActiveMetric] = useState(defaultMetric ?? metrics[0]?.key ?? '')

  const activeLabel = useMemo(
    () => metrics.find((m) => m.key === activeMetric)?.label ?? activeMetric,
    [metrics, activeMetric]
  )

  const chartData = useMemo(() => {
    const safe = Array.isArray(data)
      ? data.filter((r): r is Record<string, unknown> => r != null && typeof r === 'object')
      : []
    return safe
      .slice(0, maxBars)
      .map((r) => ({
        name: String(safeVal(r, nameKey) || '').slice(0, 18),
        value: Number(safeVal(r, activeMetric)) || 0,
      }))
      .filter((d) => d.name && d.name !== 'Total')
  }, [data, nameKey, activeMetric, maxBars])

  if (chartData.length === 0) return null

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">By Recruiter</h4>
        <div className="ml-auto flex flex-wrap gap-1">
          {metrics.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setActiveMetric(m.key)}
              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                activeMetric === m.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" name={activeLabel} radius={4}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SafeTable — with export + vs-target column
// ---------------------------------------------------------------------------

function SafeTable({
  title,
  rows,
  columnKeys,
  columnLabels,
  totalRow,
  highlightTotalRow,
  searchPlaceholder,
  searchColumnKey,
  numericColumnKeys,
  onExport,
  targetColumn,
  targets,
}: {
  title: string
  rows: object[]
  columnKeys: string[]
  columnLabels: string[]
  totalRow?: object | null
  highlightTotalRow?: boolean
  searchPlaceholder?: string
  searchColumnKey?: string
  numericColumnKeys?: string[]
  onExport?: () => void
  targetColumn?: string
  targets?: Record<string, number>
}) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const safeRows = useMemo(
    () => (Array.isArray(rows) ? rows.filter((r): r is Record<string, unknown> => r != null && typeof r === 'object') : []),
    [rows]
  )
  const safeLabels = Array.isArray(columnLabels) ? columnLabels : columnKeys
  const nameKey = searchColumnKey ?? columnKeys[0] ?? ''
  const numericKeys = useMemo(() => new Set(numericColumnKeys ?? columnKeys.slice(1)), [numericColumnKeys, columnKeys])

  // Determine if we should show "vs Target" column
  const showTargetCol = useMemo(() => {
    if (!targets || Object.keys(targets).length === 0 || !targetColumn) return false
    return safeRows.some((r) => {
      const id = String(safeVal(r, 'recruiter_id') || safeVal(r, 'recruiter_name'))
      return id && targets[id] != null
    })
  }, [targets, targetColumn, safeRows])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return safeRows
    return safeRows.filter((r) => String(safeVal(r, nameKey)).toLowerCase().includes(q))
  }, [safeRows, search, nameKey])

  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows
    return [...filteredRows].sort((a, b) => {
      const va = safeVal(a, sortKey)
      const vb = safeVal(b, sortKey)
      const isNum = numericKeys.has(sortKey)
      const aVal = isNum ? Number(va) || 0 : String(va)
      const bVal = isNum ? Number(vb) || 0 : String(vb)
      if (isNum) return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
      return sortDir === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal))
    })
  }, [filteredRows, sortKey, sortDir, numericKeys])

  const handleSort = (k: string) => {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k)
      setSortDir('asc')
    }
  }

  const renderTargetCell = (row: Record<string, unknown>): React.ReactNode => {
    if (!showTargetCol || !targets || !targetColumn) return null
    const id = String(safeVal(row, 'recruiter_id') || safeVal(row, 'recruiter_name'))
    const target = targets[id]
    if (target == null) return <td className="px-3 py-2.5 text-gray-400 dark:text-gray-500">—</td>
    const actual = Number(safeVal(row, targetColumn)) || 0
    const met = actual >= target
    return (
      <td className="px-3 py-2.5">
        <span className={`text-sm font-medium ${met ? 'text-green-600' : 'text-red-500'}`}>
          {actual}/{target} {met ? '✓' : '✗'}
        </span>
      </td>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-2 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
        <div className="flex items-center gap-2">
          {searchColumnKey && (
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder ?? `Search…`}
              className="w-48 rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          )}
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              ↓ Export
            </button>
          )}
        </div>
      </div>
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-gray-700">
            <tr className="border-b-2 border-slate-200 dark:border-gray-600">
              {columnKeys.map((k, i) => (
                <th
                  key={String(k)}
                  className="cursor-pointer select-none px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort(k)}
                >
                  <span className="inline-flex items-center gap-1">
                    {safeLabels[i] ?? k}
                    {sortKey === k && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                  </span>
                </th>
              ))}
              {showTargetCol && (
                <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">vs Target</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, idx) => {
              const isTotal =
                highlightTotalRow &&
                (safeVal(row, 'recruiter_name') === 'Total' ||
                  safeVal(row, 'recruiter_id') === '' ||
                  (row as Record<string, unknown>).recruiter_id == null)
              const isEven = idx % 2 === 0
              const rowBg = isTotal
                ? 'bg-amber-50/50 dark:bg-amber-900/10'
                : isEven
                  ? 'bg-white dark:bg-gray-800'
                  : 'bg-slate-50/80 dark:bg-gray-700/40'
              return (
                <tr
                  key={idx}
                  className={`border-b border-gray-100 dark:border-gray-700 transition-colors hover:bg-indigo-50/60 dark:hover:bg-indigo-900/20 ${
                    isTotal ? 'border-t-2 border-gray-300 font-medium dark:border-gray-600 ' + rowBg : rowBg
                  }`}
                >
                  {columnKeys.map((k) => (
                    <td key={String(k)} className="px-3 py-2.5 text-gray-800 dark:text-gray-200">
                      {safeVal(row, k)}
                    </td>
                  ))}
                  {showTargetCol && renderTargetCell(row)}
                </tr>
              )
            })}
            {totalRow != null && typeof totalRow === 'object' && Object.keys(totalRow).length > 0 && (
              <tr className="border-t-2 border-gray-300 bg-amber-100/70 font-semibold text-gray-900 dark:border-gray-600 dark:bg-amber-900/20 dark:text-amber-100">
                <td className="px-3 py-2.5">Total</td>
                {columnKeys.slice(1).map((k) => (
                  <td key={String(k)} className="px-3 py-2.5">
                    {typeof safeVal(totalRow, k) === 'number' ? safeVal(totalRow, k) : Number(safeVal(totalRow, k)) || 0}
                  </td>
                ))}
                {showTargetCol && <td className="px-3 py-2.5" />}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// BackendNotImplemented
// ---------------------------------------------------------------------------

function BackendNotImplemented() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
      <p className="font-medium">Backend not implemented yet</p>
      <p className="mt-1 text-sm">
        See{' '}
        <code className="rounded bg-amber-200 px-1 dark:bg-amber-800">docs/ADMIN_RECRUITER_PERFORMANCE_APIS.md</code>{' '}
        for the API specification.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SearchableRecruiterDropdown
// ---------------------------------------------------------------------------

type RecruiterOption = { id: string; name: string }

function SearchableRecruiterDropdown({
  options,
  value,
  onChange,
  placeholder = 'Search recruiter by name…',
  disabled,
}: {
  options: RecruiterOption[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = useMemo(() => options.find((o) => o.id === value), [options, value])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.name.toLowerCase().includes(q))
  }, [options, query])

  useEffect(() => {
    if (!open) return
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  const listboxId = 'recruiter-dropdown-listbox'
  return (
    <div ref={containerRef} className="relative min-w-[220px]">
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        onClick={() => !disabled && setOpen((o) => !o)}
      >
        <span className={selected ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
          {selected ? selected.name : placeholder}
        </span>
        <span className="ml-2 text-gray-500">▼</span>
      </div>
      {open && (
        <div className="absolute top-full left-0 z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="Type to search…"
            className="w-full border-b border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            autoFocus
          />
          <ul id={listboxId} role="listbox" className="py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">No recruiters found</li>
            )}
            {filtered.map((o) => (
              <li
                key={o.id}
                role="option"
                aria-selected={value === o.id}
                className={`cursor-pointer px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${value === o.id ? 'bg-indigo-50 font-medium dark:bg-indigo-900/30' : ''}`}
                onClick={() => {
                  onChange(o.id)
                  setQuery('')
                  setOpen(false)
                }}
              >
                {o.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Targets Modal
// ---------------------------------------------------------------------------

function TargetsModal({
  rows,
  targets,
  onSave,
  onClose,
}: {
  rows: object[]
  targets: Record<string, number>
  onSave: (t: Record<string, number>) => void
  onClose: () => void
}) {
  const [local, setLocal] = useState<Record<string, number>>({ ...targets })

  const recruiters = useMemo(() => {
    const safe = Array.isArray(rows)
      ? rows.filter((r): r is Record<string, unknown> => r != null && typeof r === 'object')
      : []
    return safe
      .filter((r) => {
        const name = String(safeVal(r, 'recruiter_name'))
        const id = String(safeVal(r, 'recruiter_id'))
        return name && name !== 'Total' && id && id.trim() !== ''
      })
      .map((r) => ({
        id: String(safeVal(r, 'recruiter_id')),
        name: String(safeVal(r, 'recruiter_name')),
      }))
  }, [rows])

  const handleChange = (id: string, val: string) => {
    const n = parseInt(val, 10)
    setLocal((prev) => {
      if (!val || isNaN(n)) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: n }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Set Daily Targets (Attempts)</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto p-4 space-y-3">
          {recruiters.length === 0 && (
            <p className="text-sm text-gray-500">Load DOD report first to see recruiters.</p>
          )}
          {recruiters.map((r) => (
            <div key={r.id} className="flex items-center gap-3">
              <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{r.name}</span>
              <input
                type="number"
                min={0}
                value={local[r.id] ?? local[r.name] ?? ''}
                onChange={(e) => {
                  handleChange(r.id, e.target.value)
                  handleChange(r.name, e.target.value)
                }}
                placeholder="—"
                className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(local)
              onClose()
            }}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// NegativeFunnelImproved
// ---------------------------------------------------------------------------

const REMARK_BAR_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#6366f1',
]

interface RemarkRow {
  remark: string
  total: number
  by_job_role?: { job_role_name: string; count: number }[]
}

function NegativeFunnelImproved({ data }: { data: RecruiterPerformanceNegativeFunnelResponse }) {
  const [jobRoleFilter, setJobRoleFilter] = useState<string>('All')

  const remarks = useMemo((): RemarkRow[] => {
    if (!Array.isArray(data.remarks)) return []
    return [...data.remarks]
      .filter((r): r is NegativeFunnelRemark => r != null && typeof r === 'object')
      .map((r): RemarkRow => ({ remark: r.remark, total: r.total, by_job_role: r.by_job_role }))
      .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
  }, [data.remarks])

  const jobRoles = useMemo(() => {
    const totalsByJobRole = Array.isArray(data.totals_by_job_role) ? data.totals_by_job_role : []
    return totalsByJobRole
      .map((r) => (r != null && typeof r === 'object' ? (r as { job_role_name?: string }).job_role_name : null))
      .filter((n): n is string => n != null && n !== '')
  }, [data.totals_by_job_role])

  const grandTotal = data.grand_total ?? 0

  // KPI items
  const mostCommon = remarks[0]?.remark ?? '—'
  const uniqueReasons = remarks.length
  const topAffectedRole = useMemo(() => {
    const totalsByJobRole = Array.isArray(data.totals_by_job_role) ? data.totals_by_job_role : []
    if (!totalsByJobRole.length) return '—'
    const sorted = [...totalsByJobRole].sort((a, b) => {
      const at = (a as { total?: number; count?: number }).total ?? (a as { count?: number }).count ?? 0
      const bt = (b as { total?: number; count?: number }).total ?? (b as { count?: number }).count ?? 0
      return bt - at
    })
    return (sorted[0] as { job_role_name?: string }).job_role_name ?? '—'
  }, [data.totals_by_job_role])

  // Bar chart data
  const barData = useMemo(
    () =>
      remarks.slice(0, 12).map((r) => ({
        name: (r.remark ?? '').slice(0, 20),
        value: r.total ?? 0,
        pct: pct(r.total ?? 0, grandTotal),
      })),
    [remarks, grandTotal]
  )

  // Table rows with optional job-role filter
  const tableRemarks = useMemo(() => {
    if (jobRoleFilter === 'All') return remarks
    return remarks.map((r) => {
      const byRole = Array.isArray(r.by_job_role)
        ? r.by_job_role.find((x) => x.job_role_name === jobRoleFilter)
        : null
      return { ...r, filteredCount: byRole?.count ?? 0 }
    })
  }, [remarks, jobRoleFilter])

  const remarkPctColor = (p: number) => {
    if (p > 15) return 'text-red-600 font-semibold'
    if (p >= 5) return 'text-amber-600 font-medium'
    return 'text-green-600'
  }

  return (
    <div className="space-y-4">
      {/* KPI mini-cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Grand Total', value: grandTotal },
          { label: 'Most Common Reason', value: mostCommon },
          { label: 'Unique Reasons', value: uniqueReasons },
          { label: 'Top Job Role Affected', value: topAffectedRole },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-3 shadow-sm dark:border-gray-600 dark:from-gray-800 dark:to-gray-800">
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
            <p className="mt-1 text-base font-bold text-gray-900 dark:text-white truncate" title={String(value)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Top 3 pill badges */}
      {remarks.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Top Reasons:</span>
          {remarks.slice(0, 3).map((r, i) => (
            <span
              key={i}
              className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
            >
              #{i + 1} {r.remark} ({pct(r.total, grandTotal)}%)
            </span>
          ))}
        </div>
      )}

      {/* Horizontal bar chart */}
      {barData.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Remarks Distribution</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 4, right: 40, left: 0, bottom: 4 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value: number, _name: string, props: { payload?: { pct?: number } }) => [
                    `${value} (${props.payload?.pct ?? 0}%)`,
                    'Count',
                  ]}
                />
                <Bar dataKey="value" name="Count" radius={4}>
                  {barData.map((_, i) => (
                    <Cell key={i} fill={REMARK_BAR_COLORS[i % REMARK_BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Job role filter */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Job Role:</label>
        <select
          value={jobRoleFilter}
          onChange={(e) => setJobRoleFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="All">All</option>
          {jobRoles.map((jr) => (
            <option key={jr} value={jr}>{jr}</option>
          ))}
        </select>
      </div>

      {/* Detailed table */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-4 py-2 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Not Interested Remarks{data.date ? ` — ${data.date}` : data.month ? ` — ${data.month}` : ''}
            {jobRoleFilter !== 'All' ? ` (${jobRoleFilter})` : ''}
          </h3>
        </div>
        <div className="max-h-[360px] overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-gray-700">
              <tr className="border-b-2 border-slate-200 dark:border-gray-600">
                <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Remark</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                  {jobRoleFilter === 'All' ? 'Total' : jobRoleFilter}
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">% of Total</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Relative</th>
              </tr>
            </thead>
            <tbody>
              {tableRemarks.map((r, idx) => {
                const count = jobRoleFilter === 'All' ? r.total : (r as RemarkRow & { filteredCount?: number }).filteredCount ?? 0
                const p = pct(count, grandTotal)
                const barWidth = grandTotal > 0 ? Math.round((count / grandTotal) * 100) : 0
                const isEven = idx % 2 === 0
                return (
                  <tr
                    key={idx}
                    className={`border-b border-gray-100 dark:border-gray-700 hover:bg-indigo-50/60 dark:hover:bg-indigo-900/20 ${isEven ? 'bg-white dark:bg-gray-800' : 'bg-slate-50/80 dark:bg-gray-700/40'}`}
                  >
                    <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-gray-200">{r.remark}</td>
                    <td className="px-3 py-2.5 font-bold text-gray-900 dark:text-white">{count}</td>
                    <td className={`px-3 py-2.5 ${remarkPctColor(p)}`}>{fmtPct(p)}</td>
                    <td className="px-3 py-2.5 w-32">
                      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-600">
                        <div
                          className="h-2 rounded-full bg-indigo-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
              <tr className="border-t-2 border-gray-300 bg-amber-100/70 font-semibold text-gray-900 dark:border-gray-600 dark:bg-amber-900/20 dark:text-amber-100">
                <td className="px-3 py-2.5">Total</td>
                <td className="px-3 py-2.5">{grandTotal}</td>
                <td className="px-3 py-2.5">100%</td>
                <td className="px-3 py-2.5" />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const DOD_COLUMNS = [
  'recruiter_name',
  'assigned',
  'attempt',
  'connected',
  'interested',
  'call_back_later',
  'not_interested',
  'interview_sched',
  'sched_next_day',
  'today_selection',
  'rejected',
  'today_joining',
  'interview_done',
  'interview_pending',
]
const DOD_LABELS = [
  'Recruiter',
  'Assigned',
  'Attempt',
  'Connected',
  'Interested',
  'Call Back Later',
  'Not Interested',
  'Interview Sched',
  'Sched Next Day',
  'Today Selection',
  'Rejected',
  'Today Joining',
  'Interview Done',
  'Interview Pending',
]

const MTD_COLUMNS = [
  'recruiter_name',
  'assigned',
  'attempt',
  'connected',
  'interested',
  'not_interested',
  'interview_sched',
  'sched_next_day',
  'rejected',
  'selection',
  'total_joining',
  'yet_to_join',
  'backout',
  'hold',
]
const MTD_LABELS = [
  'Recruiter',
  'Assigned',
  'Attempt',
  'Connected',
  'Interested',
  'Not Interested',
  'Interview Sched',
  'Sched Next Day',
  'Rejected',
  'Selection',
  'Total Joining',
  'Yet To Join',
  'Backout',
  'Hold',
]

const COMPANY_COLUMNS = [
  'company_name',
  'current_openings',
  'total_screened',
  'interview_scheduled',
  'interview_done',
  'interview_pending',
  'rejected',
  'selected',
  'joined',
  'not_joined',
  'yet_to_join',
  'backout',
]
const COMPANY_LABELS = [
  'Company',
  'Active Roles',
  'Total Screened',
  'Int Scheduled',
  'Int Done',
  'Int Pending',
  'Rejected',
  'Selected',
  'Joined',
  'Not Joined',
  'Yet To Join',
  'Backout',
]

const INTERVIEW_STATUS_COLUMNS = [
  'company_name',
  'int_sched',
  'int_done',
  'inter_pending',
  'selected',
  'joined',
  'on_hold',
  'yet_to_join',
  'backout',
]
const INTERVIEW_STATUS_LABELS = [
  'Company',
  'Int Sched',
  'Int Done',
  'Inter Pending',
  'Selected',
  'Joined',
  'On Hold',
  'Yet To Join',
  'Backout',
]

const DOD_METRICS = [
  { key: 'attempt', label: 'Attempts' },
  { key: 'connected', label: 'Connected' },
  { key: 'interested', label: 'Interested' },
  { key: 'interview_sched', label: 'Interviews' },
  { key: 'interview_done', label: 'Int Done' },
  { key: 'today_selection', label: 'Selected' },
]

const MTD_METRICS = [
  { key: 'attempt', label: 'Attempts' },
  { key: 'connected', label: 'Connected' },
  { key: 'interested', label: 'Interested' },
  { key: 'not_interested', label: 'Not Interested' },
  { key: 'interview_sched', label: 'Interviews' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'selection', label: 'Selected' },
  { key: 'total_joining', label: 'Joined' },
]

const TARGETS_LS_KEY = 'admin_perf_targets'

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AdminRecruiterPerformancePage() {
  const [tab, setTab] = useState<TabId>('dod')
  const [dod, setDod] = useState<RecruiterPerformanceDODResponse | null | undefined>(undefined)
  const [dodPrev, setDodPrev] = useState<RecruiterPerformanceDODResponse | null | undefined>(undefined)
  const [mtd, setMtd] = useState<RecruiterPerformanceMTDResponse | null | undefined>(undefined)
  const [companyWise, setCompanyWise] = useState<RecruiterPerformanceCompanyWiseResponse | null | undefined>(undefined)
  const [negativeFunnel, setNegativeFunnel] = useState<RecruiterPerformanceNegativeFunnelResponse | null | undefined>(undefined)
  const [interviewStatus, setInterviewStatus] = useState<RecruiterPerformanceInterviewStatusResponse | null | undefined>(undefined)
  const [individual, setIndividual] = useState<RecruiterPerformanceIndividualResponse | null | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [dodDate, setDodDate] = useState('')
  const [mtdMonth, setMtdMonth] = useState('')
  const [individualRecruiterId, setIndividualRecruiterId] = useState('')
  const [individualPeriod, setIndividualPeriod] = useState<'dod' | 'mtd'>('mtd')
  const [individualLoading, setIndividualLoading] = useState(false)
  const [targets, setTargets] = useState<Record<string, number>>({})
  const [showTargetsModal, setShowTargetsModal] = useState(false)

  // Load targets from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TARGETS_LS_KEY)
      if (raw) setTargets(JSON.parse(raw))
    } catch {
      // ignore
    }
  }, [])

  const saveTargets = useCallback((t: Record<string, number>) => {
    setTargets(t)
    try {
      localStorage.setItem(TARGETS_LS_KEY, JSON.stringify(t))
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (!dodDate) setDodDate(new Date().toISOString().slice(0, 10))
    if (!mtdMonth) setMtdMonth(new Date().toISOString().slice(0, 7))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // DOD + prev-week DOD
  useEffect(() => {
    if (!dodDate) return
    setLoading(true)
    getRecruiterPerformanceDOD({ date: dodDate })
      .then(setDod)
      .finally(() => setLoading(false))

    const prevDate = new Date(dodDate)
    prevDate.setDate(prevDate.getDate() - 7)
    getRecruiterPerformanceDOD({ date: prevDate.toISOString().slice(0, 10) }).then(setDodPrev)
  }, [dodDate])

  useEffect(() => {
    if (tab !== 'mtd' || !mtdMonth) return
    setLoading(true)
    getRecruiterPerformanceMTD({ month: mtdMonth }).then(setMtd).finally(() => setLoading(false))
  }, [tab, mtdMonth])

  useEffect(() => {
    if (tab !== 'company' || !mtdMonth) return
    setLoading(true)
    getRecruiterPerformanceCompanyWise({ month: mtdMonth }).then(setCompanyWise).finally(() => setLoading(false))
  }, [tab, mtdMonth])

  useEffect(() => {
    if (tab !== 'negative' || !dodDate) return
    setLoading(true)
    getRecruiterPerformanceNegativeFunnel({ date: dodDate }).then(setNegativeFunnel).finally(() => setLoading(false))
  }, [tab, dodDate])

  useEffect(() => {
    if (tab !== 'interview-status' || !dodDate) return
    setLoading(true)
    getRecruiterPerformanceInterviewStatusCompany({ date: dodDate }).then(setInterviewStatus).finally(() => setLoading(false))
  }, [tab, dodDate])

  const loadIndividual = () => {
    if (!individualRecruiterId.trim()) return
    setIndividualLoading(true)
    setIndividual(undefined)
    getRecruiterPerformanceIndividual({
      recruiter_id: individualRecruiterId.trim(),
      period: individualPeriod,
      date: individualPeriod === 'dod' ? dodDate : undefined,
      month: individualPeriod === 'mtd' ? mtdMonth : undefined,
    })
      .then(setIndividual)
      .finally(() => setIndividualLoading(false))
  }

  const notImplemented = (data: unknown) => data === null

  // ---------------------------------------------------------------------------
  // DOD helpers
  // ---------------------------------------------------------------------------
  const dodDerivedData = useMemo(() => {
    if (dod == null || typeof dod !== 'object') return null
    const raw = Array.isArray(dod.rows) ? dod.rows : []
    const totalBackend = dod.total != null && typeof dod.total === 'object' ? dod.total : null
    const totalFromRows = raw.find(
      (r) => r != null && (safeVal(r, 'recruiter_name') === 'Total' || r.recruiter_id == null)
    )
    const dataRows = totalFromRows ? raw.filter((r) => r !== totalFromRows) : raw
    const bodyRows = dataRows.length > 0 ? dataRows : totalFromRows ? [totalFromRows] : []
    const footerTotal = dataRows.length > 0 ? (totalBackend ?? totalFromRows ?? null) : null
    const tot = footerTotal ?? totalFromRows
    return { raw, dataRows, bodyRows, footerTotal, tot }
  }, [dod])

  const dodPrevTot = useMemo(() => {
    if (dodPrev == null || typeof dodPrev !== 'object') return null
    const raw = Array.isArray(dodPrev.rows) ? dodPrev.rows : []
    const totalBackend = dodPrev.total != null && typeof dodPrev.total === 'object' ? dodPrev.total : null
    const totalFromRows = raw.find(
      (r) => r != null && (safeVal(r, 'recruiter_name') === 'Total' || r.recruiter_id == null)
    )
    return totalBackend ?? totalFromRows ?? null
  }, [dodPrev])

  // ---------------------------------------------------------------------------
  // MTD helpers
  // ---------------------------------------------------------------------------
  const mtdDerivedData = useMemo(() => {
    if (mtd == null || typeof mtd !== 'object') return null
    const raw = Array.isArray(mtd.rows) ? mtd.rows : []
    const totalBackend = mtd.total != null && typeof mtd.total === 'object' ? mtd.total : null
    const totalFromRows = raw.find(
      (r) => r != null && (safeVal(r, 'recruiter_name') === 'Total' || r.recruiter_id == null)
    )
    const dataRows = totalFromRows ? raw.filter((r) => r !== totalFromRows) : raw
    const bodyRows = dataRows.length > 0 ? dataRows : totalFromRows ? [totalFromRows] : []
    const footerTotal = dataRows.length > 0 ? (totalBackend ?? totalFromRows ?? null) : null
    const tot = footerTotal ?? totalFromRows
    return { raw, dataRows, bodyRows, footerTotal, tot }
  }, [mtd])

  // ---------------------------------------------------------------------------
  // Individual recruiter options
  // ---------------------------------------------------------------------------
  const recruiterOptions: RecruiterOption[] = useMemo(() => {
    const rawRows = ([...(dod?.rows ?? []), ...(mtd?.rows ?? [])]) as {
      recruiter_id?: string
      recruiter_name?: string
    }[]
    const seen = new Set<string>()
    return rawRows
      .filter((r) => r != null && r.recruiter_name !== 'Total' && r.recruiter_id != null && String(r.recruiter_id).trim() !== '')
      .map((r) => ({ id: String(r.recruiter_id), name: String(r.recruiter_name ?? r.recruiter_id) }))
      .filter((o) => {
        if (seen.has(o.id)) return false
        seen.add(o.id)
        return true
      })
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  }, [dod, mtd])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recruiter Performance Dashboard</h1>
      </div>

      {/* Targets modal */}
      {showTargetsModal && dodDerivedData && (
        <TargetsModal
          rows={dodDerivedData.bodyRows}
          targets={targets}
          onSave={saveTargets}
          onClose={() => setShowTargetsModal(false)}
        />
      )}

      {/* Filter bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
          <input
            type="date"
            value={dodDate}
            onChange={(e) => setDodDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Month</label>
          <input
            type="month"
            value={mtdMonth}
            onChange={(e) => setMtdMonth(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'dod' as TabId, label: 'Day Report (DOD)' },
            { id: 'mtd' as TabId, label: 'Month Report (MTD)' },
            { id: 'individual' as TabId, label: 'Individual' },
            { id: 'company' as TabId, label: 'Company-wise' },
            { id: 'negative' as TabId, label: 'Negative Funnel' },
            { id: 'interview-status' as TabId, label: 'Interview Status' },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[200px] rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        {/* ---------------------------------------------------------------- DOD */}
        {tab === 'dod' && (
          <div className="space-y-4">
            {loading && dod === undefined && <p className="text-gray-500">Loading…</p>}
            {!loading && notImplemented(dod) && <BackendNotImplemented />}
            {!loading && dodDerivedData && (() => {
              const { dataRows, bodyRows, footerTotal, tot } = dodDerivedData
              const kpiItems: KPIItem[] = tot && typeof tot === 'object'
                ? [
                    { label: 'Assigned', value: safeVal(tot, 'assigned') },
                    { label: 'Attempt', value: safeVal(tot, 'attempt') },
                    { label: 'Connected', value: safeVal(tot, 'connected') },
                    { label: 'Interested', value: safeVal(tot, 'interested') },
                    { label: 'Interview Sched', value: safeVal(tot, 'interview_sched') },
                    { label: 'Today Joining', value: safeVal(tot, 'today_joining') },
                    { label: 'Interview Done', value: safeVal(tot, 'interview_done') },
                    { label: 'Interview Pending', value: safeVal(tot, 'interview_pending') },
                  ]
                : []

              const prevKpiItems: KPIItem[] | undefined = dodPrevTot && typeof dodPrevTot === 'object'
                ? [
                    { label: 'Assigned', value: safeVal(dodPrevTot, 'assigned') },
                    { label: 'Attempt', value: safeVal(dodPrevTot, 'attempt') },
                    { label: 'Connected', value: safeVal(dodPrevTot, 'connected') },
                    { label: 'Interested', value: safeVal(dodPrevTot, 'interested') },
                    { label: 'Interview Sched', value: safeVal(dodPrevTot, 'interview_sched') },
                    { label: 'Today Joining', value: safeVal(dodPrevTot, 'today_joining') },
                    { label: 'Interview Done', value: safeVal(dodPrevTot, 'interview_done') },
                    { label: 'Interview Pending', value: safeVal(dodPrevTot, 'interview_pending') },
                  ]
                : undefined

              const funnelSteps: FunnelStep[] = tot && typeof tot === 'object'
                ? [
                    { from: 'Attempt', to: 'Connected', fromVal: Number(safeVal(tot, 'attempt')) || 0, toVal: Number(safeVal(tot, 'connected')) || 0 },
                    { from: 'Connected', to: 'Interested', fromVal: Number(safeVal(tot, 'connected')) || 0, toVal: Number(safeVal(tot, 'interested')) || 0 },
                    { from: 'Interested', to: 'Int Sched', fromVal: Number(safeVal(tot, 'interested')) || 0, toVal: Number(safeVal(tot, 'interview_sched')) || 0 },
                    { from: 'Int Sched', to: 'Int Done', fromVal: Number(safeVal(tot, 'interview_sched')) || 0, toVal: Number(safeVal(tot, 'interview_done')) || 0 },
                    { from: 'Int Done', to: 'Selected', fromVal: Number(safeVal(tot, 'interview_done')) || 0, toVal: Number(safeVal(tot, 'today_selection')) || 0 },
                    { from: 'Selected', to: 'Joined', fromVal: Number(safeVal(tot, 'today_selection')) || 0, toVal: Number(safeVal(tot, 'today_joining')) || 0 },
                  ]
                : []

              return (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                      Day Report (DOD) — {dod?.date ?? dodDate}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setShowTargetsModal(true)}
                      className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      🎯 Set Targets
                    </button>
                  </div>
                  <KPICards items={kpiItems} prevItems={prevKpiItems} />
                  {funnelSteps.length > 0 && <ConversionFunnel steps={funnelSteps} />}
                  {dataRows.length > 0 && (
                    <ReportBarChart
                      data={dataRows}
                      nameKey="recruiter_name"
                      metrics={DOD_METRICS}
                      defaultMetric="attempt"
                      maxBars={12}
                    />
                  )}
                  <SafeTable
                    title={`Day Report (DOD) — ${dod?.date ?? dodDate}`}
                    rows={bodyRows}
                    columnKeys={DOD_COLUMNS}
                    columnLabels={DOD_LABELS}
                    totalRow={footerTotal}
                    highlightTotalRow
                    searchPlaceholder="Search recruiter…"
                    searchColumnKey="recruiter_name"
                    numericColumnKeys={DOD_COLUMNS.slice(1)}
                    targets={targets}
                    targetColumn="attempt"
                    onExport={() =>
                      exportToXlsx(
                        `DOD_${dod?.date ?? dodDate}`,
                        DOD_LABELS,
                        bodyRows,
                        DOD_COLUMNS
                      )
                    }
                  />
                </div>
              )
            })()}
          </div>
        )}

        {/* ---------------------------------------------------------------- MTD */}
        {tab === 'mtd' && (
          <div className="space-y-4">
            {loading && mtd === undefined && <p className="text-gray-500">Loading…</p>}
            {!loading && notImplemented(mtd) && <BackendNotImplemented />}
            {!loading && mtdDerivedData && (() => {
              const { dataRows, bodyRows, footerTotal, tot } = mtdDerivedData
              const kpiItems: KPIItem[] = tot && typeof tot === 'object'
                ? [
                    { label: 'Assigned', value: safeVal(tot, 'assigned') },
                    { label: 'Attempt', value: safeVal(tot, 'attempt') },
                    { label: 'Connected', value: safeVal(tot, 'connected') },
                    { label: 'Interested', value: safeVal(tot, 'interested') },
                    { label: 'Interview Sched', value: safeVal(tot, 'interview_sched') },
                    { label: 'Selection', value: safeVal(tot, 'selection') },
                    { label: 'Total Joining', value: safeVal(tot, 'total_joining') },
                    { label: 'Hold', value: safeVal(tot, 'hold') },
                  ]
                : []

              const funnelSteps: FunnelStep[] = tot && typeof tot === 'object'
                ? [
                    { from: 'Attempt', to: 'Connected', fromVal: Number(safeVal(tot, 'attempt')) || 0, toVal: Number(safeVal(tot, 'connected')) || 0 },
                    { from: 'Connected', to: 'Interested', fromVal: Number(safeVal(tot, 'connected')) || 0, toVal: Number(safeVal(tot, 'interested')) || 0 },
                    { from: 'Interested', to: 'Int Sched', fromVal: Number(safeVal(tot, 'interested')) || 0, toVal: Number(safeVal(tot, 'interview_sched')) || 0 },
                    { from: 'Int Sched', to: 'Selected', fromVal: Number(safeVal(tot, 'interview_sched')) || 0, toVal: Number(safeVal(tot, 'selection')) || 0 },
                    { from: 'Selected', to: 'Joined', fromVal: Number(safeVal(tot, 'selection')) || 0, toVal: Number(safeVal(tot, 'total_joining')) || 0 },
                  ]
                : []

              return (
                <div className="space-y-4">
                  <KPICards items={kpiItems} />
                  {funnelSteps.length > 0 && <ConversionFunnel steps={funnelSteps} />}
                  {dataRows.length > 0 && (
                    <ReportBarChart
                      data={dataRows}
                      nameKey="recruiter_name"
                      metrics={MTD_METRICS}
                      defaultMetric="attempt"
                      maxBars={12}
                    />
                  )}
                  <SafeTable
                    title={`Month Report (MTD) — ${mtd?.month ?? mtdMonth}`}
                    rows={bodyRows}
                    columnKeys={MTD_COLUMNS}
                    columnLabels={MTD_LABELS}
                    totalRow={footerTotal}
                    highlightTotalRow
                    searchPlaceholder="Search recruiter…"
                    searchColumnKey="recruiter_name"
                    numericColumnKeys={MTD_COLUMNS.slice(1)}
                    onExport={() =>
                      exportToXlsx(
                        `MTD_${mtd?.month ?? mtdMonth}`,
                        MTD_LABELS,
                        bodyRows,
                        MTD_COLUMNS
                      )
                    }
                  />
                </div>
              )
            })()}
          </div>
        )}

        {/* ------------------------------------------------------------ Individual */}
        {tab === 'individual' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Recruiter</label>
              <SearchableRecruiterDropdown
                options={recruiterOptions}
                value={individualRecruiterId}
                onChange={setIndividualRecruiterId}
                placeholder={recruiterOptions.length === 0 ? 'Load Day/Month report for list…' : 'Search recruiter by name…'}
                disabled={individualLoading}
              />
              {recruiterOptions.length === 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">Load Day or Month report first to populate recruiters.</span>
              )}
              <select
                value={individualPeriod}
                onChange={(e) => setIndividualPeriod(e.target.value as 'dod' | 'mtd')}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="dod">Day (DOD)</option>
                <option value="mtd">Month (MTD)</option>
              </select>
              <button
                type="button"
                onClick={loadIndividual}
                disabled={individualLoading || !individualRecruiterId.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {individualLoading ? 'Loading…' : 'Load'}
              </button>
            </div>
            {individualLoading && <p className="text-gray-500">Loading…</p>}
            {!individualLoading && notImplemented(individual) && <BackendNotImplemented />}
            {!individualLoading && individual != null && typeof individual === 'object' && (
              <div className="space-y-4">
                <KPICards
                  items={[
                    { label: 'Assigned', value: safeVal(individual, 'assigned') },
                    { label: 'Connected', value: safeVal(individual, 'connected') },
                    { label: 'Interview Sched', value: safeVal(individual, 'interview_sched') },
                    { label: 'Selection', value: safeVal(individual, 'selection') },
                    { label: 'Total Joining', value: safeVal(individual, 'total_joining') },
                    { label: 'Hold', value: safeVal(individual, 'hold') },
                  ]}
                />
                <SafeTable
                  title={`Individual — ${(individual.period ?? '').toUpperCase()} ${individual.month ?? individual.date ?? ''}`}
                  rows={[individual]}
                  columnKeys={MTD_COLUMNS}
                  columnLabels={MTD_LABELS}
                  numericColumnKeys={MTD_COLUMNS.slice(1)}
                  onExport={() =>
                    exportToXlsx(
                      `Individual_${individualRecruiterId}_${individual.month ?? individual.date ?? ''}`,
                      MTD_LABELS,
                      [individual],
                      MTD_COLUMNS
                    )
                  }
                />
              </div>
            )}
            {!individualLoading && individual === undefined && !individualRecruiterId.trim() && (
              <p className="text-gray-500">Enter Recruiter ID and click Load.</p>
            )}
          </div>
        )}

        {/* --------------------------------------------------------- Company-wise */}
        {tab === 'company' && (
          <div className="space-y-4">
            {loading && companyWise === undefined && <p className="text-gray-500">Loading…</p>}
            {!loading && notImplemented(companyWise) && <BackendNotImplemented />}
            {!loading && companyWise != null && typeof companyWise === 'object' && (() => {
              const tot = companyWise.total != null && typeof companyWise.total === 'object' ? companyWise.total : null
              const rows = Array.isArray(companyWise.rows) ? companyWise.rows : []
              const kpiItems: KPIItem[] = tot
                ? [
                    { label: 'Active Roles (Demand)', value: safeVal(tot, 'current_openings') },
                    { label: 'Total Screened (Supply)', value: safeVal(tot, 'total_screened') },
                    { label: 'Int Scheduled', value: safeVal(tot, 'interview_scheduled') },
                    { label: 'Int Done', value: safeVal(tot, 'interview_done') },
                    { label: 'Selected', value: safeVal(tot, 'selected') },
                    { label: 'Joined', value: safeVal(tot, 'joined') },
                    { label: 'Yet To Join', value: safeVal(tot, 'yet_to_join') },
                    { label: 'Backout', value: safeVal(tot, 'backout') },
                    { label: 'Rejected', value: safeVal(tot, 'rejected') },
                  ]
                : []
              return (
                <div className="space-y-4">
                  <KPICards items={kpiItems} />
                  {rows.length > 0 && (
                    <ReportBarChart
                      data={rows}
                      nameKey="company_name"
                      metrics={[
                        { key: 'joined', label: 'Joined' },
                        { key: 'selected', label: 'Selected' },
                        { key: 'total_screened', label: 'Screened' },
                        { key: 'interview_scheduled', label: 'Int Sched' },
                        { key: 'interview_done', label: 'Int Done' },
                        { key: 'rejected', label: 'Rejected' },
                        { key: 'backout', label: 'Backout' },
                        { key: 'current_openings', label: 'Active Roles' },
                      ]}
                      defaultMetric="joined"
                      maxBars={10}
                    />
                  )}
                  <SafeTable
                    title="Company-wise Data"
                    rows={rows}
                    columnKeys={COMPANY_COLUMNS}
                    columnLabels={COMPANY_LABELS}
                    totalRow={companyWise.total ?? null}
                    searchPlaceholder="Search company…"
                    searchColumnKey="company_name"
                    numericColumnKeys={COMPANY_COLUMNS.slice(1)}
                    onExport={() =>
                      exportToXlsx(`CompanyWise_${mtdMonth}`, COMPANY_LABELS, rows, COMPANY_COLUMNS)
                    }
                  />
                </div>
              )
            })()}
          </div>
        )}

        {/* -------------------------------------------------------- Negative Funnel */}
        {tab === 'negative' && (
          <div className="space-y-4">
            {loading && negativeFunnel === undefined && <p className="text-gray-500">Loading…</p>}
            {!loading && notImplemented(negativeFunnel) && <BackendNotImplemented />}
            {!loading && negativeFunnel != null && typeof negativeFunnel === 'object' && (
              <NegativeFunnelImproved data={negativeFunnel} />
            )}
          </div>
        )}

        {/* ------------------------------------------------------ Interview Status */}
        {tab === 'interview-status' && (
          <div className="space-y-4">
            {loading && interviewStatus === undefined && <p className="text-gray-500">Loading…</p>}
            {!loading && notImplemented(interviewStatus) && <BackendNotImplemented />}
            {!loading && interviewStatus != null && typeof interviewStatus === 'object' && (() => {
              const tot = interviewStatus.total != null && typeof interviewStatus.total === 'object' ? interviewStatus.total : null
              const rows = Array.isArray(interviewStatus.rows) ? interviewStatus.rows : []
              const kpiItems: KPIItem[] = tot
                ? [
                    { label: 'Int Sched', value: safeVal(tot, 'int_sched') },
                    { label: 'Int Done', value: safeVal(tot, 'int_done') },
                    { label: 'Inter Pending', value: safeVal(tot, 'inter_pending') },
                    { label: 'Selected', value: safeVal(tot, 'selected') },
                    { label: 'Joined', value: safeVal(tot, 'joined') },
                    { label: 'Backout', value: safeVal(tot, 'backout') },
                  ]
                : []
              return (
                <div className="space-y-4">
                  <KPICards items={kpiItems} />
                  {rows.length > 0 && (
                    <ReportBarChart
                      data={rows}
                      nameKey="company_name"
                      metrics={[
                        { key: 'joined', label: 'Joined' },
                        { key: 'selected', label: 'Selected' },
                        { key: 'int_sched', label: 'Int Sched' },
                        { key: 'int_done', label: 'Int Done' },
                      ]}
                      defaultMetric="joined"
                      maxBars={10}
                    />
                  )}
                  <SafeTable
                    title={`Interview Status (DOD) — ${interviewStatus.date ?? dodDate}`}
                    rows={rows}
                    columnKeys={INTERVIEW_STATUS_COLUMNS}
                    columnLabels={INTERVIEW_STATUS_LABELS}
                    totalRow={interviewStatus.total ?? null}
                    searchPlaceholder="Search company…"
                    searchColumnKey="company_name"
                    numericColumnKeys={INTERVIEW_STATUS_COLUMNS.slice(1)}
                    onExport={() =>
                      exportToXlsx(
                        `InterviewStatus_${interviewStatus.date ?? dodDate}`,
                        INTERVIEW_STATUS_LABELS,
                        rows,
                        INTERVIEW_STATUS_COLUMNS
                      )
                    }
                  />
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
