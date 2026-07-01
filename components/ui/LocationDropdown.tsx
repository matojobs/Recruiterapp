'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import indianCities from '@/lib/indian-cities.json'

type CityEntry = { name: string; state: string }
const staticCities = indianCities as CityEntry[]
const DEFAULT_API_URL = process.env.VERCEL ? 'https://api.jobsmato.com/api' : 'http://localhost:5000/api'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_URL

let remoteCityCache: CityEntry[] | null = null

function toLabel(c: CityEntry) {
  return c.state ? `${c.name}, ${c.state}` : c.name
}

function mergeCities(remoteCities: CityEntry[]) {
  const seen = new Set<string>()
  const merged: CityEntry[] = []
  for (const city of [...remoteCities, ...staticCities]) {
    const name = (city.name || '').trim()
    const state = (city.state || '').trim()
    if (!name) continue
    const key = `${name.toLowerCase()}|${state.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    merged.push({ name, state })
  }
  return merged
}

function filterCities(cities: CityEntry[], query: string, limit: number): CityEntry[] {
  const q = (query || '').trim().toLowerCase()
  if (!q) return cities.slice(0, limit)
  const out: CityEntry[] = []
  const labelMatch = (c: CityEntry) => toLabel(c).toLowerCase().includes(q)
  const nameMatch = (c: CityEntry) => c.name.toLowerCase().includes(q)
  const stateMatch = (c: CityEntry) => c.state.toLowerCase().includes(q)
  for (let i = 0; i < cities.length && out.length < limit; i++) {
    const c = cities[i]
    if (labelMatch(c) || nameMatch(c) || stateMatch(c)) out.push(c)
  }
  return out
}

const MAX_OPTIONS = 80

interface LocationDropdownProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  className?: string
  id?: string
  error?: string
}

export default function LocationDropdown({
  value,
  onChange,
  label,
  placeholder = 'Search city...',
  className,
  id,
  error,
}: LocationDropdownProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState(value)
  const [highlight, setHighlight] = useState(0)
  const [remoteCities, setRemoteCities] = useState<CityEntry[]>(remoteCityCache || [])
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const cities = mergeCities(remoteCities)
  const options = filterCities(cities, open ? input : '', MAX_OPTIONS)
  const showList = open && options.length > 0

  useEffect(() => {
    setInput(value)
  }, [value])

  useEffect(() => {
    if (remoteCityCache) return
    const controller = new AbortController()
    fetch(`${API_BASE_URL}/master-data/cities`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const fetched = Array.isArray(data?.cities) ? data.cities : []
        const clean = fetched
          .map((city: Partial<CityEntry>) => ({
            name: String(city.name || '').trim(),
            state: String(city.state || '').trim(),
          }))
          .filter((city: CityEntry) => city.name)
        remoteCityCache = clean
        setRemoteCities(clean)
      })
      .catch(() => {
        remoteCityCache = []
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!showList) return
    setHighlight(0)
  }, [input, showList])

  useEffect(() => {
    if (!showList || !listRef.current) return
    const el = listRef.current.querySelector(`[data-index="${highlight}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlight, showList])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setInput(value)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [value])

  function select(label: string) {
    onChange(label)
    setInput(label)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!showList) {
      if (e.key === 'ArrowDown' || e.key === 'Escape') setOpen(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => (h < options.length - 1 ? h + 1 : 0))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => (h > 0 ? h - 1 : options.length - 1))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const c = options[highlight]
      if (c) select(toLabel(c))
      return
    }
    if (e.key === 'Escape') {
      setOpen(false)
      setInput(value)
    }
  }

  return (
    <div ref={containerRef} className={cn('w-full relative', className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        type="text"
        autoComplete="off"
        placeholder={placeholder}
        value={input}
        onChange={(e) => {
          setInput(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className={cn(
          'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'dark:border-gray-600 dark:bg-gray-700 dark:text-white'
        )}
      />
      {showList && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          role="listbox"
        >
          {options.map((c, i) => {
            const label = toLabel(c)
            return (
              <li
                key={`${c.name}-${c.state}-${i}`}
                data-index={i}
                role="option"
                aria-selected={i === highlight}
                onClick={() => select(label)}
                onMouseEnter={() => setHighlight(i)}
                className={cn(
                  'px-3 py-2 cursor-pointer text-sm',
                  i === highlight ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-200' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                {label}
              </li>
            )
          })}
        </ul>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
