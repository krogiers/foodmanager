import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'sonner'
import { ChevronRight, Plus, X } from 'lucide-react'
import { AllergeenBadge } from '../../components/ui/AllergeenBadge'
import {
  EENHEID_OPTIES, EENHEID_KORT, ALLERGEEN_LABELS, AANWEZIGHEID_OPTIES, AANWEZIGHEID_LABELS,
  buildIngredientBody,
  type IngredientFormData, type VoedingswaardenFormData, type AllergeenRij,
} from './IngredientForm'
import type { IngredientResponse, Eenheid, Allergeen, AllergeenAanwezigheid } from '../../types/ingredient'

type Tab = 'gegevens'
const TABS: { id: Tab; label: string }[] = [{ id: 'gegevens', label: 'Gegevens' }]

const ALLE_ALLERGENEN: Allergeen[] = [
  'GLUTEN', 'SCHAALDIEREN', 'EIEREN', 'VIS', 'PINDA', 'SOJA',
  'MELK', 'NOTEN', 'SELDERIJ', 'MOSTERD', 'SESAM', 'SULFIET', 'LUPINE', 'WEEKDIEREN',
]

function vanIngredient(i: IngredientResponse): IngredientFormData {
  return {
    naam: i.naam,
    eenheid: i.eenheid,
    aankoopprijs: i.aankoopprijs != null ? String(i.aankoopprijs) : '',
    categorie: i.categorie ?? '',
    heeftVoedingswaarden: i.voedingswaarden != null,
    voedingswaarden: i.voedingswaarden
      ? {
          energie: String(i.voedingswaarden.energie),
          eiwitten: String(i.voedingswaarden.eiwitten),
          koolhydraten: String(i.voedingswaarden.koolhydraten),
          suikers: String(i.voedingswaarden.suikers),
          vetten: String(i.voedingswaarden.vetten),
          verzadigdVet: String(i.voedingswaarden.verzadigdVet),
          vezels: String(i.voedingswaarden.vezels),
          zout: String(i.voedingswaarden.zout),
        }
      : { energie: '', eiwitten: '', koolhydraten: '', suikers: '', vetten: '', verzadigdVet: '', vezels: '', zout: '' },
    allergenen: i.allergenen.map(a => ({ allergeen: a.allergeen, aanwezigheid: a.aanwezigheid })),
  }
}

export function IngredientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [ingredient, setIngredient] = useState<IngredientResponse | null>(null)
  const [laden, setLaden] = useState(true)
  const [tab, setTab] = useState<Tab>('gegevens')
  const [bewerkModus, setBewerkModus] = useState(false)
  const [form, setForm] = useState<IngredientFormData | null>(null)
  const [bezig, setBezig] = useState(false)

  async function laad() {
    try {
      const { data } = await axios.get(`/api/ingredienten/${id}`)
      setIngredient(data)
    } catch {
      toast.error('Ingrediënt niet gevonden.')
      navigate('/ingredienten')
    } finally {
      setLaden(false)
    }
  }

  useEffect(() => { laad() }, [id])

  function startBewerken() {
    setForm(vanIngredient(ingredient!))
    setTab('gegevens')
    setBewerkModus(true)
  }

  function annuleer() {
    setBewerkModus(false)
    setForm(null)
  }

  function setVeld<K extends keyof IngredientFormData>(key: K, value: IngredientFormData[K]) {
    setForm(f => f ? { ...f, [key]: value } : f)
  }

  function setVw(key: keyof VoedingswaardenFormData, value: string) {
    setForm(f => f ? { ...f, voedingswaarden: { ...f.voedingswaarden, [key]: value } } : f)
  }

  async function opslaan(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setBezig(true)
    try {
      const { data } = await axios.put(`/api/ingredienten/${id}`, buildIngredientBody(form))
      setIngredient(data)
      setBewerkModus(false)
      setForm(null)
      toast.success('Ingrediënt bijgewerkt.')
    } catch (err: unknown) {
      const res = axios.isAxiosError(err) ? err.response?.data : null
      toast.error(res?.bericht ?? res?.message ?? 'Opslaan mislukt.')
    } finally {
      setBezig(false)
    }
  }

  if (laden) return <Skeleton />
  if (!ingredient) return null

  const f = form ?? vanIngredient(ingredient)
  const letter = ingredient.naam[0]?.toUpperCase() ?? '?'

  return (
    <div className="flex flex-col gap-0">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-5">
        <Link to="/ingredienten" className="hover:text-amber-700 transition-colors">Ingrediënten</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-800 font-medium">{ingredient.naam}</span>
        {bewerkModus && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-slate-800 font-medium">Bewerken</span>
          </>
        )}
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-base font-semibold shrink-0">
            {letter}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{ingredient.naam}</h1>
            <p className="text-sm text-slate-500">{EENHEID_OPTIES.find(o => o.value === ingredient.eenheid)?.label}</p>
          </div>
        </div>
        {!bewerkModus && (
          <button
            onClick={startBewerken}
            className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-colors"
          >
            Bewerken
          </button>
        )}
      </div>

      {/* Tabs — alleen in weergavemodus */}
      {!bewerkModus && (
        <div className="border-b border-slate-200 mb-6">
          <div className="flex">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === t.id
                    ? 'border-amber-600 text-amber-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Inhoud */}
      <form onSubmit={opslaan} noValidate>
        <GegevensTabblad ingredient={ingredient} bewerk={bewerkModus} f={f} setVeld={setVeld} setVw={setVw} />
        {bewerkModus && (
          <div className="flex gap-3 pt-6 mt-6 border-t border-slate-200">
            <button
              type="submit" disabled={bezig}
              className="px-5 py-2 rounded-md bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
            >
              {bezig ? 'Bezig…' : 'Opslaan'}
            </button>
            <button
              type="button" onClick={annuleer}
              className="px-4 py-2 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm transition-colors"
            >
              Annuleren
            </button>
          </div>
        )}
      </form>
    </div>
  )
}

// ─── Gegevens tabblad ─────────────────────────────────────────────────────────

function GegevensTabblad({ ingredient, bewerk, f, setVeld, setVw }: {
  ingredient: IngredientResponse
  bewerk: boolean
  f: IngredientFormData
  setVeld: <K extends keyof IngredientFormData>(key: K, value: IngredientFormData[K]) => void
  setVw: (key: keyof VoedingswaardenFormData, value: string) => void
}) {
  const gebruikteAllergenen = new Set(f.allergenen.map(a => a.allergeen))

  function voegAllergeenToe() {
    const vrij = ALLE_ALLERGENEN.find(a => !gebruikteAllergenen.has(a))
    if (!vrij) return
    setVeld('allergenen', [...f.allergenen, { allergeen: vrij, aanwezigheid: 'BEVAT' }])
  }

  function wijzigAllergeen(i: number, allergeen: Allergeen) {
    const rijen = [...f.allergenen]
    rijen[i] = { ...rijen[i], allergeen }
    setVeld('allergenen', rijen)
  }

  function wijzigAanwezigheid(i: number, aanwezigheid: AllergeenAanwezigheid) {
    const rijen = [...f.allergenen]
    rijen[i] = { ...rijen[i], aanwezigheid }
    setVeld('allergenen', rijen)
  }

  function verwijderAllergeen(i: number) {
    setVeld('allergenen', f.allergenen.filter((_, j) => j !== i))
  }

  const kanNogToevoegen = f.allergenen.length < ALLE_ALLERGENEN.length
  const eenheidKort = EENHEID_KORT[ingredient.eenheid]

  return (
    <div className="flex flex-col gap-8">

      {/* Algemeen */}
      <Sectie titel="Algemeen">
        <div className="grid grid-cols-3 gap-4">
          <Veld label="Naam" bewerk={bewerk} weergave={ingredient.naam} vereist>
            <input required value={f.naam} onChange={e => setVeld('naam', e.target.value)} className={invoeerveld} />
          </Veld>
          <Veld label="Eenheid" bewerk={bewerk} weergave={EENHEID_OPTIES.find(o => o.value === ingredient.eenheid)?.label} vereist>
            <select value={f.eenheid} onChange={e => setVeld('eenheid', e.target.value as Eenheid)} className={invoeerveld}>
              {EENHEID_OPTIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Veld>
          <Veld
            label={`Aankoopprijs / ${eenheidKort}`}
            bewerk={bewerk}
            weergave={ingredient.aankoopprijs != null ? `€ ${Number(ingredient.aankoopprijs).toFixed(4)}` : undefined}
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
              <input
                type="number" min="0" step="0.0001"
                value={f.aankoopprijs}
                onChange={e => setVeld('aankoopprijs', e.target.value)}
                className={`${invoeerveld} pl-7`} placeholder="0.0000"
              />
            </div>
          </Veld>
          <Veld label="Categorie" bewerk={bewerk} weergave={ingredient.categorie ?? undefined}>
            <input
              value={f.categorie}
              onChange={e => setVeld('categorie', e.target.value)}
              className={invoeerveld}
              placeholder="bv. Bloem, Zuivel, Groenten…"
            />
          </Veld>
        </div>
      </Sectie>

      {/* Voedingswaarden */}
      <Sectie titel="Voedingswaarden per 100g/ml">
        {bewerk && (
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="checkbox" checked={f.heeftVoedingswaarden}
              onChange={e => setVeld('heeftVoedingswaarden', e.target.checked)}
              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-sm text-slate-600">Voedingswaarden invullen</span>
          </label>
        )}
        {(bewerk ? f.heeftVoedingswaarden : ingredient.voedingswaarden != null) ? (
          <div className="grid grid-cols-4 gap-4">
            {([
              ['energie', 'Energie (kcal)', ingredient.voedingswaarden?.energie],
              ['eiwitten', 'Eiwitten (g)', ingredient.voedingswaarden?.eiwitten],
              ['koolhydraten', 'Koolhydraten (g)', ingredient.voedingswaarden?.koolhydraten],
              ['suikers', '↳ Suikers (g)', ingredient.voedingswaarden?.suikers],
              ['vetten', 'Vetten (g)', ingredient.voedingswaarden?.vetten],
              ['verzadigdVet', '↳ Verzadigd (g)', ingredient.voedingswaarden?.verzadigdVet],
              ['vezels', 'Vezels (g)', ingredient.voedingswaarden?.vezels],
              ['zout', 'Zout (g)', ingredient.voedingswaarden?.zout],
            ] as [keyof VoedingswaardenFormData, string, number | undefined][]).map(([key, label, waarde]) => (
              <Veld key={key} label={label} bewerk={bewerk} weergave={waarde != null ? String(waarde) : undefined}>
                <input
                  type="number" min="0" step="0.01"
                  value={f.voedingswaarden[key]}
                  onChange={e => setVw(key, e.target.value)}
                  className={invoeerveld} placeholder="0"
                />
              </Veld>
            ))}
          </div>
        ) : (
          <span className="text-sm text-slate-400">Geen voedingswaarden ingevuld</span>
        )}
      </Sectie>

      {/* Allergenen */}
      <Sectie titel="Allergenen">
        {bewerk ? (
          <div className="flex flex-col gap-2">
            {f.allergenen.map((rij, i) => {
              const beschikbaar = ALLE_ALLERGENEN.filter(a => a === rij.allergeen || !gebruikteAllergenen.has(a))
              return (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    value={rij.allergeen}
                    onChange={e => wijzigAllergeen(i, e.target.value as Allergeen)}
                    className={`${invoeerveld} flex-1`}
                  >
                    {beschikbaar.map(a => <option key={a} value={a}>{ALLERGEEN_LABELS[a]}</option>)}
                  </select>
                  <select
                    value={rij.aanwezigheid}
                    onChange={e => wijzigAanwezigheid(i, e.target.value as AllergeenAanwezigheid)}
                    className={`${invoeerveld} w-44`}
                  >
                    {AANWEZIGHEID_OPTIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <button type="button" onClick={() => verwijderAllergeen(i)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
            {kanNogToevoegen && (
              <button type="button" onClick={voegAllergeenToe} className="flex items-center gap-1.5 text-amber-700 hover:text-amber-800 text-xs font-medium w-fit mt-1">
                <Plus className="h-3.5 w-3.5" /> Allergeen toevoegen
              </button>
            )}
            {f.allergenen.length === 0 && (
              <span className="text-sm text-slate-400">Nog geen allergenen toegevoegd</span>
            )}
          </div>
        ) : (
          ingredient.allergenen.filter(a => a.aanwezigheid !== 'VRIJ_VAN').length > 0 ? (
            <div className="flex flex-col gap-2">
              {ingredient.allergenen.map(a => (
                <div key={a.allergeen} className="flex items-center gap-2">
                  <AllergeenBadge allergeen={a.allergeen} />
                  <span className="text-xs text-slate-500">{AANWEZIGHEID_LABELS[a.aanwezigheid]}</span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-sm text-slate-400">Geen allergenen geregistreerd</span>
          )
        )}
      </Sectie>
    </div>
  )
}

// ─── Hulpcomponenten ──────────────────────────────────────────────────────────

function Sectie({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{titel}</h3>
      {children}
    </div>
  )
}

function Veld({ label, weergave, bewerk, vereist = false, children }: {
  label: string
  weergave: React.ReactNode
  bewerk: boolean
  vereist?: boolean
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-500">
        {label}{vereist && bewerk && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {bewerk && children
        ? children
        : weergave
          ? <span className="text-sm text-slate-800">{weergave}</span>
          : <span className="text-sm text-slate-400">—</span>
      }
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
      <div className="h-8 w-48 bg-slate-100 rounded" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded" />)}
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded" />)}
      </div>
    </div>
  )
}

const invoeerveld = 'w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white'
