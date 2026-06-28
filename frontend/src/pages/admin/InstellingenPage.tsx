import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import {
  Upload, CheckCircle2, AlertCircle, Loader2, ExternalLink,
  FileText, Search, ArrowRight,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Eenheid } from '../../types/ingredient'
import { EENHEID_OPTIES } from '../ingredienten/IngredientForm'

// ─── Types ──────────────────────────────────────────────────────────────────

interface NevoStatus { aantalProducten: number }
interface ImportResultaat { geimporteerd: number; fouten: string[] }

interface ZoekResultaat {
  externeId: string
  naam: string
  merk?: string
  heeftVoedingswaarden: boolean
}

type Tab = 'provider' | 'nevo' | 'importeer'

// ─── Pagina ─────────────────────────────────────────────────────────────────

export function InstellingenPage() {
  const [actieveTab, setActieveTab] = useState<Tab>('provider')

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-900">Beheer</h1>

      <div className="flex gap-1 border-b border-slate-200">
        {([
          ['provider', 'Voedingsdatabank'],
          ['nevo',     'NEVO importeren'],
          ['importeer','Ingrediënten importeren'],
        ] as [Tab, string][]).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActieveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              actieveTab === tab
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="max-w-2xl">
        {actieveTab === 'provider'   && <ProviderTab />}
        {actieveTab === 'nevo'       && <NevoImportTab />}
        {actieveTab === 'importeer'  && <IngredientImportTab />}
      </div>
    </div>
  )
}

// ─── Tab: Provider ──────────────────────────────────────────────────────────

function ProviderTab() {
  const [actief, setActief] = useState<string | null>(null)
  const [nevoAantal, setNevoAantal] = useState<number | null>(null)

  useEffect(() => {
    axios.get('/api/ingredienten/nutrition/providers').then(r => {
      setActief(r.data.actief)
    })
    axios.get('/api/admin/nevo/status').then(r => setNevoAantal(r.data.aantalProducten))
  }, [])

  async function wissel(naam: string) {
    try {
      await axios.put(`/api/ingredienten/nutrition/providers/actief?provider=${naam}`)
      setActief(naam)
      toast.success(`Actieve provider ingesteld op ${naam}.`)
    } catch {
      toast.error('Wisselen mislukt.')
    }
  }

  const providers: { naam: string; titel: string; beschrijving: string; extra?: string }[] = [
    {
      naam: 'NEVO',
      titel: '🇳🇱 NEVO',
      beschrijving: 'Nederlands Voedingsstoffendatabestand (RIVM). Ideaal voor vers fruit, groenten, zuivel en basisingrediënten. Data wordt lokaal opgeslagen.',
      extra: nevoAantal !== null ? (nevoAantal > 0 ? `${nevoAantal.toLocaleString('nl-BE')} producten geladen` : 'Nog geen data — importeer eerst via het NEVO-tabblad') : undefined,
    },
    {
      naam: 'OPEN_FOOD_FACTS',
      titel: '📦 OpenFoodFacts',
      beschrijving: 'Open internationale databank met verpakte producten. Goed voor producten met een barcode (fabrikanten, merken). Vers fruit en basisingrediënten zijn hier zelden aanwezig.',
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-1">Actieve voedingsdatabank</h2>
        <p className="text-sm text-slate-500">
          Bepaalt welke externe databank wordt gebruikt bij het importeren van ingrediënten.
          Je kunt dit op elk moment wijzigen zonder herstart.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {providers.map(p => {
          const isActief = actief === p.naam
          const isUitgeschakeld = p.naam === 'NEVO' && (nevoAantal === 0 || nevoAantal === null)
          return (
            <button
              key={p.naam}
              onClick={() => !isUitgeschakeld && wissel(p.naam)}
              disabled={isActief || isUitgeschakeld}
              className={`text-left p-4 rounded-lg border-2 transition-all ${
                isActief
                  ? 'border-amber-500 bg-amber-50'
                  : isUitgeschakeld
                  ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                  : 'border-slate-200 hover:border-amber-300 hover:bg-slate-50 cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">{p.titel}</span>
                {isActief && (
                  <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Actief</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">{p.beschrijving}</p>
              {p.extra && (
                <p className={`text-xs mt-1.5 font-medium ${nevoAantal && nevoAantal > 0 ? 'text-green-700' : 'text-amber-600'}`}>
                  {p.extra}
                </p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Tab: NEVO import ───────────────────────────────────────────────────────

function NevoImportTab() {
  const [status, setStatus] = useState<NevoStatus | null>(null)
  const [bezig, setBezig] = useState(false)
  const [resultaat, setResultaat] = useState<ImportResultaat | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { laadStatus() }, [])

  async function laadStatus() {
    const { data } = await axios.get('/api/admin/nevo/status')
    setStatus(data)
  }

  async function handleBestand(bestand: File) {
    setBezig(true)
    setResultaat(null)
    const formData = new FormData()
    formData.append('bestand', bestand)
    try {
      const { data } = await axios.post('/api/admin/nevo/importeer', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResultaat(data)
      if (data.geimporteerd > 0) toast.success(`${data.geimporteerd} producten geïmporteerd.`)
      await laadStatus()
    } catch {
      toast.error('Import mislukt.')
    } finally {
      setBezig(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-1">NEVO-databank importeren</h2>
        <p className="text-sm text-slate-500">
          De NEVO-data wordt lokaal opgeslagen en bevat voedingswaarden voor vers fruit, groenten, vlees, zuivel en duizenden andere producten — alles in het Nederlands.
        </p>
      </div>

      {/* Status */}
      {status && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm ${
          status.aantalProducten > 0
            ? 'bg-green-50 border-green-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          {status.aantalProducten > 0
            ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            : <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          }
          <span className="text-slate-700">
            {status.aantalProducten > 0
              ? <><strong>{status.aantalProducten.toLocaleString('nl-BE')} producten</strong> geladen — je kunt opnieuw importeren om te updaten</>
              : 'Nog geen NEVO-data aanwezig'
            }
          </span>
        </div>
      )}

      {/* Instructies */}
      <div className="border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Hoe importeren</p>
        <ol className="text-sm text-slate-600 flex flex-col gap-2 list-decimal list-inside">
          <li>
            Ga naar{' '}
            <a href="https://nevo-online.rivm.nl" target="_blank" rel="noopener noreferrer"
              className="text-amber-700 hover:underline inline-flex items-center gap-1">
              nevo-online.rivm.nl <ExternalLink className="h-3 w-3" />
            </a>
          </li>
          <li>Klik op <strong>"Data downloaden"</strong> en download het Excel-bestand</li>
          <li>Open in Excel of LibreOffice Calc en sla op als <strong>CSV</strong></li>
          <li>Upload het CSV-bestand hieronder</li>
        </ol>
        <div className="bg-slate-50 rounded-md p-3 text-xs text-slate-500">
          <p className="font-medium text-slate-600 mb-1">Herkende kolomnamen (niet hoofdlettergevoelig):</p>
          <p><code>code / Productcode</code> · <code>naam / Productomschrijving</code> · <code>groep / Levensmiddelengroep</code></p>
          <p className="mt-0.5"><code>Energie (kcal)</code> · <code>Eiwit (g)</code> · <code>Koolhydraten (g)</code> · <code>Vet (g)</code> · <code>Verzadigd vet (g)</code> · <code>Voedingsvezel (g)</code> · <code>Natrium (mg)</code></p>
        </div>
      </div>

      {/* Upload */}
      <div
        className="border-2 border-dashed border-slate-200 hover:border-amber-300 rounded-lg p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors group"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleBestand(f) }}
      >
        {bezig
          ? <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
          : <Upload className="h-8 w-8 text-slate-300 group-hover:text-amber-400 transition-colors" />
        }
        <div className="text-center">
          <p className="text-sm font-medium text-slate-700">{bezig ? 'Importeren…' : 'Sleep CSV hier of klik om te kiezen'}</p>
          <p className="text-xs text-slate-400 mt-0.5">Puntkomma of komma als scheidingsteken</p>
        </div>
        <input ref={inputRef} type="file" accept=".csv,.txt" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleBestand(f) }} />
      </div>

      {/* Resultaat */}
      {resultaat && (
        <div className={`border rounded-lg p-4 flex flex-col gap-2 ${
          resultaat.fouten.length === 0 ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'
        }`}>
          <div className="flex items-center gap-2">
            {resultaat.fouten.length === 0
              ? <CheckCircle2 className="h-4 w-4 text-green-600" />
              : <AlertCircle className="h-4 w-4 text-amber-600" />
            }
            <p className="text-sm font-medium text-slate-800">
              {resultaat.geimporteerd} producten geïmporteerd
              {resultaat.fouten.length > 0 && `, ${resultaat.fouten.length} rij(en) overgeslagen`}
            </p>
          </div>
          {resultaat.fouten.slice(0, 8).map((f, i) => (
            <div key={i} className="flex items-start gap-1.5 ml-6 text-xs text-slate-600">
              <FileText className="h-3 w-3 mt-0.5 shrink-0 text-amber-500" /> {f}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Ingrediënten importeren ───────────────────────────────────────────

function IngredientImportTab() {
  const navigate = useNavigate()
  const [zoekterm, setZoekterm] = useState('')
  const [zoekend, setZoekend] = useState(false)
  const [resultaten, setResultaten] = useState<ZoekResultaat[]>([])
  const [totaal, setTotaal] = useState(0)
  const [geselecteerd, setGeselecteerd] = useState<ZoekResultaat | null>(null)
  const [naam, setNaam] = useState('')
  const [eenheid, setEenheid] = useState<Eenheid>('G')
  const [importBezig, setImportBezig] = useState(false)
  const [actieveProvider, setActieveProvider] = useState('')

  useEffect(() => {
    axios.get('/api/ingredienten/nutrition/providers')
      .then(r => setActieveProvider(r.data.actief))
  }, [])

  async function zoek(e: React.FormEvent) {
    e.preventDefault()
    if (!zoekterm.trim()) return
    setZoekend(true)
    setGeselecteerd(null)
    try {
      const { data } = await axios.get(`/api/ingredienten/nutrition/zoek?query=${encodeURIComponent(zoekterm)}&paginaGrootte=30`)
      setResultaten(data.resultaten)
      setTotaal(data.totaalAantal)
      if (data.totaalAantal === 0) toast.info('Geen resultaten.')
    } catch {
      toast.error('Zoeken mislukt.')
    } finally {
      setZoekend(false)
    }
  }

  async function importeer(e: React.FormEvent) {
    e.preventDefault()
    if (!geselecteerd) return
    setImportBezig(true)
    try {
      const params = new URLSearchParams({ naam, eenheid })
      const { data } = await axios.post(
        `/api/ingredienten/nutrition/importeer?externeId=${encodeURIComponent(geselecteerd.externeId)}&${params}`
      )
      toast.success(`"${data.naam}" aangemaakt.`)
      navigate(`/ingredienten/${data.id}`)
    } catch (err: unknown) {
      const res = axios.isAxiosError(err) ? err.response?.data : null
      toast.error(res?.bericht ?? 'Aanmaken mislukt.')
    } finally {
      setImportBezig(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-1">Ingrediënt importeren vanuit databank</h2>
        <p className="text-sm text-slate-500">
          Zoek in de actieve voedingsdatabank
          {actieveProvider && <> (<strong>{actieveProvider === 'NEVO' ? 'NEVO' : 'OpenFoodFacts'}</strong>)</>}
          {' '}en maak een ingrediënt aan met automatisch ingevulde voedingswaarden.
          Wissel van databank via het tabblad <em>Voedingsdatabank</em>.
        </p>
      </div>

      {!geselecteerd ? (
        <>
          <form onSubmit={zoek} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                autoFocus
                value={zoekterm} onChange={e => setZoekterm(e.target.value)}
                placeholder={actieveProvider === 'NEVO' ? 'bv. appel, aardbei, halfvolle melk…' : 'bv. Campina halfvol, Soubry bloem…'}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button type="submit" disabled={zoekend || !zoekterm.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium rounded-md transition-colors">
              {zoekend ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Zoeken
            </button>
          </form>

          {zoekend && (
            <div className="flex flex-col gap-1.5">
              {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />)}
            </div>
          )}

          {!zoekend && resultaten.length > 0 && (
            <div className="flex flex-col gap-1">
              {totaal > resultaten.length && (
                <p className="text-xs text-slate-400 mb-1">Top {resultaten.length} van {totaal} resultaten — verfijn je zoekopdracht voor betere resultaten.</p>
              )}
              {resultaten.map(r => (
                <button
                  key={r.externeId}
                  onClick={() => { setGeselecteerd(r); setNaam(r.naam) }}
                  className="flex items-center justify-between px-4 py-2.5 text-left border border-slate-200 rounded-md hover:border-amber-300 hover:bg-amber-50 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{r.naam}</p>
                    {r.merk && <p className="text-xs text-slate-400">{r.merk}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {r.heeftVoedingswaarden && (
                      <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">voedingswaarden</span>
                    )}
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <form onSubmit={importeer} className="flex flex-col gap-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">{geselecteerd.naam}</p>
              {geselecteerd.merk && <p className="text-xs text-amber-700">{geselecteerd.merk}</p>}
              <p className="text-xs text-amber-700 mt-1">Voedingswaarden worden automatisch opgehaald.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Naam <span className="text-red-500">*</span></label>
              <input required value={naam} onChange={e => setNaam(e.target.value)} className={veld} />
              <p className="text-xs text-slate-400 mt-1">Pas aan naar de interne benaming.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Eenheid <span className="text-red-500">*</span></label>
              <select value={eenheid} onChange={e => setEenheid(e.target.value as Eenheid)} className={veld}>
                {EENHEID_OPTIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button type="submit" disabled={importBezig}
              className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium rounded-md transition-colors">
              {importBezig && <Loader2 className="h-4 w-4 animate-spin" />}
              {importBezig ? 'Bezig…' : 'Ingrediënt aanmaken'}
            </button>
            <button type="button" onClick={() => setGeselecteerd(null)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm rounded-md transition-colors">
              Andere kiezen
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

const veld = 'w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white'
