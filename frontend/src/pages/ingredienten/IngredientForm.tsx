import { useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { Plus, X, Search, Loader2, CheckCircle2 } from 'lucide-react'
import type { Eenheid, Allergeen, AllergeenAanwezigheid } from '../../types/ingredient'

export const EENHEID_OPTIES: { value: Eenheid; label: string }[] = [
  { value: 'G', label: 'gram (g)' },
  { value: 'KG', label: 'kilogram (kg)' },
  { value: 'ML', label: 'milliliter (ml)' },
  { value: 'L', label: 'liter (l)' },
  { value: 'ST', label: 'stuk (st)' },
]
export const EENHEID_KORT: Record<Eenheid, string> = { G: 'g', KG: 'kg', ML: 'ml', L: 'l', ST: 'st' }

const ALLE_ALLERGENEN: Allergeen[] = [
  'GLUTEN', 'SCHAALDIEREN', 'EIEREN', 'VIS', 'PINDA', 'SOJA',
  'MELK', 'NOTEN', 'SELDERIJ', 'MOSTERD', 'SESAM', 'SULFIET', 'LUPINE', 'WEEKDIEREN',
]
export const ALLERGEEN_LABELS: Record<Allergeen, string> = {
  GLUTEN: 'Gluten', SCHAALDIEREN: 'Schaaldieren', EIEREN: 'Eieren', VIS: 'Vis',
  PINDA: 'Pinda', SOJA: 'Soja', MELK: 'Melk', NOTEN: 'Noten',
  SELDERIJ: 'Selderij', MOSTERD: 'Mosterd', SESAM: 'Sesam',
  SULFIET: 'Sulfiet', LUPINE: 'Lupine', WEEKDIEREN: 'Weekdieren',
}
export const AANWEZIGHEID_OPTIES: { value: AllergeenAanwezigheid; label: string }[] = [
  { value: 'BEVAT', label: 'Bevat' },
  { value: 'KAN_BEVATTEN', label: 'Kan bevatten' },
  { value: 'VRIJ_VAN', label: 'Vrij van' },
]
export const AANWEZIGHEID_LABELS: Record<AllergeenAanwezigheid, string> = {
  BEVAT: 'Bevat', KAN_BEVATTEN: 'Kan bevatten', VRIJ_VAN: 'Vrij van',
}

export interface VoedingswaardenFormData {
  energie: string
  eiwitten: string
  koolhydraten: string
  suikers: string
  vetten: string
  verzadigdVet: string
  vezels: string
  zout: string
}

export interface AllergeenRij {
  allergeen: Allergeen
  aanwezigheid: AllergeenAanwezigheid
}

export interface IngredientFormData {
  naam: string
  eenheid: Eenheid
  aankoopprijs: string
  heeftVoedingswaarden: boolean
  voedingswaarden: VoedingswaardenFormData
  allergenen: AllergeenRij[]
}

export function leegIngredientFormulier(): IngredientFormData {
  return {
    naam: '',
    eenheid: 'G',
    aankoopprijs: '',
    heeftVoedingswaarden: false,
    voedingswaarden: { energie: '', eiwitten: '', koolhydraten: '', suikers: '', vetten: '', verzadigdVet: '', vezels: '', zout: '' },
    allergenen: [],
  }
}

export function buildIngredientBody(form: IngredientFormData) {
  return {
    naam: form.naam,
    eenheid: form.eenheid,
    aankoopprijs: form.aankoopprijs !== '' ? parseFloat(form.aankoopprijs) : null,
    voedingswaarden: form.heeftVoedingswaarden ? {
      energie: parseFloat(form.voedingswaarden.energie) || 0,
      eiwitten: parseFloat(form.voedingswaarden.eiwitten) || 0,
      koolhydraten: parseFloat(form.voedingswaarden.koolhydraten) || 0,
      suikers: parseFloat(form.voedingswaarden.suikers) || 0,
      vetten: parseFloat(form.voedingswaarden.vetten) || 0,
      verzadigdVet: parseFloat(form.voedingswaarden.verzadigdVet) || 0,
      vezels: parseFloat(form.voedingswaarden.vezels) || 0,
      zout: parseFloat(form.voedingswaarden.zout) || 0,
    } : null,
    allergenen: form.allergenen,
  }
}

interface Props {
  onOpgeslagen: (opgeslagen: import('../../types/ingredient').IngredientResponse) => void
  onAnnuleer: () => void
}

export function IngredientForm({ onOpgeslagen, onAnnuleer }: Props) {
  const [form, setForm] = useState<IngredientFormData>(leegIngredientFormulier())
  const [bezig, setBezig] = useState(false)

  function set<K extends keyof IngredientFormData>(key: K, value: IngredientFormData[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function setVw(key: keyof VoedingswaardenFormData, value: string) {
    setForm(f => ({ ...f, voedingswaarden: { ...f.voedingswaarden, [key]: value } }))
  }

  function vulVoedingswaardenIn(vw: VoedingswaardenFormData) {
    setForm(f => ({ ...f, heeftVoedingswaarden: true, voedingswaarden: vw }))
  }

  function voegAllergeenToe() {
    const gebruikt = new Set(form.allergenen.map(a => a.allergeen))
    const vrij = ALLE_ALLERGENEN.find(a => !gebruikt.has(a))
    if (!vrij) return
    set('allergenen', [...form.allergenen, { allergeen: vrij, aanwezigheid: 'BEVAT' }])
  }

  function wijzigAllergeen(i: number, allergeen: Allergeen) {
    const rijen = [...form.allergenen]
    rijen[i] = { ...rijen[i], allergeen }
    set('allergenen', rijen)
  }

  function wijzigAanwezigheid(i: number, aanwezigheid: AllergeenAanwezigheid) {
    const rijen = [...form.allergenen]
    rijen[i] = { ...rijen[i], aanwezigheid }
    set('allergenen', rijen)
  }

  function verwijderAllergeen(i: number) {
    set('allergenen', form.allergenen.filter((_, j) => j !== i))
  }

  async function opslaan(e: React.FormEvent) {
    e.preventDefault()
    setBezig(true)
    try {
      const { data } = await axios.post('/api/ingredienten', buildIngredientBody(form))
      toast.success(`"${data.naam}" aangemaakt.`)
      onOpgeslagen(data)
    } catch (err: unknown) {
      const res = axios.isAxiosError(err) ? err.response?.data : null
      toast.error(res?.bericht ?? res?.message ?? 'Aanmaken mislukt.')
    } finally {
      setBezig(false)
    }
  }

  const gebruikteAllergenen = new Set(form.allergenen.map(a => a.allergeen))
  const kanNogToevoegen = form.allergenen.length < ALLE_ALLERGENEN.length

  return (
    <form onSubmit={opslaan} className="flex flex-col gap-6 text-sm">

      {/* Naam + Eenheid */}
      <Sectie titel="Algemeen">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label text="Naam" vereist />
            <input required value={form.naam} onChange={e => set('naam', e.target.value)} className={veld} placeholder="bv. Tarwebloem" />
          </div>
          <div>
            <Label text="Eenheid" vereist />
            <select required value={form.eenheid} onChange={e => set('eenheid', e.target.value as Eenheid)} className={veld}>
              {EENHEID_OPTIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <Label text={`Aankoopprijs / ${EENHEID_KORT[form.eenheid]}`} />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">€</span>
              <input
                type="number" min="0" step="0.0001" value={form.aankoopprijs}
                onChange={e => set('aankoopprijs', e.target.value)}
                className={`${veld} pl-7`} placeholder="0.0000"
              />
            </div>
          </div>
        </div>
      </Sectie>

      {/* Voedingswaarden */}
      <Sectie titel="Voedingswaarden per 100g/ml">
        <VoedingswaardenSectie
          heeftVoedingswaarden={form.heeftVoedingswaarden}
          voedingswaarden={form.voedingswaarden}
          onToggle={checked => set('heeftVoedingswaarden', checked)}
          onWijzig={setVw}
          onVulIn={vulVoedingswaardenIn}
        />
      </Sectie>

      {/* Allergenen */}
      <Sectie titel="Allergenen">
        <div className="flex flex-col gap-2">
          {form.allergenen.map((rij, i) => {
            const beschikbaar = ALLE_ALLERGENEN.filter(a => a === rij.allergeen || !gebruikteAllergenen.has(a))
            return (
              <div key={i} className="flex gap-2 items-center">
                <select
                  value={rij.allergeen}
                  onChange={e => wijzigAllergeen(i, e.target.value as Allergeen)}
                  className={`${veld} flex-1`}
                >
                  {beschikbaar.map(a => <option key={a} value={a}>{ALLERGEEN_LABELS[a]}</option>)}
                </select>
                <select
                  value={rij.aanwezigheid}
                  onChange={e => wijzigAanwezigheid(i, e.target.value as AllergeenAanwezigheid)}
                  className={`${veld} w-40`}
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
        </div>
      </Sectie>

      {/* Knoppen */}
      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <button type="submit" disabled={bezig} className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-medium py-2 rounded-md transition-colors">
          {bezig ? 'Bezig…' : 'Aanmaken'}
        </button>
        <button type="button" onClick={onAnnuleer} className="px-4 py-2 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600">
          Annuleren
        </button>
      </div>
    </form>
  )
}

// ─── Voedingswaarden sectie met zoekfunctie ──────────────────────────────────

interface ZoekResultaat {
  externeId: string
  naam: string
  merk?: string
  heeftVoedingswaarden: boolean
}

export function VoedingswaardenSectie({
  heeftVoedingswaarden, voedingswaarden, onToggle, onWijzig, onVulIn
}: {
  heeftVoedingswaarden: boolean
  voedingswaarden: VoedingswaardenFormData
  onToggle: (v: boolean) => void
  onWijzig: (key: keyof VoedingswaardenFormData, value: string) => void
  onVulIn: (vw: VoedingswaardenFormData) => void
}) {
  const [zoekOpen, setZoekOpen] = useState(false)
  const [zoekterm, setZoekterm] = useState('')
  const [zoekend, setZoekend] = useState(false)
  const [resultaten, setResultaten] = useState<ZoekResultaat[]>([])
  const [geladen, setGeladen] = useState<string | null>(null)

  async function zoek() {
    if (!zoekterm.trim()) return
    setZoekend(true)
    setResultaten([])
    try {
      const { data } = await axios.get(`/api/ingredienten/nutrition/zoek?query=${encodeURIComponent(zoekterm)}&paginaGrootte=15`)
      setResultaten(data.resultaten)
      if (data.totaalAantal === 0) toast.info('Geen resultaten gevonden.')
    } catch {
      toast.error('Zoeken mislukt.')
    } finally {
      setZoekend(false)
    }
  }

  async function selecteer(resultaat: ZoekResultaat) {
    try {
      const { data } = await axios.get(`/api/ingredienten/nutrition/detail?externeId=${encodeURIComponent(resultaat.externeId)}`)
      if (!data.voedingswaarden) {
        toast.warning(`"${resultaat.naam}" heeft geen voedingswaarden in de databank.`)
        return
      }
      const vw = data.voedingswaarden
      onVulIn({
        energie: String(vw.energie),
        eiwitten: String(vw.eiwitten),
        koolhydraten: String(vw.koolhydraten),
        suikers: String(vw.suikers),
        vetten: String(vw.vetten),
        verzadigdVet: String(vw.verzadigdVet),
        vezels: String(vw.vezels),
        zout: String(vw.zout),
      })
      setGeladen(resultaat.naam)
      setZoekOpen(false)
      setResultaten([])
      setZoekterm('')
    } catch {
      toast.error('Ophalen van voedingswaarden mislukt.')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox" checked={heeftVoedingswaarden}
            onChange={e => { onToggle(e.target.checked); if (!e.target.checked) { setGeladen(null); setZoekOpen(false) } }}
            className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
          />
          <span className="text-slate-600">Voedingswaarden invullen</span>
        </label>
        {heeftVoedingswaarden && (
          <button
            type="button"
            onClick={() => { setZoekOpen(o => !o); setResultaten([]); setZoekterm('') }}
            className="flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-800 font-medium transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            {zoekOpen ? 'Sluiten' : 'Opzoeken in databank'}
          </button>
        )}
      </div>

      {/* Inline zoekpanel */}
      {heeftVoedingswaarden && zoekOpen && (
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              autoFocus
              value={zoekterm} onChange={e => setZoekterm(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); zoek() } }}
              placeholder="bv. appel zonder schil, halfvolle melk…"
              className="flex-1 border border-slate-200 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button type="button" onClick={zoek} disabled={zoekend || !zoekterm.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-xs font-medium rounded-md transition-colors">
              {zoekend ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              Zoeken
            </button>
          </div>

          {zoekend && (
            <div className="flex flex-col gap-1">
              {[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-amber-100 rounded animate-pulse" />)}
            </div>
          )}

          {resultaten.length > 0 && (
            <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
              {resultaten.map(r => (
                <button key={r.externeId} type="button" onClick={() => selecteer(r)}
                  className="flex items-center justify-between px-3 py-2 text-left bg-white border border-transparent hover:border-amber-300 hover:bg-white rounded-md transition-colors group">
                  <span className="text-sm text-slate-700">{r.naam}</span>
                  {r.heeftVoedingswaarden
                    ? <span className="text-xs text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">Overnemen →</span>
                    : <span className="text-xs text-slate-400">geen waarden</span>
                  }
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bevestiging dat waarden geladen zijn */}
      {geladen && !zoekOpen && (
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          Voedingswaarden overgenomen van <strong>{geladen}</strong> — controleer en pas aan waar nodig.
          <button type="button" onClick={() => setGeladen(null)} className="ml-auto text-slate-400 hover:text-slate-600">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {heeftVoedingswaarden && (
        <div className="grid grid-cols-4 gap-3">
          {([
            ['energie', 'Energie (kcal)'],
            ['eiwitten', 'Eiwitten (g)'],
            ['koolhydraten', 'Koolhydraten (g)'],
            ['suikers', '↳ waarvan suikers (g)'],
            ['vetten', 'Vetten (g)'],
            ['verzadigdVet', '↳ waarvan verzadigd (g)'],
            ['vezels', 'Vezels (g)'],
            ['zout', 'Zout (g)'],
          ] as [keyof VoedingswaardenFormData, string][]).map(([key, label]) => (
            <div key={key}>
              <Label text={label} />
              <input
                type="number" min="0" step="0.01"
                value={voedingswaarden[key]}
                onChange={e => onWijzig(key, e.target.value)}
                className={veld} placeholder="0"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Hulpcomponenten ─────────────────────────────────────────────────────────

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
