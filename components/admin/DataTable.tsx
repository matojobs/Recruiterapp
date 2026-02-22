'use client'

import { cn } from '@/lib/utils'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string | number
  onSort?: (key: string) => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  loading?: boolean
  emptyMessage?: string
  selectedIds?: Set<string | number>
  onSelectAll?: (checked: boolean) => void
  onSelectRow?: (id: string | number, checked: boolean) => void
  selectable?: boolean
  className?: string
}

export function DataTable<T extends object>({
  columns,
  data,
  keyExtractor,
  onSort,
  sortBy,
  sortOrder,
  loading,
  emptyMessage = 'No data',
  selectedIds,
  onSelectAll,
  onSelectRow,
  selectable,
  className,
}: DataTableProps<T>) {
  const allSelected = selectable && data.length > 0 && selectedIds && data.every((r) => selectedIds.has(keyExtractor(r)))
  const someSelected = selectable && selectedIds && selectedIds.size > 0

  return (
    <div className={cn('overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700', className)}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {selectable && (
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={!!allSelected}
                  ref={(el) => {
                    if (el) (el as HTMLInputElement).indeterminate = !!(someSelected && !allSelected)
                  }}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400',
                  col.sortable && 'cursor-pointer hover:text-gray-700',
                  col.className
                )}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortBy === col.key && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
          {loading ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-8 text-center text-gray-500">
                Loading...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-8 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => {
              const id = keyExtractor(row)
              return (
                <tr key={String(id)} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  {selectable && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds?.has(id)}
                        onChange={(e) => onSelectRow?.(id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={cn('whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100', col.className)}>
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
