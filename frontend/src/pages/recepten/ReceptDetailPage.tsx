import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'sonner'
import { ChevronRight, Plus, X, Trash2 } from 'lucide-react'
import type { Eenheid } from '../../types/ingredient'
import type { ReceptResponse, HoudbaarheidEenheid, ReceptSummaryResponse } from '../../types/recept'
import { EENHEID_OPTIES, EENHEID_KORT } from '../ingredienten/IngredientForm'
import { RijkeEditor } from '../../components/ui/RijkeEditor'

interface IngredientOptie { id: string; naam: string; eenheid: Eenheid }

interface RegelRij {
  clientId: string
  serverId?: string
  type: 'INGREDIENT' | 'RECEPT'
  hoeveelheid: string
  eenheid: Eenheid
  ingredientId?: string
  ingredientNaam?: string
  subReceptId?: string
  subReceptNaam?: string
}

const HOUDBAARHEID_OPTIES: { value: HoudbaarheidEenheid; label: string }[] = [
  { value: 'DAGEN', label: 'dagen' },
  { value: 'WEKEN', label: 'weken' },
  { value: 'MAANDEN', label: 'maanden' },
]

const HOUDBAARHEID_LABEL: Record<string, string> = {
  DAGEN: 'dag(en)', WEKEN: 'week/weken', MAANDEN: 'maand(en)',
}

function vanRecept(r: ReceptResponse): { naam: string; houdbaarheidWaarde: string; houdbaarheidEenheid: HoudbaarheidEenheid; regels: RegelRij[] } {
  return {
    naam: r.naam,
    houdbaarheidWaarde: r.houdbaarheid ? String(r.houdbaarheid.waarde) : '',
    houdbaarheidEenheid: r.houdbaarheid?.eenheid ?? 'DAGEN',
    regels: r.regels.map(regel => ({
      clientId: regel.id,
      serverId: regel.id,
      type: regel.type,
      hoeveelheid: String(regel.hoeveelheid),
      eenheid: regel.eenheid,
      ingredientId: regel.ingredient?.id,
      ingredientNaam: regel.ingredient?.naam,
      subReceptId: regel.subRecept?.id,
      subReceptNaam: regel.subRecept?.naam,
    })),
  }
}

export function ReceptDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [recept, setRecept] = useState<ReceptResponse | null>(null)
  const [laden, setLaden] = useState(true)
  const [bewerkModus, setBewerkModus] = useState(false)
  const [bezig, setBezig] = useState(false)

  const [naam, setNaam] = useState('')
  const [houdbaarheidWaarde, setHoudbaarheidWaarde] = useState('')
  const [houdbaarheidEenheid, setHoudbaarheidEenheid] = useState<HoudbaarheidEenheid>('DAGEN')
  const [bereidingswijze, setBereidingswijze] = useState('')
  const [opmerkingen, setOpmerkingen] = useState('')
  const [regels, setRegels] = useState<RegelRij[]>([])

  const [ingredienten, setIngredienten] = useState<IngredientOptie[]>([])
  const [recepten, setRecepten] = useState<ReceptSummaryResponse[]>([])
  const [toonNieuweRegel, setToonNieuweRegel] = useState<'INGREDIENT' | 'RECEPT' | null>(null)
  const [nieuweIngredientId, setNieuweIngredientId] = useState('')
  const [nieuweSubReceptId, setNieuweSubReceptId] = useState('')
  const [nieuweHoeveelheid, setNieuweHoeveelheid] = useState('')
  const [nieuweEenheid, setNieuweEenheid] = useState<Eenheid>('G')

  async function laad() {
    try {
      const { data } = await axios.get(`/api/recepten/${id}`)
      setRecept(data)
    } catch {
      toast.error('Recept niet gevonden.')
      navigate('/recepten')
    } finally {
      setLaden(false)
    }
  }

  useEffect(() => { laad() }, [id])

  function startBewerken() {
    const f = vanRecept(recept!)
    setNaam(f.naam)
    setHoudbaarheidWaarde(f.houdbaarheidWaarde)
    setHoudbaarheidEenheid(f.houdbaarheidEenheid)
    setBereidingswijze(recept!.bereidingswijze ?? '')
    setOpmerkingen(recept!.opmerkingen ?? '')
    setRegels(f.regels)
    axios.get('/api/ingredienten?paginaGrootte=1000').then(r => setIngredienten(r.data.content))
    axios.get('/api/recepten?paginaGrootte=1000').then(r =>
      setRecepten(r.data.content.filter((r: ReceptSummaryResponse) => r.id !== id))
    )
    setBewerkModus(true)
  }

  function annuleer() {
    setBewerkModus(false)
    resetNieuweRegel()
  }

  function voegIngredientToe() {
    const ing = ingredienten.find(i => i.id === nieuweIngredientId)
    if (!ing || !nieuweHoeveelheid) return
    setRegels(prev => [...prev, {
      clientId: crypto.randomUUID(), type: 'INGREDIENT',
      hoeveelheid: nieuweHoeveelheid, eenheid: nieuweEenheid,
      ingredientId: ing.id, ingredientNaam: ing.naam,
    }])
    resetNieuweRegel()
  }

  function voegSubReceptToe() {
    const rec = recepten.find(r => r.id === nieuweSubReceptId)
    if (!rec || !nieuweHoeveelheid) return
    setRegels(prev => [...prev, {
      clientId: crypto.randomUUID(), type: 'RECEPT',
      hoeveelheid: nieuweHoeveelheid, eenheid: 'ST',
      subReceptId: rec.id, subReceptNaam: rec.naam,
    }])
    resetNieuweRegel()
  }

  function resetNieuweRegel() {
    setToonNieuweRegel(null)
    setNieuweIngredientId('')
    setNieuweSubReceptId('')
    setNieuweHoeveelheid('')
    setNieuweEenheid('G')
  }

  async function opslaan(e: React.FormEvent) {
    e.preventDefault()
    setBezig(true)
    try {
      const { data } = await axios.put(`/api/recepten/${id}`, {
        naam,
        houdbaarheidWaarde: houdbaarheidWaarde ? parseInt(houdbaarheidWaarde) : null,
        houdbaarheidEenheid: houdbaarheidWaarde ? houdbaarheidEenheid : null,
        bereidingswijze: bereidingswijze || null,
        opmerkingen: opmerkingen || null,
        regels: regels.map((r, i) => ({
          type: r.type,
          hoeveelheid: parseFloat(r.hoeveelheid),
          eenheid: r.eenheid,
          ingredientId: r.ingredientId ?? null,
          subReceptId: r.subReceptId ?? null,
          volgorde: i,
        })),
      })
      setRecept(data)
      setBewerkModus(false)
      resetNieuweRegel()
      toast.success('Recept bijgewerkt.')
    } catch (err: unknown) {
      const res = axios.isAxiosError(err) ? err.response?.data : null
      toast.error(res?.bericht ?? 'Opslaan mislukt.')
    } finally {
      setBezig(false)
    }
  }

  async function verwijder() {
    if (!confirm(`Recept "${recept?.naam}" verwijderen?`)) return
    try {
      await axios.delete(`/api/recepten/${id}`)
      toast.success('Recept verwijderd.')
      navigate('/recepten')
    } catch (err: unknown) {
      const res = axios.isAxiosError(err) ? err.response?.data : null
      toast.error(res?.bericht ?? 'Verwijderen mislukt.')
    }
  }

  if (laden) return <Skeleton />
  if (!recept) return null

  const letter = recept.naam[0]?.toUpperCase() ?? '?'

  return (
    <div className="flex flex-col gap-0">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-5">
        <Link to="/recepten" className="hover:text-amber-700 transition-colors">Recepten</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-800 font-medium">{recept.naam}</span>
        {bewerkModus && <><ChevronRight className="h-3.5 w-3.5" /><span className="text-slate-800 font-medium">Bewerken</span></>}
      </nav>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-base font-semibold shrink-0">
            {letter}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{recept.naam}</h1>
            <p className="text-sm text-slate-500">
              {recept.houdbaarheid
                ? `Houdbaar: ${recept.houdbaarheid.waarde} ${HOUDBAARHEID_LABEL[recept.houdbaarheid.eenheid]}`
                : 'Geen houdbaarheid ingesteld'}
            </p>
          </div>
        </div>
        {!bewerkModus && (
          <div className="flex gap-2">
            <button onClick={startBewerken}
              className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-colors">
              Bewerken
            </button>
            <button onClick={verwijder}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {!bewerkModus ? (
        // ── Weergavemodus ──
        <div className="flex flex-col gap-8">
          <Sectie titel="Ingrediënten & subrecepten">
            {recept.regels.length === 0 ? (
              <p className="text-sm text-slate-400">Geen regels.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide pb-2 pr-4">Component</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide pb-2 w-32">Hoeveelheid</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide pb-2 pl-3 w-20">Eenheid</th>
                  </tr>
                </thead>
                <tbody>
                  {recept.regels.map(regel => (
                    <tr key={regel.id} className="border-b border-slate-100">
                      <td className="py-2 pr-4">
                        <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded mr-2 ${
                          regel.type === 'INGREDIENT'
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {regel.type === 'INGREDIENT' ? 'I' : 'R'}
                        </span>
                        <span className="font-medium text-slate-800">
                          {regel.ingredient?.naam ?? regel.subRecept?.naam}
                        </span>
                      </td>
                      <td className="py-2 text-right text-slate-700">{Number(regel.hoeveelheid)}</td>
                      <td className="py-2 pl-3 text-slate-500">
                        {regel.type === 'INGREDIENT' ? EENHEID_KORT[regel.eenheid] : 'batch(es)'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Sectie>

          {recept.bereidingswijze && (
            <Sectie titel="Bereidingswijze">
              <RijkeEditor waarde={recept.bereidingswijze} onChange={() => {}} readonly />
            </Sectie>
          )}

          <Sectie titel="Voedingswaarden (berekend per recept)">
            {recept.voedingswaarden ? (
              <div className="grid grid-cols-4 gap-4">
                {([
                  ['Energie', `${recept.voedingswaarden.energie} kcal`],
                  ['Eiwitten', `${recept.voedingswaarden.eiwitten} g`],
                  ['Koolhydraten', `${recept.voedingswaarden.koolhydraten} g`],
                  ['↳ Suikers', `${recept.voedingswaarden.suikers} g`],
                  ['Vetten', `${recept.voedingswaarden.vetten} g`],
                  ['↳ Verzadigd', `${recept.voedingswaarden.verzadigdVet} g`],
                  ['Vezels', `${recept.voedingswaarden.vezels} g`],
                  ['Zout', `${recept.voedingswaarden.zout} g`],
                ] as [string, string][]).map(([label, waarde]) => (
                  <div key={label} className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-500">{label}</span>
                    <span className="text-sm text-slate-800">{waarde}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Geen voedingswaarden beschikbaar (ingrediënten missen data).</p>
            )}
          </Sectie>

          {recept.opmerkingen && (
            <Sectie titel="Opmerkingen">
              <RijkeEditor waarde={recept.opmerkingen} onChange={() => {}} readonly />
            </Sectie>
          )}
        </div>
      ) : (
        // ── Bewerkmodus ──
        <form onSubmit={opslaan} className="flex flex-col gap-8 max-w-2xl">
          <Sectie titel="Algemeen">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Naam <span className="text-red-500">*</span></label>
                <input required value={naam} onChange={e => setNaam(e.target.value)} className={veld} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Houdbaarheid (optioneel)</label>
                <div className="flex gap-2">
                  <input
                    type="number" min="1" value={houdbaarheidWaarde}
                    onChange={e => setHoudbaarheidWaarde(e.target.value)}
                    className={`${veld} w-24`} placeholder="bv. 4"
                  />
                  <select value={houdbaarheidEenheid} onChange={e => setHoudbaarheidEenheid(e.target.value as HoudbaarheidEenheid)} className={veld}>
                    {HOUDBAARHEID_OPTIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </Sectie>

          <Sectie titel="Ingrediënten & subrecepten">
            <div className="flex flex-col gap-2">
              {regels.map(regel => (
                <div key={regel.clientId} className="flex items-center gap-3 py-2 px-3 bg-slate-50 border border-slate-200 rounded-md">
                  <span className="text-xs text-slate-400 w-16 shrink-0">
                    {regel.type === 'INGREDIENT' ? 'Ingrediënt' : 'Subrecept'}
                  </span>
                  <span className="flex-1 text-sm font-medium text-slate-800">
                    {regel.type === 'INGREDIENT' ? regel.ingredientNaam : regel.subReceptNaam}
                  </span>
                  <input
                    type="number" min="0.001" step="any"
                    value={regel.hoeveelheid}
                    onChange={e => setRegels(prev => prev.map(r => r.clientId === regel.clientId ? { ...r, hoeveelheid: e.target.value } : r))}
                    className="w-24 border border-slate-200 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                  {regel.type === 'INGREDIENT' ? (
                    <select
                      value={regel.eenheid}
                      onChange={e => setRegels(prev => prev.map(r => r.clientId === regel.clientId ? { ...r, eenheid: e.target.value as Eenheid } : r))}
                      className="border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    >
                      {EENHEID_OPTIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <span className="text-sm text-slate-500 w-20">batch(es)</span>
                  )}
                  <button type="button" onClick={() => setRegels(prev => prev.filter(r => r.clientId !== regel.clientId))}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {toonNieuweRegel === 'INGREDIENT' && (
                <div className="flex flex-col gap-2 p-3 border border-amber-200 bg-amber-50 rounded-md">
                  <select value={nieuweIngredientId}
                    onChange={e => {
                      const ing = ingredienten.find(i => i.id === e.target.value)
                      setNieuweIngredientId(e.target.value)
                      if (ing) setNieuweEenheid(ing.eenheid)
                    }}
                    className={veld}>
                    {ingredienten.map(i => <option key={i.id} value={i.id}>{i.naam}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <input type="number" min="0.001" step="any" placeholder="hoeveelheid"
                      value={nieuweHoeveelheid} onChange={e => setNieuweHoeveelheid(e.target.value)}
                      className={`${veld} w-36`} autoFocus />
                    <select value={nieuweEenheid} onChange={e => setNieuweEenheid(e.target.value as Eenheid)} className={veld}>
                      {EENHEID_OPTIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <button type="button" onClick={voegIngredientToe}
                      disabled={!nieuweIngredientId || !nieuweHoeveelheid}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium rounded-md transition-colors">
                      Toevoegen
                    </button>
                    <button type="button" onClick={resetNieuweRegel}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm rounded-md transition-colors">
                      Annuleren
                    </button>
                  </div>
                </div>
              )}

              {toonNieuweRegel === 'RECEPT' && (
                <div className="flex flex-col gap-2 p-3 border border-amber-200 bg-amber-50 rounded-md">
                  {recepten.length === 0 ? (
                    <p className="text-sm text-slate-500">Geen andere recepten beschikbaar.</p>
                  ) : (
                    <>
                      <select value={nieuweSubReceptId} onChange={e => setNieuweSubReceptId(e.target.value)} className={veld}>
                        {recepten.map(r => <option key={r.id} value={r.id}>{r.naam}</option>)}
                      </select>
                      <div className="flex gap-2 items-center">
                        <input type="number" min="0.001" step="any" placeholder="aantal batches"
                          value={nieuweHoeveelheid} onChange={e => setNieuweHoeveelheid(e.target.value)}
                          className={`${veld} w-36`} autoFocus />
                        <span className="text-sm text-slate-500">batch(es)</span>
                        <button type="button" onClick={voegSubReceptToe}
                          disabled={!nieuweSubReceptId || !nieuweHoeveelheid}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium rounded-md transition-colors">
                          Toevoegen
                        </button>
                        <button type="button" onClick={resetNieuweRegel}
                          className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm rounded-md transition-colors">
                          Annuleren
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {toonNieuweRegel === null && (
                <div className="flex gap-2 mt-1">
                  <button type="button"
                    onClick={() => { resetNieuweRegel(); setNieuweIngredientId(ingredienten[0]?.id ?? ''); setNieuweEenheid(ingredienten[0]?.eenheid ?? 'G'); setToonNieuweRegel('INGREDIENT') }}
                    className="flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-800 font-medium">
                    <Plus className="h-4 w-4" /> Ingrediënt toevoegen
                  </button>
                  <span className="text-slate-300">|</span>
                  <button type="button"
                    disabled={recepten.length === 0}
                    onClick={() => { resetNieuweRegel(); setNieuweSubReceptId(recepten[0]?.id ?? ''); setToonNieuweRegel('RECEPT') }}
                    className="flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-800 font-medium disabled:opacity-40">
                    <Plus className="h-4 w-4" /> Subrecept toevoegen
                  </button>
                </div>
              )}
            </div>
          </Sectie>

          <Sectie titel="Bereidingswijze">
            <RijkeEditor
              waarde={bereidingswijze}
              onChange={setBereidingswijze}
              placeholder="Beschrijf de bereiding stap voor stap…"
            />
          </Sectie>

          <Sectie titel="Opmerkingen">
            <RijkeEditor
              waarde={opmerkingen}
              onChange={setOpmerkingen}
              placeholder="Allergenen, tips, variaties, bewaarinstructies…"
            />
          </Sectie>

          <div className="flex gap-3 pt-6 border-t border-slate-200">
            <button type="submit" disabled={bezig}
              className="px-5 py-2 rounded-md bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium transition-colors">
              {bezig ? 'Bezig…' : 'Opslaan'}
            </button>
            <button type="button" onClick={annuleer}
              className="px-4 py-2 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm transition-colors">
              Annuleren
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function Sectie({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{titel}</h3>
      {children}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-4 w-48 bg-slate-100 rounded" />
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-slate-100" />
        <div className="flex flex-col gap-2">
          <div className="h-5 w-40 bg-slate-100 rounded" />
          <div className="h-3 w-24 bg-slate-100 rounded" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded" />)}
      </div>
    </div>
  )
}

const veld = 'w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white'
