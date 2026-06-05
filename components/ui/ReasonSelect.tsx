'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { OTHER_OPTION } from '@/lib/reasons'

interface ReasonSelectProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  invalid?: boolean
}

/**
 * Searchable reason dropdown with an "Other" escape hatch.
 * - If the current value matches a preset option, the option is shown selected.
 * - If it doesn't match (custom text), we treat it as "Other" and reveal a free
 *   text box pre-filled with that text.
 */
export default function ReasonSelect({
  options,
  value,
  onChange,
  placeholder = 'Select a reason…',
  required,
  invalid,
}: ReasonSelectProps) {
  const isPreset = options.includes(value)
  const isOther = !!value && !isPreset
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [otherMode, setOtherMode] = useState(isOther)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setOtherMode(!!value && !options.includes(value)) }, [value, options])

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  const allOptions = [...options, OTHER_OPTION]
  const filtered = query.trim()
    ? allOptions.filter(o => o.toLowerCase().includes(query.trim().toLowerCase()))
    : allOptions

  function select(opt: string) {
    if (opt === OTHER_OPTION) {
      setOtherMode(true)
      onChange('') // clear until they type
    } else {
      setOtherMode(false)
      onChange(opt)
    }
    setOpen(false)
    setQuery('')
  }

  const display = otherMode ? OTHER_OPTION : (value || '')
  const borderCls = invalid ? 'border-red-400 ring-1 ring-red-300' : 'border-gray-300'

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm text-left bg-white focus:outline-none focus:ring-2 focus:ring-primary-500',
          borderCls,
          !display && 'text-gray-400',
        )}
      >
        <span className="truncate">{display || placeholder}{required && !value && <span className="text-red-500"> *</span>}</span>
        <span className="ml-2 text-gray-400">▼</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type to search…"
            className="w-full border-b border-gray-200 px-3 py-2 text-sm focus:outline-none"
          />
          <ul className="py-1">
            {filtered.length === 0 && <li className="px-3 py-2 text-sm text-gray-400">No match — pick Other</li>}
            {filtered.map(opt => (
              <li
                key={opt}
                onClick={() => select(opt)}
                className={cn(
                  'cursor-pointer px-3 py-2 text-sm hover:bg-indigo-50',
                  (opt === value || (opt === OTHER_OPTION && otherMode)) ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-gray-700',
                  opt === OTHER_OPTION && 'border-t border-gray-100 text-gray-500 italic',
                )}
              >
                {opt}
              </li>
            ))}
          </ul>
        </div>
      )}

      {otherMode && (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Type the reason…"
          className={cn('mt-2 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500', borderCls)}
        />
      )}
    </div>
  )
}
