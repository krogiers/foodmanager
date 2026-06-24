import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (row: T) => React.ReactNode
}

export interface SortState {
  sortBy: string
  sortDir: 'ASC' | 'DESC'
}

export interface PageState {
  page: number
  size: number
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  totalElements: number
  totalPages: number
  pageState: PageState
  sortState: SortState
  onPageChange: (page: number) => void
  onSortChange: (sort: SortState) => void
  onRowClick?: (row: T) => void
  onRowDoubleClick?: (row: T) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  keyFn: (row: T) => string
  emptyMessage?: string
}

export function DataTable<T>({
  columns, data, totalElements, totalPages, pageState, sortState,
  onPageChange, onSortChange, onRowClick, onRowDoubleClick, onEdit, onDelete,
  keyFn, emptyMessage = 'Geen resultaten gevonden.'
}: DataTableProps<T>) {

  const heeftActies = !!(onEdit || onDelete)
  const kolomBreedte = columns.length + (heeftActies ? 1 : 0)

  function handleSort(key: string) {
    if (sortState.sortBy === key) {
      onSortChange({ sortBy: key, sortDir: sortState.sortDir === 'ASC' ? 'DESC' : 'ASC' })
    } else {
      onSortChange({ sortBy: key, sortDir: 'ASC' })
    }
  }

  const start = totalElements === 0 ? 0 : pageState.page * pageState.size + 1
  const end = Math.min((pageState.page + 1) * pageState.size, totalElements)

  const paginas = paginaReeks(pageState.page, totalPages)

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left font-medium text-slate-600 select-none',
                    col.sortable && 'cursor-pointer hover:text-slate-900'
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      sortState.sortBy === col.key
                        ? sortState.sortDir === 'ASC'
                          ? <ChevronUp className="h-3.5 w-3.5 text-amber-600" />
                          : <ChevronDown className="h-3.5 w-3.5 text-amber-600" />
                        : <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </span>
                </th>
              ))}
              {heeftActies && <th className="w-20 px-2 py-3" />}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={kolomBreedte} className="px-4 py-12 text-center text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={keyFn(row)}
                  onClick={() => onRowClick?.(row)}
                  onDoubleClick={() => onRowDoubleClick?.(row)}
                  className={cn(
                    'border-b border-slate-100 transition-colors group',
                    i % 2 === 0 ? 'bg-white' : 'bg-slate-50',
                    (onRowClick || onRowDoubleClick) && 'cursor-pointer hover:bg-amber-50'
                  )}
                >
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3 text-slate-700">
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                  {heeftActies && (
                    <td className="px-2 py-2 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onEdit && (
                          <button
                            onClick={e => { e.stopPropagation(); onEdit(row) }}
                            className="p-1.5 rounded text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                            title="Bewerken"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={e => { e.stopPropagation(); onDelete(row) }}
                            className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Verwijderen"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalElements > 0 && (
        <div className="flex items-center justify-between px-1 text-sm text-slate-500">
          <span>{start}–{end} van {totalElements}</span>
          <div className="flex items-center gap-1">
            <button
              disabled={pageState.page === 0}
              onClick={() => onPageChange(pageState.page - 1)}
              className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {paginas.map((p, i) =>
              p === '...' ? (
                <span key={`dots-${i}`} className="px-1 text-slate-300">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p as number)}
                  className={cn(
                    'min-w-[2rem] px-2 py-1 rounded text-xs font-medium transition-colors',
                    p === pageState.page
                      ? 'bg-amber-600 text-white'
                      : 'hover:bg-slate-100 text-slate-600'
                  )}
                >
                  {(p as number) + 1}
                </button>
              )
            )}
            <button
              disabled={pageState.page >= totalPages - 1}
              onClick={() => onPageChange(pageState.page + 1)}
              className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function paginaReeks(huidig: number, totaal: number): (number | '...')[] {
  if (totaal <= 7) return Array.from({ length: totaal }, (_, i) => i)
  const reeks: (number | '...')[] = []
  reeks.push(0)
  if (huidig > 2) reeks.push('...')
  for (let p = Math.max(1, huidig - 1); p <= Math.min(totaal - 2, huidig + 1); p++) reeks.push(p)
  if (huidig < totaal - 3) reeks.push('...')
  reeks.push(totaal - 1)
  return reeks
}
