import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { AllergeenBadge } from '../../components/ui/AllergeenBadge'
import { DataTable, type Column, type SortState, type PageState } from '../../components/ui/DataTable'
import type { Herkomst, KlantResponse } from '../../types/klant'

const HERKOMST_FILTER: { value: Herkomst | ''; label: string }[] = [
  { value: '', label: 'Alle' },
  { value: 'MOND_TOT_MOND', label: 'Mond tot mond' },
  { value: 'SOCIALE_MEDIA', label: 'Sociale media' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'EVENT', label: 'Event' },
  { value: 'ANDERE', label: 'Andere' },
]

const columns: Column<KlantResponse>[] = [
  { key: 'familienaam', label: 'Naam', sortable: true, render: r => r.volledigNaam },
  {
    key: 'email', label: 'Email', sortable: true,
    render: r => r.email ?? <span className="text-slate-400">—</span>
  },
  { key: 'telefoon', label: 'Telefoon', render: r => r.telefoon ?? '—' },
  {
    key: 'allergenen', label: 'Allergenen',
    render: r => (
      <div className="flex flex-wrap gap-1">
        {r.allergenen.map(a => <AllergeenBadge key={a} allergeen={a} size="xs" />)}
        {r.allergenen.length === 0 && <span className="text-slate-400 text-xs">Geen</span>}
      </div>
    )
  },
]

export function KlantenPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<KlantResponse[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [pageState, setPageState] = useState<PageState>({ page: 0, size: 20 })
  const [sortState, setSortState] = useState<SortState>({ sortBy: 'familienaam', sortDir: 'ASC' })
  const [zoekterm, setZoekterm] = useState('')
  const [filterHerkomst, setFilterHerkomst] = useState<Herkomst | ''>('')

  const laadData = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(pageState.page),
        size: String(pageState.size),
        sortBy: sortState.sortBy,
        sortDir: sortState.sortDir,
        ...(zoekterm ? { zoekterm } : {}),
        ...(filterHerkomst ? { herkomst: filterHerkomst } : {}),
      })
      const { data: result } = await axios.get(`/api/klanten?${params}`)
      setData(result.content)
      setTotalElements(result.totalElements)
      setTotalPages(result.totalPages)
    } catch {
      toast.error('Kon klanten niet laden.')
    }
  }, [pageState, sortState, zoekterm, filterHerkomst])

  useEffect(() => { laadData() }, [laadData])

  function resetPaginatie() {
    setPageState(p => ({ ...p, page: 0 }))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Klanten</h1>
        <button
          onClick={() => navigate('/klanten/nieuw')}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-3 py-2 rounded-md transition-colors"
        >
          <Plus className="h-4 w-4" /> Nieuwe klant
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Zoeken op naam..."
            value={zoekterm}
            onChange={e => { setZoekterm(e.target.value); resetPaginatie() }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 shrink-0">Herkomst:</span>
          {HERKOMST_FILTER.map(o => (
            <button
              key={o.value}
              onClick={() => { setFilterHerkomst(o.value); resetPaginatie() }}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filterHerkomst === o.value
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:text-amber-700'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        totalElements={totalElements}
        totalPages={totalPages}
        pageState={pageState}
        sortState={sortState}
        onPageChange={page => setPageState(p => ({ ...p, page }))}
        onSortChange={sort => { setSortState(sort); resetPaginatie() }}
        onRowDoubleClick={r => navigate(`/klanten/${r.id}`)}
        onEdit={r => navigate(`/klanten/${r.id}`)}
        onDelete={async r => {
          if (!confirm(`Klant "${r.volledigNaam}" anonimiseren? Dit kan niet ongedaan worden gemaakt.`)) return
          try {
            await axios.delete(`/api/klanten/${r.id}`)
            toast.success(`Klant "${r.volledigNaam}" geanonimiseerd.`)
            laadData()
          } catch {
            toast.error('Anonimiseren mislukt.')
          }
        }}
        keyFn={r => r.id}
        emptyMessage="Geen klanten gevonden. Voeg een nieuwe klant toe."
      />
    </div>
  )
}
