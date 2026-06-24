import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'sonner'
import { ChevronRight, Search, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { IngredientForm, EENHEID_OPTIES, EENHEID_KORT } from './IngredientForm'
import type { Eenheid } from '../../types/ingredient'

interface ZoekResultaat {
  externeId: string
  naam: string
  merk?: string
  heeftVoedingswaarden: boolean
  heeftAllergenen: boolean
}

interface ZoekPagina {
  resultaten: ZoekResultaat[]
  totaalAantal: number
  pagina: number
  paginaGrootte: number
  totalePaginas: number
}

type Fase = 'zoeken' | 'geselecteerd' | 'manueel'

const PAGINA_GROOTTE = 20

const zoekResultaatKolommen: Column<ZoekResultaat>[] = [
  { key: 'naam', label: 'Naam' },
  { key: 'merk', label: 'Merk / Fabrikant', render: r => r.merk ?? <span className="text-slate-400">—</span> },
]

export function IngredientNieuwPage() {
  const navigate = useNavigate()
  const [fase, setFase] = useState<Fase>('zoeken')

  // zoek-fase
  const [zoekterm, setZoekterm] = useState('')
  const [merk, setMerk] = useState('')
  const [zoekend, setZoekend] = useState(false)
  const [pagina, setPagina] = useState<ZoekPagina | null>(null)
  const [huidigePagina, setHuidigePagina] = useState(0)

  // geselecteerd-fase
  const [geselecteerd, setGeselecteerd] = useState<ZoekResultaat | null>(null)
  const [naam, setNaam] = useState('')
  const [eenheid, setEenheid] = useState<Eenheid>('G')
  const [aankoopprijs, setAankoopprijs] = useState('')
  const [aanmakend, setAanmakend] = useState(false)

  async function zoek(paginaNr = 0) {
    if (!zoekterm.trim()) return
    setZoekend(true)
    try {
      const params = new URLSearchParams({ query: zoekterm, pagina: String(paginaNr), paginaGrootte: String(PAGINA_GROOTTE) })
      if (merk.trim()) params.set('merk', merk.trim())
      const { data } = await axios.get(`/api/ingredienten/nutrition/zoek?${params}`)
      setPagina(data)
      setHuidigePagina(paginaNr)
      if (data.totaalAantal === 0) toast.info('Geen resultaten. Probeer een andere zoekterm of laat het merkveld leeg.')
    } catch {
      toast.error('Zoeken mislukt. Probeer het opnieuw of vul manueel in.')
    } finally {
      setZoekend(false)
    }
  }

  function handleZoekSubmit(e: React.FormEvent) {
    e.preventDefault()
    setHuidigePagina(0)
    setPagina(null)
    zoek(0)
  }

  function handlePaginaWijziging(nr: number) {
    zoek(nr)
  }

  function selecteer(r: ZoekResultaat) {
    setGeselecteerd(r)
    setNaam(r.naam)
    setFase('geselecteerd')
  }

  async function importeer(e: React.FormEvent) {
    e.preventDefault()
    if (!geselecteerd) return
    setAanmakend(true)
    try {
      const params = new URLSearchParams({ naam, eenheid })
      if (aankoopprijs) params.set('aankoopprijs', aankoopprijs)
      const { data } = await axios.post(
        `/api/ingredienten/nutrition/importeer/${encodeURIComponent(geselecteerd.externeId)}?${params}`
      )
      toast.success(`"${data.naam}" aangemaakt met voedingswaarden uit de databank.`)
      navigate(`/ingredienten/${data.id}`)
    } catch (err: unknown) {
      const res = axios.isAxiosError(err) ? err.response?.data : null
      toast.error(res?.bericht ?? 'Aanmaken mislukt.')
    } finally {
      setAanmakend(false)
    }
  }

  return (
    <div className="flex flex-col gap-0">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-5">
        <Link to="/ingredienten" className="hover:text-amber-700 transition-colors">Ingrediënten</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-800 font-medium">Nieuw ingrediënt</span>
      </nav>

      <h1 className="text-xl font-semibold text-slate-900 mb-1">Nieuw ingrediënt</h1>

      {/* ── Zoekfase ─────────────────────────────────────────── */}
      {fase === 'zoeken' && (
        <div className="flex flex-col gap-5 mt-6">
          <p className="text-sm text-slate-500">
            Zoek het ingrediënt in de voedingsdatabank om voedingswaarden en allergenen automatisch in te vullen.
          </p>

          <form onSubmit={handleZoekSubmit} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="bv. tarwebloem, boter, suiker…"
                  value={zoekterm}
                  onChange={e => setZoekterm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="relative w-44">
                <input
                  type="text"
                  placeholder="Merk / fabrikant"
                  value={merk}
                  onChange={e => setMerk(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <button
                type="submit"
                disabled={zoekend || !zoekterm.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium rounded-md transition-colors"
              >
                {zoekend ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Zoeken
              </button>
            </div>
            <p className="text-xs text-slate-400">Gebruik het merkveld om te verfijnen op fabrikant of leverancier, bv. "Campina", "Albert Heijn".</p>
          </form>

          {/* Resultaten */}
          {zoekend && (
            <div className="flex flex-col gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-11 bg-slate-100 rounded-md animate-pulse" />
              ))}
            </div>
          )}

          {!zoekend && pagina && (
            <DataTable
              columns={zoekResultaatKolommen}
              data={pagina.resultaten}
              totalElements={pagina.totaalAantal}
              totalPages={pagina.totalePaginas}
              pageState={{ page: huidigePagina, size: PAGINA_GROOTTE }}
              sortState={{ sortBy: 'naam', sortDir: 'ASC' }}
              onPageChange={handlePaginaWijziging}
              onSortChange={() => {}}
              onRowClick={selecteer}
              keyFn={r => r.externeId}
              emptyMessage="Geen resultaten. Probeer een andere zoekterm of laat het merkveld leeg."
            />
          )}

          <div className={`border-t border-slate-100 pt-4 ${pagina ? '' : 'mt-2'}`}>
            <button
              type="button"
              onClick={() => setFase('manueel')}
              className="text-sm text-slate-500 hover:text-amber-700 underline underline-offset-2 transition-colors"
            >
              Manueel invoeren zonder databank
            </button>
          </div>
        </div>
      )}

      {/* ── Geselecteerd-fase ─────────────────────────────────── */}
      {fase === 'geselecteerd' && geselecteerd && (
        <form onSubmit={importeer} className="flex flex-col gap-6 mt-6 max-w-lg">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">{geselecteerd.naam}</p>
              {geselecteerd.merk && <p className="text-xs text-amber-700">{geselecteerd.merk}</p>}
              <p className="text-xs text-amber-700 mt-1">
                Voedingswaarden en allergenen worden automatisch opgehaald uit de databank.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Naam <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={naam}
                onChange={e => setNaam(e.target.value)}
                className={veld}
                placeholder="Naam van het ingrediënt"
              />
              <p className="text-xs text-slate-400 mt-1">Pas de naam aan naar hoe jullie het intern noemen.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Eenheid <span className="text-red-500">*</span>
                </label>
                <select value={eenheid} onChange={e => setEenheid(e.target.value as Eenheid)} className={veld}>
                  {EENHEID_OPTIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Aankoopprijs / {EENHEID_KORT[eenheid]}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                  <input
                    type="number" min="0" step="0.0001"
                    value={aankoopprijs}
                    onChange={e => setAankoopprijs(e.target.value)}
                    className={`${veld} pl-7`}
                    placeholder="0.0000"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button
              type="submit" disabled={aanmakend}
              className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium rounded-md transition-colors"
            >
              {aanmakend && <Loader2 className="h-4 w-4 animate-spin" />}
              {aanmakend ? 'Bezig…' : 'Ingrediënt aanmaken'}
            </button>
            <button
              type="button" onClick={() => setFase('zoeken')}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm rounded-md transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Andere kiezen
            </button>
          </div>
        </form>
      )}

      {/* ── Manuele fase ─────────────────────────────────────── */}
      {fase === 'manueel' && (
        <div className="mt-6">
          <button
            type="button" onClick={() => setFase('zoeken')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-amber-700 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Terug naar zoeken in databank
          </button>
          <IngredientForm
            onOpgeslagen={ingredient => navigate(`/ingredienten/${ingredient.id}`)}
            onAnnuleer={() => navigate('/ingredienten')}
          />
        </div>
      )}
    </div>
  )
}

const veld = 'w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white'
