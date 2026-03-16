'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
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
} from '@/lib/admin/types'

type TabId = 'dod' | 'mtd' | 'individual' | 'company' | 'negative' | 'interview-status'

// Safe getter: never throws. Use for any row/object access.
function safeVal(obj: unknown, key: string): string | number {
  if (obj == null || typeof obj !== 'object') return ''
  const v = (obj as Record<string, unknown>)[key]
  if (typeof v === 'number') return v
  return v != null ? String(v) : ''
}

// KPI summary cards — overview first, then details
function KPICards({ items }: { items: { label: string; value: string | number }[] }) {
  if (!items.length) return null
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm dark:border-gray-600 dark:from-gray-800 dark:to-gray-800"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      ))}
    </div>
  )
}

// Bar chart for recruiter/company vs one metric (DOD/MTD/Company/Interview)
function ReportBarChart({
  data,
  nameKey,
  valueKey,
  valueLabel,
  maxBars = 12,
}: {
  data: object[]
  nameKey: string
  valueKey: string
  valueLabel: string
  maxBars?: number
}) {
  const chartData = useMemo(() => {
    const safe = Array.isArray(data) ? data.filter((r): r is Record<string, unknown> => r != null && typeof r === 'object') : []
    return safe
      .slice(0, maxBars)
      .map((r) => ({ name: String(safeVal(r, nameKey) || '').slice(0, 18), value: Number(safeVal(r, valueKey)) || 0 }))
      .filter((d) => d.name && d.name !== 'Total')
  }, [data, nameKey, valueKey, maxBars])
  if (chartData.length === 0) return null
  const BAR_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#c084fc', '#d8b4fe']
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">By {valueLabel}</h4>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" name={valueLabel} radius={4}>
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

// Table with sort, search, sticky header (accepts API row types; normalizes internally)
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

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-2 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
        {searchColumnKey && (
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder ?? `Search…`}
            className="w-48 rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        )}
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
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, idx) => {
              const isTotal = highlightTotalRow && (safeVal(row, 'recruiter_name') === 'Total' || safeVal(row, 'recruiter_id') === '' || row.recruiter_id == null)
              const isEven = idx % 2 === 0
              const rowBg = isTotal
                ? 'bg-amber-50/50 dark:bg-amber-900/10'
                : isEven
                  ? 'bg-white dark:bg-gray-800'
                  : 'bg-slate-50/80 dark:bg-gray-700/40'
              return (
                <tr
                  key={idx}
                  className={`border-b border-gray-100 dark:border-gray-700 transition-colors hover:bg-indigo-50/60 dark:hover:bg-indigo-900/20 ${isTotal ? 'border-t-2 border-gray-300 font-medium dark:border-gray-600 ' + rowBg : rowBg}`}
                >
                  {columnKeys.map((k) => (
                    <td key={String(k)} className="px-3 py-2.5 text-gray-800 dark:text-gray-200">
                      {safeVal(row, k)}
                    </td>
                  ))}
                </tr>
              )
            })}
            {totalRow != null && typeof totalRow === 'object' && Object.keys(totalRow).length > 0 && (
              <tr className="border-t-2 border-gray-300 bg-amber-100/70 font-semibold text-gray-900 dark:border-gray-600 dark:bg-amber-900/20 dark:text-amber-100">
                <td className="px-3 py-2.5">Total</td>
                {columnKeys.slice(1).map((k) => (
                  <td key={String(k)} className="px-3 py-2.5">
                    {typeof safeVal(totalRow, k) === 'number' ? safeVal(totalRow, k) : (Number(safeVal(totalRow, k)) || 0)}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BackendNotImplemented() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
      <p className="font-medium">Backend not implemented yet</p>
      <p className="mt-1 text-sm">
        See <code className="rounded bg-amber-200 px-1 dark:bg-amber-800">docs/ADMIN_RECRUITER_PERFORMANCE_APIS.md</code> for the API specification.
      </p>
    </div>
  )
}

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

export default function AdminRecruiterPerformancePage() {
  const [tab, setTab] = useState<TabId>('dod')
  const [dod, setDod] = useState<RecruiterPerformanceDODResponse | null | undefined>(undefined)
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

  useEffect(() => {
    if (!dodDate) setDodDate(new Date().toISOString().slice(0, 10))
    if (!mtdMonth) setMtdMonth(new Date().toISOString().slice(0, 7))
    // Intentionally run once on mount to set initial date/month
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!dodDate) return
    setLoading(true)
    getRecruiterPerformanceDOD({ date: dodDate })
      .then(setDod)
      .finally(() => setLoading(false))
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

  const DOD_COLUMNS = [
    'recruiter_name',
    'assigned',
    'attempt',
    'connected',
    'interested',
    'not_relevant',
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
    'Not Relevant',
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
    'interview_sched',
    'sched_next_day',
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
    'Interview Sched',
    'Sched Next Day',
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
    'hold',
    'yet_to_join',
    'backout',
  ]
  const COMPANY_LABELS = [
    'Company',
    'Current Openings',
    'Total Screened',
    'Interview Scheduled',
    'Interview Done',
    'Interview Pending',
    'Rejected',
    'Selected',
    'Joined',
    'Hold',
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recruiter Performance Dashboard</h1>
      </div>

      {/* Dashboard filter bar */}
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

      {/* Report type selector */}
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
            className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === id ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content cards */}
      <div className="min-h-[200px] rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        {tab === 'dod' && (
          <div className="space-y-4">
            {loading && dod === undefined && <p className="text-gray-500">Loading…</p>}
            {!loading && notImplemented(dod) && <BackendNotImplemented />}
            {!loading && dod != null && typeof dod === 'object' && (() => {
              const raw = Array.isArray(dod.rows) ? dod.rows : []
              const totalBackend = dod.total != null && typeof dod.total === 'object' ? dod.total : null
              const totalFromRows = raw.find((r) => r != null && (safeVal(r, 'recruiter_name') === 'Total' || r.recruiter_id == null))
              const dataRows = totalFromRows ? raw.filter((r) => r !== totalFromRows) : raw
              const bodyRows = dataRows.length > 0 ? dataRows : (totalFromRows ? [totalFromRows] : [])
              const footerTotal = dataRows.length > 0 ? (totalBackend ?? totalFromRows ?? null) : null
              const tot = footerTotal ?? totalFromRows
              const kpiItems = tot && typeof tot === 'object' ? [
                { label: 'Assigned', value: safeVal(tot, 'assigned') },
                { label: 'Connected', value: safeVal(tot, 'connected') },
                { label: 'Interview Sched', value: safeVal(tot, 'interview_sched') },
                { label: 'Today Joining', value: safeVal(tot, 'today_joining') },
                { label: 'Interview Done', value: safeVal(tot, 'interview_done') },
                { label: 'Interview Pending', value: safeVal(tot, 'interview_pending') },
              ] : []
              return (
                <div className="space-y-4">
                  <KPICards items={kpiItems} />
                  {dataRows.length > 0 && (
                    <ReportBarChart
                      data={dataRows}
                      nameKey="recruiter_name"
                      valueKey="interview_sched"
                      valueLabel="Interview Sched"
                      maxBars={12}
                    />
                  )}
                  <SafeTable
                    title={`Day Report (DOD) — ${dod.date ?? dodDate}`}
                    rows={bodyRows}
                    columnKeys={DOD_COLUMNS}
                    columnLabels={DOD_LABELS}
                    totalRow={footerTotal}
                    highlightTotalRow
                    searchPlaceholder="Search recruiter…"
                    searchColumnKey="recruiter_name"
                    numericColumnKeys={DOD_COLUMNS.slice(1)}
                  />
                </div>
              )
            })()}
          </div>
        )}

        {tab === 'mtd' && (
          <div className="space-y-4">
            {loading && mtd === undefined && <p className="text-gray-500">Loading…</p>}
            {!loading && notImplemented(mtd) && <BackendNotImplemented />}
            {!loading && mtd != null && typeof mtd === 'object' && (() => {
              const raw = Array.isArray(mtd.rows) ? mtd.rows : []
              const totalBackend = mtd.total != null && typeof mtd.total === 'object' ? mtd.total : null
              const totalFromRows = raw.find((r) => r != null && (safeVal(r, 'recruiter_name') === 'Total' || r.recruiter_id == null))
              const dataRows = totalFromRows ? raw.filter((r) => r !== totalFromRows) : raw
              const bodyRows = dataRows.length > 0 ? dataRows : (totalFromRows ? [totalFromRows] : [])
              const footerTotal = dataRows.length > 0 ? (totalBackend ?? totalFromRows ?? null) : null
              const tot = footerTotal ?? totalFromRows
              const kpiItems = tot && typeof tot === 'object' ? [
                { label: 'Assigned', value: safeVal(tot, 'assigned') },
                { label: 'Connected', value: safeVal(tot, 'connected') },
                { label: 'Interview Sched', value: safeVal(tot, 'interview_sched') },
                { label: 'Selection', value: safeVal(tot, 'selection') },
                { label: 'Total Joining', value: safeVal(tot, 'total_joining') },
                { label: 'Hold', value: safeVal(tot, 'hold') },
              ] : []
              return (
                <div className="space-y-4">
                  <KPICards items={kpiItems} />
                  {dataRows.length > 0 && (
                    <ReportBarChart
                      data={dataRows}
                      nameKey="recruiter_name"
                      valueKey="total_joining"
                      valueLabel="Total Joining"
                      maxBars={12}
                    />
                  )}
                  <SafeTable
                    title={`Month Report (MTD) — ${mtd.month ?? mtdMonth}`}
                    rows={bodyRows}
                    columnKeys={MTD_COLUMNS}
                    columnLabels={MTD_LABELS}
                    totalRow={footerTotal}
                    highlightTotalRow
                    searchPlaceholder="Search recruiter…"
                    searchColumnKey="recruiter_name"
                    numericColumnKeys={MTD_COLUMNS.slice(1)}
                  />
                </div>
              )
            })()}
          </div>
        )}

        {tab === 'individual' && (
          <div className="space-y-4">
            {(() => {
              const rawRows = (dod?.rows ?? mtd?.rows ?? []) as { recruiter_id?: string; recruiter_name?: string }[]
              const recruiterOptions: RecruiterOption[] = rawRows
                .filter((r) => r != null && r.recruiter_name !== 'Total' && r.recruiter_id != null && String(r.recruiter_id).trim() !== '')
                .map((r) => ({ id: String(r.recruiter_id), name: String(r.recruiter_name ?? r.recruiter_id) }))
              const seen = new Set<string>()
              const unique = recruiterOptions.filter((o) => {
                if (seen.has(o.id)) return false
                seen.add(o.id)
                return true
              })
              const sorted = [...unique].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
              return (
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Recruiter</label>
                  <SearchableRecruiterDropdown
                    options={sorted}
                    value={individualRecruiterId}
                    onChange={setIndividualRecruiterId}
                    placeholder={sorted.length === 0 ? 'Load Day/Month report for list…' : 'Search recruiter by name…'}
                    disabled={individualLoading}
                  />
                  {sorted.length === 0 && (
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
              )
            })()}
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
                />
              </div>
            )}
            {!individualLoading && individual === undefined && !individualRecruiterId.trim() && (
              <p className="text-gray-500">Enter Recruiter ID and click Load.</p>
            )}
          </div>
        )}

        {tab === 'company' && (
          <div className="space-y-4">
            {loading && companyWise === undefined && <p className="text-gray-500">Loading…</p>}
            {!loading && notImplemented(companyWise) && <BackendNotImplemented />}
            {!loading && companyWise != null && typeof companyWise === 'object' && (() => {
              const tot = companyWise.total != null && typeof companyWise.total === 'object' ? companyWise.total : null
              const rows = Array.isArray(companyWise.rows) ? companyWise.rows : []
              const kpiItems = tot ? [
                { label: 'Total Screened', value: safeVal(tot, 'total_screened') },
                { label: 'Interview Scheduled', value: safeVal(tot, 'interview_scheduled') },
                { label: 'Selected', value: safeVal(tot, 'selected') },
                { label: 'Joined', value: safeVal(tot, 'joined') },
                { label: 'Hold', value: safeVal(tot, 'hold') },
                { label: 'Backout', value: safeVal(tot, 'backout') },
              ] : []
              return (
                <div className="space-y-4">
                  <KPICards items={kpiItems} />
                  {rows.length > 0 && (
                    <ReportBarChart
                      data={rows}
                      nameKey="company_name"
                      valueKey="joined"
                      valueLabel="Joined"
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
                  />
                </div>
              )
            })()}
          </div>
        )}

        {tab === 'negative' && (
          <div className="space-y-4">
            {loading && negativeFunnel === undefined && <p className="text-gray-500">Loading…</p>}
            {!loading && notImplemented(negativeFunnel) && <BackendNotImplemented />}
            {!loading && negativeFunnel != null && typeof negativeFunnel === 'object' && (
              <>
                <KPICards
                  items={[
                    { label: 'Grand Total (Not Interested)', value: negativeFunnel.grand_total ?? 0 },
                    { label: 'Remark Categories', value: Array.isArray(negativeFunnel.remarks) ? negativeFunnel.remarks.length : 0 },
                  ]}
                />
                <NegativeFunnelCard data={negativeFunnel} />
              </>
            )}
          </div>
        )}

        {tab === 'interview-status' && (
          <div className="space-y-4">
            {loading && interviewStatus === undefined && <p className="text-gray-500">Loading…</p>}
            {!loading && notImplemented(interviewStatus) && <BackendNotImplemented />}
            {!loading && interviewStatus != null && typeof interviewStatus === 'object' && (() => {
              const tot = interviewStatus.total != null && typeof interviewStatus.total === 'object' ? interviewStatus.total : null
              const rows = Array.isArray(interviewStatus.rows) ? interviewStatus.rows : []
              const kpiItems = tot ? [
                { label: 'Int Sched', value: safeVal(tot, 'int_sched') },
                { label: 'Int Done', value: safeVal(tot, 'int_done') },
                { label: 'Inter Pending', value: safeVal(tot, 'inter_pending') },
                { label: 'Selected', value: safeVal(tot, 'selected') },
                { label: 'Joined', value: safeVal(tot, 'joined') },
                { label: 'Backout', value: safeVal(tot, 'backout') },
              ] : []
              return (
                <div className="space-y-4">
                  <KPICards items={kpiItems} />
                  {rows.length > 0 && (
                    <ReportBarChart
                      data={rows}
                      nameKey="company_name"
                      valueKey="joined"
                      valueLabel="Joined"
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

function NegativeFunnelCard({ data }: { data: RecruiterPerformanceNegativeFunnelResponse }) {
  const totalsByJobRole = Array.isArray(data.totals_by_job_role) ? data.totals_by_job_role : []
  const remarks = Array.isArray(data.remarks) ? data.remarks : []
  const jobRoles = totalsByJobRole
    .map((r) => (r != null && typeof r === 'object' ? (r as { job_role_name?: string }).job_role_name : null))
    .filter((n): n is string => n != null && n !== '')

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-200 px-4 py-2 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Not Interested Remarks {data.date ? `— ${data.date}` : data.month ? `— ${data.month}` : ''}
        </h3>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-slate-200 bg-slate-100 dark:border-gray-600 dark:bg-gray-700">
            <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Remark</th>
            {jobRoles.map((name, i) => (
              <th key={String(name) || i} className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                {name}
              </th>
            ))}
            <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Total</th>
          </tr>
        </thead>
        <tbody>
          {remarks.map((r, idx) => {
            const byJobRole = Array.isArray(r.by_job_role) ? r.by_job_role : []
            const byRole: Record<string, number> = {}
            for (const x of byJobRole) {
              if (x != null && typeof x === 'object' && 'job_role_name' in x && 'count' in x) {
                byRole[String((x as { job_role_name: string }).job_role_name)] = Number((x as { count: number }).count) || 0
              }
            }
            const isEven = idx % 2 === 0
            const rowBg = isEven ? 'bg-white dark:bg-gray-800' : 'bg-slate-50/80 dark:bg-gray-700/40'
            return (
              <tr key={idx} className={`border-b border-gray-100 dark:border-gray-700 transition-colors hover:bg-indigo-50/60 dark:hover:bg-indigo-900/20 ${rowBg}`}>
                <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-gray-200">{safeVal(r, 'remark')}</td>
                {jobRoles.map((name, i) => (
                  <td key={String(name) || i} className="px-3 py-2.5 text-gray-800 dark:text-gray-200">
                    {byRole[name] ?? 0}
                  </td>
                ))}
                <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-gray-200">{safeVal(r, 'total')}</td>
              </tr>
            )
          })}
          <tr className="border-t-2 border-gray-300 bg-amber-100/70 font-semibold text-gray-900 dark:border-gray-600 dark:bg-amber-900/20 dark:text-amber-100">
            <td className="px-3 py-2.5">Total</td>
            {jobRoles.map((name, i) => {
              const row = totalsByJobRole.find((r) => r != null && (r as { job_role_name?: string }).job_role_name === name)
              const val = row != null && typeof row === 'object' ? ((row as { total?: number }).total ?? (row as { count?: number }).count ?? 0) : 0
              return (
                <td key={String(name) || i} className="px-3 py-2.5">
                  {val}
                </td>
              )
            })}
            <td className="px-3 py-2.5">{data.grand_total ?? 0}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
