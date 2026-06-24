import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable, type Column, type SortState, type PageState } from '../../components/ui/DataTable'
import { AllergeenBadge } from '../../components/ui/AllergeenBadge'
import { EENHEID_KORT } from './IngredientForm'
import type { IngredientResponse } from '../../types/ingredient'

const columns: Column<IngredientResponse>[] = [
  { key: 'naam', label: 'Naam', sortable: true },
  { key: 'eenheid', label: 'Eenheid', sortable: true, render: r => EENHEID_KORT[r.eenheid] ?? r.eenheid },
  {
    key: 'aankoopprijs', label: 'Aankoopprijs', sortable: true,
    render: r => r.aankoopprijs != null
      ? `€ ${Number(r.aankoopprijs).toFixed(4)} / ${EENHEID_KORT[r.eenheid]}`
      : '—'
  },
  {
    key: 'allergenen', label: 'Allergenen',
    render: r => (
      <div className="flex flex-wrap gap-1">
        {r.allergenen.filter(a => a.aanwezigheid !== 'VRIJ_VAN').map(a => (
          <AllergeenBadge key={a.allergeen} allergeen={a.allergeen} size="xs" />
        ))}
        {r.allergenen.filter(a => a.aanwezigheid !== 'VRIJ_VAN').length === 0 && (
          <span className="text-slate-400 text-xs">Geen</span>
        )}
      </div>
    )
  },
]

export function IngredientenPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<IngredientResponse[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [pageState, setPageState] = useState<PageState>({ page: 0, size: 20 })
  const [sortState, setSortState] = useState<SortState>({ sortBy: 'naam', sortDir: 'ASC' })
  const [zoekterm, setZoekterm] = useState('')

  const laadData = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(pageState.page),
        size: String(pageState.size),
        sortBy: sortState.sortBy,
        sortDir: sortState.sortDir,
        ...(zoekterm ? { naam: zoekterm } : {}),
      })
      const { data: result } = await axios.get(`/api/ingredienten?${params}`)
      setData(result.content)
      setTotalElements(result.totalElements)
      setTotalPages(result.totalPages)
    } catch {
      toast.error('Kon ingrediënten niet laden.')
    }
  }, [pageState, sortState, zoekterm])

  useEffect(() => { laadData() }, [laadData])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Ingrediënten</h1>
        <button
          onClick={() => navigate('/ingredienten/nieuw')}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-3 py-2 rounded-md transition-colors"
        >
          <Plus className="h-4 w-4" /> Nieuw ingrediënt
        </button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Zoeken op naam..."
          value={zoekterm}
          onChange={e => { setZoekterm(e.target.value); setPageState(p => ({ ...p, page: 0 })) }}
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <DataTable
        columns={columns}
        data={data}
        totalElements={totalElements}
        totalPages={totalPages}
        pageState={pageState}
        sortState={sortState}
        onPageChange={page => setPageState(p => ({ ...p, page }))}
        onSortChange={sort => { setSortState(sort); setPageState(p => ({ ...p, page: 0 })) }}
        onRowDoubleClick={r => navigate(`/ingredienten/${r.id}`)}
        onEdit={r => navigate(`/ingredienten/${r.id}`)}
        onDelete={async r => {
          if (!confirm(`"${r.naam}" verwijderen?`)) return
          try {
            await axios.delete(`/api/ingredienten/${r.id}`)
            toast.success(`"${r.naam}" verwijderd.`)
            laadData()
          } catch {
            toast.error('Verwijderen mislukt.')
          }
        }}
        keyFn={r => r.id}
        emptyMessage="Geen ingrediënten gevonden. Voeg een nieuw ingrediënt toe."
      />
    </div>
  )
}
