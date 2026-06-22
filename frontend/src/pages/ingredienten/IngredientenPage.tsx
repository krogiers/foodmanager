import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable, type Column, type SortState, type PageState } from '../../components/ui/DataTable'
import { SlideOver } from '../../components/ui/SlideOver'
import { AllergeenBadge } from '../../components/ui/AllergeenBadge'
import type { IngredientResponse } from '../../types/ingredient'

const EENHEID_LABELS: Record<string, string> = { G: 'g', KG: 'kg', ML: 'ml', L: 'l', ST: 'st' }

const columns: Column<IngredientResponse>[] = [
  { key: 'naam', label: 'Naam', sortable: true },
  { key: 'eenheid', label: 'Eenheid', sortable: true, render: r => EENHEID_LABELS[r.eenheid] ?? r.eenheid },
  {
    key: 'aankoopprijs', label: 'Aankoopprijs', sortable: true,
    render: r => r.aankoopprijs != null ? `€ ${Number(r.aankoopprijs).toFixed(2)}` : '—'
  },
  {
    key: 'allergenen', label: 'Allergenen',
    render: r => (
      <div className="flex flex-wrap gap-1">
        {r.allergenen.filter(a => a.aanwezigheid !== 'VRIJ_VAN').map(a => (
          <AllergeenBadge key={a.allergeen} allergeen={a.allergeen} size="xs" />
        ))}
      </div>
    )
  },
]

export function IngredientenPage() {
  const [data, setData] = useState<IngredientResponse[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [pageState, setPageState] = useState<PageState>({ page: 0, size: 20 })
  const [sortState, setSortState] = useState<SortState>({ sortBy: 'naam', sortDir: 'ASC' })
  const [zoekterm, setZoekterm] = useState('')
  const [selected, setSelected] = useState<IngredientResponse | null>(null)

  const laadData = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(pageState.page),
        size: String(pageState.size),
        sortBy: sortState.sortBy,
        sortDir: sortState.sortDir,
        ...(zoekterm ? { naam: zoekterm } : {})
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

  function handleZoek(e: React.ChangeEvent<HTMLInputElement>) {
    setZoekterm(e.target.value)
    setPageState(p => ({ ...p, page: 0 }))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Ingrediënten</h1>
        <button className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-3 py-2 rounded-md transition-colors">
          <Plus className="h-4 w-4" /> Nieuw ingrediënt
        </button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Zoeken op naam..."
          value={zoekterm}
          onChange={handleZoek}
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
        onRowDoubleClick={setSelected}
        onEdit={setSelected}
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

      <SlideOver open={!!selected} onClose={() => setSelected(null)} title={selected?.naam ?? ''}>
        {selected && <IngredientDetail ingredient={selected} />}
      </SlideOver>
    </div>
  )
}

function IngredientDetail({ ingredient }: { ingredient: IngredientResponse }) {
  const EENHEID_LABELS: Record<string, string> = { G: 'g', KG: 'kg', ML: 'ml', L: 'l', ST: 'st' }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-slate-500 block">Eenheid</span>
          <span className="font-medium">{EENHEID_LABELS[ingredient.eenheid] ?? ingredient.eenheid}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Aankoopprijs</span>
          <span className="font-medium">
            {ingredient.aankoopprijs != null ? `€ ${Number(ingredient.aankoopprijs).toFixed(4)}/eenheid` : '—'}
          </span>
        </div>
      </div>

      {ingredient.voedingswaarden && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Voedingswaarden per 100g/ml</h3>
          <div className="rounded-md border border-slate-200 overflow-hidden text-sm">
            {[
              ['Energie', `${ingredient.voedingswaarden.energie} kcal`],
              ['Eiwitten', `${ingredient.voedingswaarden.eiwitten} g`],
              ['Koolhydraten', `${ingredient.voedingswaarden.koolhydraten} g`],
              ['waarvan suikers', `${ingredient.voedingswaarden.suikers} g`],
              ['Vetten', `${ingredient.voedingswaarden.vetten} g`],
              ['waarvan verzadigd', `${ingredient.voedingswaarden.verzadigdVet} g`],
              ['Vezels', `${ingredient.voedingswaarden.vezels} g`],
              ['Zout', `${ingredient.voedingswaarden.zout} g`],
            ].map(([label, value], i) => (
              <div key={label} className={`flex justify-between px-3 py-2 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                <span className={label.startsWith('waarvan') ? 'pl-4 text-slate-500' : 'text-slate-700'}>{label}</span>
                <span className="font-medium text-slate-800">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {ingredient.allergenen.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Allergenen</h3>
          <div className="flex flex-wrap gap-2">
            {ingredient.allergenen.map(a => (
              <div key={a.allergeen} className="flex items-center gap-1.5">
                <AllergeenBadge allergeen={a.allergeen} />
                <span className="text-xs text-slate-500 capitalize">{a.aanwezigheid.toLowerCase().replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
