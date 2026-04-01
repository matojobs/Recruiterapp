'use client'

import { useState, useMemo } from 'react'
import type { Company, JobRole } from '@/types/database'
import { CALL_STATUS_SELECT_OPTIONS } from '@/lib/constants'

interface FiltersState {
  search: string
  company_id: string
  job_role_id: string
  call_status: string
  interested_status: string
  interview_scheduled: string
  interview_status: string
  selection_status: string
  joining_status: string
  date_field: string
  date_from: string
  date_to: string
}

const EMPTY: FiltersState = {
  search: '',
  company_id: '',
  job_role_id: '',
  call_status: '',
  interested_status: '',
  interview_scheduled: '',
  interview_status: '',
  selection_status: '',
  joining_status: '',
  date_field: 'assigned_date',
  date_from: '',
  date_to: '',
}

const DATE_FIELD_OPTIONS = [
  { value: 'assigned_date', label: 'Assigned Date' },
  { value: 'call_date',     label: 'Call Date' },
  { value: 'interview_date',label: 'Interview Date' },
  { value: 'joining_date',  label: 'Joining Date' },
  { value: 'followup_date', label: 'Follow-up Date' },
]

interface FiltersProps {
  companies: Company[]
  jobRoles: JobRole[]
  onFilterChange: (filters: Omit<FiltersState, 'search'>) => void
  onSearchChange: (search: string) => void
  onExport: () => void
  total: number
  loading: boolean
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function ExportIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

export default function Filters({ companies, jobRoles, onFilterChange, onSearchChange, onExport, total, loading }: FiltersProps) {
  const [filters, setFilters] = useState<FiltersState>(EMPTY)
  const [showAdvanced, setShowAdvanced] = useState(false)

  function update(field: keyof FiltersState, value: string) {
    const next = { ...filters, [field]: value }
    setFilters(next)
    if (field === 'search') {
      onSearchChange(value)
    } else {
      const { search: _s, ...rest } = next
      onFilterChange(rest)
    }
  }

  function reset() {
    setFilters(EMPTY)
    onSearchChange('')
    onFilterChange({ ...EMPTY, search: undefined } as any)
  }

  // Count active filters (exclude search and date_field default)
  const activeCount = useMemo(() => {
    const { search: _s, date_field: _df, ...rest } = filters
    return Object.values(rest).filter(Boolean).length
  }, [filters])

  const hasAny = activeCount > 0 || filters.search !== ''
  const hasDateRange = filters.date_from || filters.date_to
  const dateFieldLabel = DATE_FIELD_OPTIONS.find(o => o.value === filters.date_field)?.label ?? 'Date'

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4">
      {/* Primary toolbar */}
      <div className="flex items-center gap-2 p-3 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-48 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, phone, company…"
            value={filters.search}
            onChange={e => update('search', e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
          />
          {filters.search && (
            <button onClick={() => update('search', '')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <XIcon />
            </button>
          )}
        </div>

        {/* Company */}
        <select
          value={filters.company_id}
          onChange={e => update('company_id', e.target.value)}
          className={`px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 ${filters.company_id ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-medium' : 'border-gray-200 text-gray-700'}`}
        >
          <option value="">All Companies</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
        </select>

        {/* Job Role */}
        <select
          value={filters.job_role_id}
          onChange={e => update('job_role_id', e.target.value)}
          className={`px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 ${filters.job_role_id ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-medium' : 'border-gray-200 text-gray-700'}`}
        >
          <option value="">All Roles</option>
          {jobRoles.map(j => <option key={j.id} value={j.id}>{j.job_role}</option>)}
        </select>

        {/* Call Status */}
        <select
          value={filters.call_status}
          onChange={e => update('call_status', e.target.value)}
          className={`px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 ${filters.call_status ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-medium' : 'border-gray-200 text-gray-700'}`}
        >
          <option value="">All Call Status</option>
          {CALL_STATUS_SELECT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* More filters toggle */}
        <button
          onClick={() => setShowAdvanced(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-colors ${showAdvanced || activeCount > 0 ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          <FilterIcon />
          <span>More</span>
          {activeCount > 0 && (
            <span className="ml-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">{activeCount}</span>
          )}
          <ChevronIcon open={showAdvanced} />
        </button>

        <div className="flex items-center gap-2 ml-auto">
          {hasAny && (
            <button onClick={reset} className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors">
              <XIcon />
              Clear
            </button>
          )}
          <button onClick={onExport} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
            <ExportIcon />
            Export
          </button>
        </div>
      </div>

      {/* Advanced filters panel */}
      {showAdvanced && (
        <div className="border-t border-gray-100 px-3 py-3 space-y-3">
          {/* Status filters row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            <select
              value={filters.interested_status}
              onChange={e => update('interested_status', e.target.value)}
              className={`px-2.5 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 ${filters.interested_status ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-semibold' : 'border-gray-200 text-gray-700'}`}
            >
              <option value="">Interested: All</option>
              <option value="Yes">Interested</option>
              <option value="No">Not Interested</option>
              <option value="Call Back Later">Call Back Later</option>
            </select>

            <select
              value={filters.interview_scheduled}
              onChange={e => update('interview_scheduled', e.target.value)}
              className={`px-2.5 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 ${filters.interview_scheduled ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-semibold' : 'border-gray-200 text-gray-700'}`}
            >
              <option value="">Interview: All</option>
              <option value="Yes">Scheduled</option>
              <option value="No">Not Scheduled</option>
            </select>

            <select
              value={filters.interview_status}
              onChange={e => update('interview_status', e.target.value)}
              className={`px-2.5 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 ${filters.interview_status ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-semibold' : 'border-gray-200 text-gray-700'}`}
            >
              <option value="">Interview Outcome: All</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Done">Done</option>
              <option value="Not Attended">Not Attended</option>
              <option value="Rejected">Rejected</option>
            </select>

            <select
              value={filters.selection_status}
              onChange={e => update('selection_status', e.target.value)}
              className={`px-2.5 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 ${filters.selection_status ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-semibold' : 'border-gray-200 text-gray-700'}`}
            >
              <option value="">Selection: All</option>
              <option value="Selected">Selected</option>
              <option value="Not Selected">Not Selected</option>
              <option value="Pending">Pending</option>
            </select>

            <select
              value={filters.joining_status}
              onChange={e => update('joining_status', e.target.value)}
              className={`px-2.5 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 ${filters.joining_status ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-semibold' : 'border-gray-200 text-gray-700'}`}
            >
              <option value="">Joining: All</option>
              <option value="Joined">Joined</option>
              <option value="Not Joined">Not Joined</option>
              <option value="Pending">Pending</option>
              <option value="Backed Out">Backed Out</option>
            </select>
          </div>

          {/* Date range row — full width, no overflow */}
          <div className="flex flex-wrap items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <CalendarIcon />
              <span>Date Range</span>
            </div>

            {/* Date field type selector */}
            <select
              value={filters.date_field}
              onChange={e => update('date_field', e.target.value)}
              className={`px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium ${hasDateRange ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-700 bg-white'}`}
            >
              {DATE_FIELD_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <span className="text-xs text-gray-400">from</span>
            <input
              type="date"
              value={filters.date_from}
              onChange={e => update('date_from', e.target.value)}
              className={`px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white ${filters.date_from ? 'border-indigo-400 text-indigo-700' : 'border-gray-200 text-gray-700'}`}
            />
            <span className="text-xs text-gray-400">to</span>
            <input
              type="date"
              value={filters.date_to}
              onChange={e => update('date_to', e.target.value)}
              className={`px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white ${filters.date_to ? 'border-indigo-400 text-indigo-700' : 'border-gray-200 text-gray-700'}`}
            />

            {hasDateRange && (
              <button
                onClick={() => { update('date_from', ''); update('date_to', '') }}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <XIcon />
                Clear dates
              </button>
            )}

            {hasDateRange && (
              <span className="text-xs text-indigo-600 font-medium ml-auto">
                Filtering by {dateFieldLabel}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Result count strip */}
      {!loading && (
        <div className="border-t border-gray-50 px-3 py-1.5 flex items-center gap-2">
          <span className="text-xs text-gray-400">{total.toLocaleString()} candidate{total !== 1 ? 's' : ''}</span>
          {hasAny && (
            <span className="text-xs text-indigo-600 font-medium">· filtered</span>
          )}
          {hasDateRange && (
            <span className="text-xs text-gray-400">· {dateFieldLabel}{filters.date_from ? ` from ${filters.date_from}` : ''}{filters.date_to ? ` to ${filters.date_to}` : ''}</span>
          )}
        </div>
      )}
    </div>
  )
}
