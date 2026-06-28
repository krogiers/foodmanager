import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'sonner'
import { ChevronRight, Plus, X, Loader2 } from 'lucide-react'
import type { Eenheid } from '../../types/ingredient'
import type { HoudbaarheidEenheid } from '../../types/recept'
import { EENHEID_OPTIES, EENHEID_KORT } from '../ingredienten/IngredientForm'
import { RijkeEditor } from '../../components/ui/RijkeEditor'

interface IngredientOptie { id: string; naam: string; eenheid: Eenheid }
interface ReceptOptie { id: string; naam: string }

interface RegelRij {
  clientId: string
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

export function ReceptNieuwPage() {
  const navigate = useNavigate()
  const [naam, setNaam] = useState('')
  const [houdbaarheidWaarde, setHoudbaarheidWaarde] = useState('')
  const [houdbaarheidEenheid, setHoudbaarheidEenheid] = useState<HoudbaarheidEenheid>('DAGEN')
  const [bereidingswijze, setBereidingswijze] = useState('')
  const [opmerkingen, setOpmerkingen] = useState('')
  const [regels, setRegels] = useState<RegelRij[]>([])
  const [bezig, setBezig] = useState(false)

  const [ingredienten, setIngredienten] = useState<IngredientOptie[]>([])
  const [recepten, setRecepten] = useState<ReceptOptie[]>([])

  // Nieuw-regel-formulier state
  const [toonNieuweRegel, setToonNieuweRegel] = useState<'INGREDIENT' | 'RECEPT' | null>(null)
  const [nieuweIngredientId, setNieuweIngredientId] = useState('')
  const [nieuweSubReceptId, setNieuweSubReceptId] = useState('')
  const [nieuweHoeveelheid, setNieuweHoeveelheid] = useState('')
  const [nieuweEenheid, setNieuweEenheid] = useState<Eenheid>('G')

  useEffect(() => {
    axios.get('/api/ingredienten?paginaGrootte=1000').then(r => setIngredienten(r.data.content))
    axios.get('/api/recepten?paginaGrootte=1000').then(r => setRecepten(r.data.content))
  }, [])

  function voegIngredientToe() {
    const ing = ingredienten.find(i => i.id === nieuweIngredientId)
    if (!ing || !nieuweHoeveelheid) return
    setRegels(prev => [...prev, {
      clientId: crypto.randomUUID(),
      type: 'INGREDIENT',
      hoeveelheid: nieuweHoeveelheid,
      eenheid: nieuweEenheid,
      ingredientId: ing.id,
      ingredientNaam: ing.naam,
    }])
    resetNieuweRegel()
  }

  function voegSubReceptToe() {
    const rec = recepten.find(r => r.id === nieuweSubReceptId)
    if (!rec || !nieuweHoeveelheid) return
    setRegels(prev => [...prev, {
      clientId: crypto.randomUUID(),
      type: 'RECEPT',
      hoeveelheid: nieuweHoeveelheid,
      eenheid: 'ST',
      subReceptId: rec.id,
      subReceptNaam: rec.naam,
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

  function openIngredientForm() {
    resetNieuweRegel()
    setNieuweIngredientId(ingredienten[0]?.id ?? '')
    setNieuweEenheid(ingredienten[0]?.eenheid ?? 'G')
    setToonNieuweRegel('INGREDIENT')
  }

  function openSubReceptForm() {
    resetNieuweRegel()
    setNieuweSubReceptId(recepten[0]?.id ?? '')
    setToonNieuweRegel('RECEPT')
  }

  function verwijderRegel(clientId: string) {
    setRegels(prev => prev.filter(r => r.clientId !== clientId))
  }

  async function opslaan(e: React.FormEvent) {
    e.preventDefault()
    setBezig(true)
    try {
      const { data } = await axios.post('/api/recepten', {
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
      toast.success(`"${data.naam}" aangemaakt.`)
      navigate(`/recepten/${data.id}`)
    } catch (err: unknown) {
      const res = axios.isAxiosError(err) ? err.response?.data : null
      toast.error(res?.bericht ?? 'Aanmaken mislukt.')
    } finally {
      setBezig(false)
    }
  }

  return (
    <div className="flex flex-col gap-0">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-5">
        <Link to="/recepten" className="hover:text-amber-700 transition-colors">Recepten</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-800 font-medium">Nieuw recept</span>
      </nav>

      <h1 className="text-xl font-semibold text-slate-900 mb-6">Nieuw recept</h1>

      <form onSubmit={opslaan} className="flex flex-col gap-8 max-w-2xl">

        {/* Algemeen */}
        <Sectie titel="Algemeen">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label text="Naam" vereist />
              <input
                required value={naam} onChange={e => setNaam(e.target.value)}
                className={veld} placeholder="bv. Chocoladecake, Vanilleroom…"
              />
            </div>
            <div>
              <Label text="Houdbaarheid (optioneel)" />
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

        {/* Regels */}
        <Sectie titel="Ingrediënten & subrecepten">
          <div className="flex flex-col gap-2">
            {regels.length === 0 && toonNieuweRegel === null && (
              <p className="text-sm text-slate-400">Nog geen ingrediënten toegevoegd.</p>
            )}

            {regels.map(regel => (
              <div key={regel.clientId} className="flex items-center gap-3 py-2 px-3 bg-slate-50 border border-slate-200 rounded-md">
                <span className="text-xs text-slate-400 w-16 shrink-0">
                  {regel.type === 'INGREDIENT' ? 'Ingrediënt' : 'Subrecept'}
                </span>
                <span className="flex-1 text-sm font-medium text-slate-800">
                  {regel.type === 'INGREDIENT' ? regel.ingredientNaam : regel.subReceptNaam}
                </span>
                <span className="text-sm text-slate-600 w-32 text-right">
                  {regel.hoeveelheid} {regel.type === 'INGREDIENT' ? EENHEID_KORT[regel.eenheid] : 'batch(es)'}
                </span>
                <button type="button" onClick={() => verwijderRegel(regel.clientId)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            {/* Nieuw-ingredient-formulier */}
            {toonNieuweRegel === 'INGREDIENT' && (
              <div className="flex flex-col gap-2 p-3 border border-amber-200 bg-amber-50 rounded-md">
                <select
                  value={nieuweIngredientId}
                  onChange={e => {
                    const ing = ingredienten.find(i => i.id === e.target.value)
                    setNieuweIngredientId(e.target.value)
                    if (ing) setNieuweEenheid(ing.eenheid)
                  }}
                  className={veld}
                >
                  {ingredienten.map(i => <option key={i.id} value={i.id}>{i.naam}</option>)}
                </select>
                <div className="flex gap-2">
                  <input
                    type="number" min="0.001" step="any"
                    placeholder="hoeveelheid"
                    value={nieuweHoeveelheid}
                    onChange={e => setNieuweHoeveelheid(e.target.value)}
                    className={`${veld} w-36`}
                    autoFocus
                  />
                  <select value={nieuweEenheid} onChange={e => setNieuweEenheid(e.target.value as Eenheid)} className={veld}>
                    {EENHEID_OPTIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <button type="button" onClick={voegIngredientToe}
                    disabled={!nieuweIngredientId || !nieuweHoeveelheid}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium rounded-md transition-colors">
                    Toevoegen
                  </button>
                  <button type="button" onClick={resetNieuweRegel} className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm rounded-md transition-colors">
                    Annuleren
                  </button>
                </div>
              </div>
            )}

            {/* Nieuw-subrecept-formulier */}
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
                      <input
                        type="number" min="0.001" step="any"
                        placeholder="aantal batches"
                        value={nieuweHoeveelheid}
                        onChange={e => setNieuweHoeveelheid(e.target.value)}
                        className={`${veld} w-36`}
                        autoFocus
                      />
                      <span className="text-sm text-slate-500">batch(es)</span>
                      <button type="button" onClick={voegSubReceptToe}
                        disabled={!nieuweSubReceptId || !nieuweHoeveelheid}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium rounded-md transition-colors">
                        Toevoegen
                      </button>
                      <button type="button" onClick={resetNieuweRegel} className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm rounded-md transition-colors">
                        Annuleren
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {toonNieuweRegel === null && (
              <div className="flex gap-2 mt-1">
                <button type="button" onClick={openIngredientForm}
                  className="flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-800 font-medium">
                  <Plus className="h-4 w-4" /> Ingrediënt toevoegen
                </button>
                <span className="text-slate-300">|</span>
                <button type="button" onClick={openSubReceptForm}
                  disabled={recepten.length === 0}
                  className="flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-800 font-medium disabled:opacity-40 disabled:cursor-not-allowed">
                  <Plus className="h-4 w-4" /> Subrecept toevoegen
                </button>
              </div>
            )}
          </div>
        </Sectie>

        {/* Bereidingswijze */}
        <Sectie titel="Bereidingswijze">
          <RijkeEditor
            waarde={bereidingswijze}
            onChange={setBereidingswijze}
            placeholder="Beschrijf de bereiding stap voor stap. Gebruik koppen voor fasen (bv. 'Voorbereiding', 'Bakken'), genummerde lijsten voor stappen en opsommingen voor tips."
          />
        </Sectie>

        {/* Opmerkingen */}
        <Sectie titel="Opmerkingen">
          <RijkeEditor
            waarde={opmerkingen}
            onChange={setOpmerkingen}
            placeholder="Allergenen, tips, variaties, bewaarinstructies…"
          />
        </Sectie>

        <div className="flex gap-3 pt-2 border-t border-slate-100">
          <button type="submit" disabled={bezig}
            className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium rounded-md transition-colors">
            {bezig && <Loader2 className="h-4 w-4 animate-spin" />}
            {bezig ? 'Bezig…' : 'Recept aanmaken'}
          </button>
          <button type="button" onClick={() => navigate('/recepten')}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm rounded-md transition-colors">
            Annuleren
          </button>
        </div>
      </form>
    </div>
  )
}

function Sectie({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{titel}</h3>
      {children}
    </div>
  )
}

function Label({ text, vereist }: { text: string; vereist?: boolean }) {
  return (
    <label className="block text-xs font-medium text-slate-600 mb-1">
      {text}{vereist && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

const veld = 'w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white'
