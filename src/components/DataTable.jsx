import { useState, useMemo } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, Inbox } from 'lucide-react'

function DataTable({ columns, data, isLoading, onRowClick, rowHighlight, emptyMessage = 'No data found' }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  const handleSort = (key, sortable) => {
    if (!sortable) return
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const sortedData = useMemo(() => {
    if (!data || !sortConfig.key) return data || []
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
      }
      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortConfig])

  const SortIcon = ({ columnKey, sortable }) => {
    if (!sortable) return null
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-surface-500" />
    }
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="w-3.5 h-3.5 text-primary-400" />
      : <ArrowDown className="w-3.5 h-3.5 text-primary-400" />
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-700">
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-3.5 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-surface-700/50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5">
                      <div className="h-4 bg-surface-700 rounded animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Empty state
  if (!sortedData || sortedData.length === 0) {
    return (
      <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
        <div className="p-4 rounded-2xl bg-surface-700/50 mb-4">
          <Inbox className="w-8 h-8 text-surface-500" />
        </div>
        <p className="text-sm text-surface-400 font-medium">{emptyMessage}</p>
        <p className="text-xs text-surface-500 mt-1">Try adjusting your filters or add new items</p>
      </div>
    )
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-700">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key, col.sortable)}
                  className={`
                    px-4 py-3.5 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider
                    ${col.sortable ? 'cursor-pointer select-none hover:text-surface-200 transition-colors' : ''}
                  `}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    <SortIcon columnKey={col.key} sortable={col.sortable} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, rowIndex) => {
              const isHighlighted = rowHighlight ? rowHighlight(row) : false
              return (
                <tr
                  key={row.id || rowIndex}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`
                    border-b border-surface-700/30 transition-colors duration-150
                    ${onRowClick ? 'cursor-pointer' : ''}
                    ${isHighlighted
                      ? 'bg-warning-500/5 hover:bg-warning-500/10'
                      : rowIndex % 2 === 0
                        ? 'bg-transparent hover:bg-surface-700/30'
                        : 'bg-surface-800/30 hover:bg-surface-700/30'
                    }
                  `}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-surface-200 whitespace-nowrap">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DataTable
