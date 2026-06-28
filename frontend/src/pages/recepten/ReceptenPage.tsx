import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'sonner'
import { Plus, Search } from 'lucide-react'
import { DataTable, type Column, type SortState } from '../../components/ui/DataTable'
import type { ReceptSummaryResponse } from '../../types/recept'

const HOUDBAARHEID_LABEL: Record<string, string> = {
  DAGEN: 'dag(en)', WEKEN: 'week/weken', MAANDEN: 'maand(en)',
}

const kolommen: Column<ReceptSummaryResponse>[] = [
  { key: 'naam', label: 'Naam', sortable: true },
  {
    key: 'houdbaarheid', label: 'Houdbaarheid',
    render: r => r.houdbaarheid
      ? <span className="text-sm text-slate-700">{r.houdbaarheid.waarde} {HOUDBAARHEID_LABEL[r.houdbaarheid.eenheid]}</span>
      : <span className="text-slate-400 text-sm">—</span>
  },
  {
    key: 'aantalRegels', label: 'Ingrediënten / recepten',
    render: r => <span className="text-sm text-slate-500">{r.aantalRegels} regel{r.aantalRegels !== 1 ? 's' : ''}</span>
  },
]

const PAGINA_GROOTTE = 20

export function ReceptenPage() {
  const navigate = useNavigate()
  const [zoekterm, setZoekterm] = useState('')
  const [pagina, setPagina] = useState(0)
  const [sortBy, setSortBy] = useState('naam')
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('ASC')
  const [data, setData] = useState<{ content: ReceptSummaryResponse[]; totalElements: number; totalPages: number } | null>(null)
  const [laden, setLaden] = useState(true)

  async function laad(p = pagina, sort = sortBy, dir = sortDir, zoek = zoekterm) {
    setLaden(true)
    try {
      const params = new URLSearchParams({ pagina: String(p), paginaGrootte: String(PAGINA_GROOTTE), sorteerOp: sort, sorteerRichting: dir })
      if (zoek.trim()) params.set('naam', zoek.trim())
      const { data: resp } = await axios.get(`/api/recepten?${params}`)
      setData(resp)
    } catch {
      toast.error('Kon recepten niet laden.')
    } finally {
      setLaden(false)
    }
  }

  useEffect(() => { laad() }, [])

  function handleZoek(e: React.FormEvent) {
    e.preventDefault()
    setPagina(0)
    laad(0, sortBy, sortDir, zoekterm)
  }

  function handleSort({ sortBy: kolom, sortDir: dir }: SortState) {
    setSortBy(kolom)
    setSortDir(dir)
    setPagina(0)
    laad(0, kolom, dir)
  }

  function handlePagina(nr: number) {
    setPagina(nr)
    laad(nr)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Recepten</h1>
        <button
          onClick={() => navigate('/recepten/nieuw')}
          className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          <Plus className="h-4 w-4" /> Nieuw recept
        </button>
      </div>

      <form onSubmit={handleZoek} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Zoek op naam…"
            value={zoekterm}
            onChange={e => setZoekterm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <button type="submit" className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-md transition-colors">
          Zoeken
        </button>
      </form>

      {laden ? (
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-11 bg-slate-100 rounded-md animate-pulse" />)}
        </div>
      ) : (
        <DataTable
          columns={kolommen}
          data={data?.content ?? []}
          totalElements={data?.totalElements ?? 0}
          totalPages={data?.totalPages ?? 0}
          pageState={{ page: pagina, size: PAGINA_GROOTTE }}
          sortState={{ sortBy, sortDir }}
          onPageChange={handlePagina}
          onSortChange={handleSort}
          onRowDoubleClick={r => navigate(`/recepten/${r.id}`)}
          keyFn={r => r.id}
          emptyMessage="Geen recepten gevonden. Maak een nieuw recept aan."
        />
      )}
    </div>
  )
}
