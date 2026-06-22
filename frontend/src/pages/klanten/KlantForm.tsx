import { useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
import type { Allergeen } from '../../types/ingredient'
import type { Herkomst, VoorkeurContactwijze, KlantResponse } from '../../types/klant'

const ALLE_ALLERGENEN: Allergeen[] = [
  'GLUTEN', 'SCHAALDIEREN', 'EIEREN', 'VIS', 'PINDA', 'SOJA',
  'MELK', 'NOTEN', 'SELDERIJ', 'MOSTERD', 'SESAM', 'SULFIET', 'LUPINE', 'WEEKDIEREN'
]
const ALLERGEEN_LABELS: Record<Allergeen, string> = {
  GLUTEN: 'Gluten', SCHAALDIEREN: 'Schaaldieren', EIEREN: 'Eieren', VIS: 'Vis',
  PINDA: 'Pinda', SOJA: 'Soja', MELK: 'Melk', NOTEN: 'Noten',
  SELDERIJ: 'Selderij', MOSTERD: 'Mosterd', SESAM: 'Sesam',
  SULFIET: 'Sulfiet', LUPINE: 'Lupine', WEEKDIEREN: 'Weekdieren'
}
const HERKOMST_OPTIES: { value: Herkomst; label: string }[] = [
  { value: 'MOND_TOT_MOND', label: 'Mond tot mond' },
  { value: 'SOCIALE_MEDIA', label: 'Sociale media' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'EVENT', label: 'Event' },
  { value: 'ANDERE', label: 'Andere' },
]
const CONTACT_OPTIES: { value: VoorkeurContactwijze; label: string }[] = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'TELEFOON', label: 'Telefoon' },
  { value: 'SMS', label: 'SMS' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'MESSENGER', label: 'Messenger' },
  { value: 'INSTAGRAM', label: 'Instagram' },
]

interface FormData {
  voornaam: string
  familienaam: string
  email: string
  telefoon: string
  straat: string
  huisnummer: string
  gemeente: string
  postcode: string
  land: string
  herkomst: Herkomst | ''
  herkomstToelichting: string
  voorkeurContactwijze: VoorkeurContactwijze
  allergenen: Allergeen[]
  specialeEisen: string[]
}

const leegFormulier = (): FormData => ({
  voornaam: '', familienaam: '', email: '', telefoon: '',
  straat: '', huisnummer: '', gemeente: '', postcode: '', land: 'België',
  herkomst: '', herkomstToelichting: '',
  voorkeurContactwijze: 'EMAIL',
  allergenen: [], specialeEisen: []
})

function vanKlant(k: KlantResponse): FormData {
  return {
    voornaam: k.voornaam ?? '',
    familienaam: k.familienaam,
    email: k.email ?? '',
    telefoon: k.telefoon ?? '',
    straat: k.adres?.straat ?? '', huisnummer: k.adres?.huisnummer ?? '',
    gemeente: k.adres?.gemeente ?? '', postcode: k.adres?.postcode ?? '',
    land: k.adres?.land ?? 'België',
    herkomst: k.herkomst ?? '',
    herkomstToelichting: k.herkomstToelichting ?? '',
    voorkeurContactwijze: k.voorkeurContactwijze,
    allergenen: k.allergenen,
    specialeEisen: k.specialeEisen.map(e => e.omschrijving)
  }
}

interface Props {
  klant?: KlantResponse
  onOpgeslagen: () => void
  onAnnuleer: () => void
}

export function KlantForm({ klant, onOpgeslagen, onAnnuleer }: Props) {
  const [form, setForm] = useState<FormData>(klant ? vanKlant(klant) : leegFormulier())
  const [bezig, setBezig] = useState(false)

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function toggleAllergeen(a: Allergeen) {
    setForm(f => ({
      ...f,
      allergenen: f.allergenen.includes(a)
        ? f.allergenen.filter(x => x !== a)
        : [...f.allergenen, a]
    }))
  }

  function voegEisToe() { setForm(f => ({ ...f, specialeEisen: [...f.specialeEisen, ''] })) }
  function wijzigEis(i: number, v: string) {
    setForm(f => { const e = [...f.specialeEisen]; e[i] = v; return { ...f, specialeEisen: e } })
  }
  function verwijderEis(i: number) {
    setForm(f => ({ ...f, specialeEisen: f.specialeEisen.filter((_, j) => j !== i) }))
  }

  async function opslaan(e: React.FormEvent) {
    e.preventDefault()
    setBezig(true)
    try {
      const body = {
        voornaam: form.voornaam || null,
        familienaam: form.familienaam,
        email: form.email || null,
        telefoon: form.telefoon || null,
        adres: form.straat ? {
          straat: form.straat, huisnummer: form.huisnummer,
          gemeente: form.gemeente, postcode: form.postcode, land: form.land
        } : null,
        herkomst: form.herkomst || null,
        herkomstToelichting: form.herkomst === 'ANDERE' ? form.herkomstToelichting || null : null,
        voorkeurContactwijze: form.voorkeurContactwijze,
        allergenen: form.allergenen,
        specialeEisen: form.specialeEisen.filter(e => e.trim())
      }
      if (klant) {
        await axios.put(`/api/klanten/${klant.id}`, body)
        toast.success('Klant bijgewerkt.')
      } else {
        await axios.post('/api/klanten', body)
        toast.success('Klant aangemaakt.')
      }
      onOpgeslagen()
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.bericht : null
      toast.error(msg ?? 'Opslaan mislukt.')
    } finally {
      setBezig(false)
    }
  }

  return (
    <form onSubmit={opslaan} className="flex flex-col gap-5 text-sm">
      <Section titel="Naam">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Voornaam">
            <input value={form.voornaam} onChange={e => set('voornaam', e.target.value)} className={input} />
          </Field>
          <Field label="Familienaam" required>
            <input required value={form.familienaam} onChange={e => set('familienaam', e.target.value)} className={input} />
          </Field>
        </div>
      </Section>

      <Section titel="Contactgegevens">
        <Field label="Email">
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={input} />
        </Field>
        <Field label="Telefoon">
          <input value={form.telefoon} onChange={e => set('telefoon', e.target.value)} className={input} />
        </Field>
      </Section>

      <Section titel="Adres">
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <Field label="Straat">
              <input value={form.straat} onChange={e => set('straat', e.target.value)} className={input} />
            </Field>
          </div>
          <Field label="Nr.">
            <input value={form.huisnummer} onChange={e => set('huisnummer', e.target.value)} className={input} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Postcode">
            <input value={form.postcode} onChange={e => set('postcode', e.target.value)} className={input} />
          </Field>
          <Field label="Gemeente">
            <input value={form.gemeente} onChange={e => set('gemeente', e.target.value)} className={input} />
          </Field>
        </div>
      </Section>

      <Section titel="Voorkeur">
        <Field label="Herkomst">
          <select
            value={form.herkomst}
            onChange={e => set('herkomst', e.target.value as Herkomst | '')}
            className={input}
          >
            <option value="">— niet opgegeven —</option>
            {HERKOMST_OPTIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        {form.herkomst === 'ANDERE' && (
          <Field label="Toelichting herkomst">
            <input value={form.herkomstToelichting} onChange={e => set('herkomstToelichting', e.target.value)} className={input} />
          </Field>
        )}
        <Field label="Voorkeur contact" required>
          <select value={form.voorkeurContactwijze} onChange={e => set('voorkeurContactwijze', e.target.value as VoorkeurContactwijze)} className={input}>
            {CONTACT_OPTIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
      </Section>

      <Section titel="Allergieën">
        <div className="flex flex-wrap gap-2">
          {ALLE_ALLERGENEN.map(a => (
            <button
              key={a} type="button"
              onClick={() => toggleAllergeen(a)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                form.allergenen.includes(a)
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {ALLERGEEN_LABELS[a]}
            </button>
          ))}
        </div>
      </Section>

      <Section titel="Speciale eisen">
        <div className="flex flex-col gap-2">
          {form.specialeEisen.map((eis, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={eis}
                onChange={e => wijzigEis(i, e.target.value)}
                placeholder="bv. Geen varkensvlees"
                className={`${input} flex-1`}
              />
              <button type="button" onClick={() => verwijderEis(i)} className="p-2 text-slate-400 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={voegEisToe} className="flex items-center gap-1.5 text-amber-700 hover:text-amber-800 text-xs font-medium w-fit">
            <Plus className="h-3.5 w-3.5" /> Eis toevoegen
          </button>
        </div>
      </Section>

      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <button
          type="submit" disabled={bezig}
          className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-medium py-2 rounded-md transition-colors"
        >
          {bezig ? 'Bezig...' : klant ? 'Opslaan' : 'Aanmaken'}
        </button>
        <button type="button" onClick={onAnnuleer} className="px-4 py-2 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600">
          Annuleren
        </button>
      </div>
    </form>
  )
}

const input = 'w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white'

function Section({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{titel}</h3>
      {children}
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
