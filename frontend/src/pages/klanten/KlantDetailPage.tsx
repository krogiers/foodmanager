import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'sonner'
import { ChevronRight, User, Plus, X } from 'lucide-react'
import { AllergeenBadge } from '../../components/ui/AllergeenBadge'
import type { KlantResponse, Herkomst, VoorkeurContactwijze } from '../../types/klant'
import type { Allergeen } from '../../types/ingredient'

// ─── Constanten ───────────────────────────────────────────────────────────────

const ALLE_ALLERGENEN: Allergeen[] = [
  'GLUTEN', 'SCHAALDIEREN', 'EIEREN', 'VIS', 'PINDA', 'SOJA',
  'MELK', 'NOTEN', 'SELDERIJ', 'MOSTERD', 'SESAM', 'SULFIET', 'LUPINE', 'WEEKDIEREN',
]
const ALLERGEEN_LABELS: Record<Allergeen, string> = {
  GLUTEN: 'Gluten', SCHAALDIEREN: 'Schaaldieren', EIEREN: 'Eieren', VIS: 'Vis',
  PINDA: 'Pinda', SOJA: 'Soja', MELK: 'Melk', NOTEN: 'Noten',
  SELDERIJ: 'Selderij', MOSTERD: 'Mosterd', SESAM: 'Sesam',
  SULFIET: 'Sulfiet', LUPINE: 'Lupine', WEEKDIEREN: 'Weekdieren',
}
const HERKOMST_OPTIES: { value: Herkomst | ''; label: string }[] = [
  { value: '', label: '— niet opgegeven —' },
  { value: 'MOND_TOT_MOND', label: 'Mond tot mond' },
  { value: 'SOCIALE_MEDIA', label: 'Sociale media' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'EVENT', label: 'Event' },
  { value: 'ANDERE', label: 'Andere' },
]
const HERKOMST_LABELS: Record<string, string> = {
  MOND_TOT_MOND: 'Mond tot mond', SOCIALE_MEDIA: 'Sociale media',
  WEBSITE: 'Website', EVENT: 'Event', ANDERE: 'Andere',
}
const CONTACT_OPTIES: { value: VoorkeurContactwijze; label: string }[] = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'TELEFOON', label: 'Telefoon' },
  { value: 'SMS', label: 'SMS' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'MESSENGER', label: 'Messenger' },
  { value: 'INSTAGRAM', label: 'Instagram' },
]
const CONTACT_LABELS: Record<string, string> = {
  EMAIL: 'Email', TELEFOON: 'Telefoon', SMS: 'SMS',
  WHATSAPP: 'WhatsApp', FACEBOOK: 'Facebook', MESSENGER: 'Messenger', INSTAGRAM: 'Instagram',
}

// ─── Form types ───────────────────────────────────────────────────────────────

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

function vanKlant(k: KlantResponse): FormData {
  return {
    voornaam: k.voornaam ?? '',
    familienaam: k.familienaam ?? '',
    email: k.email ?? '',
    telefoon: k.telefoon ?? '',
    straat: k.adres?.straat ?? '',
    huisnummer: k.adres?.huisnummer ?? '',
    gemeente: k.adres?.gemeente ?? '',
    postcode: k.adres?.postcode ?? '',
    land: k.adres?.land ?? 'België',
    herkomst: k.herkomst ?? '',
    herkomstToelichting: k.herkomstToelichting ?? '',
    voorkeurContactwijze: k.voorkeurContactwijze ?? 'EMAIL',
    allergenen: k.allergenen ?? [],
    specialeEisen: (k.specialeEisen ?? []).map(e => e.omschrijving),
  }
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'gegevens' | 'reservaties' | 'historiek'
const TABS: { id: Tab; label: string }[] = [
  { id: 'gegevens', label: 'Gegevens' },
  { id: 'reservaties', label: 'Reservaties' },
  { id: 'historiek', label: 'Historiek' },
]

// ─── Hoofdcomponent ───────────────────────────────────────────────────────────

export function KlantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [klant, setKlant] = useState<KlantResponse | null>(null)
  const [laden, setLaden] = useState(true)
  const [tab, setTab] = useState<Tab>('gegevens')
  const [bewerkModus, setBewerkModus] = useState(false)
  const [form, setForm] = useState<FormData | null>(null)
  const [bezig, setBezig] = useState(false)

  async function laad() {
    try {
      const { data } = await axios.get(`/api/klanten/${id}`)
      setKlant(data)
    } catch {
      toast.error('Klant niet gevonden.')
      navigate('/klanten')
    } finally {
      setLaden(false)
    }
  }

  useEffect(() => { laad() }, [id])

  function startBewerken() {
    setForm(vanKlant(klant!))
    setTab('gegevens')
    setBewerkModus(true)
  }

  function annuleer() {
    setBewerkModus(false)
    setForm(null)
  }

  function setVeld<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(f => f ? { ...f, [key]: value } : f)
  }

  async function opslaan(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setBezig(true)
    try {
      const body = {
        voornaam: form.voornaam || null,
        familienaam: form.familienaam,
        email: form.email || null,
        telefoon: form.telefoon || null,
        adres: form.straat ? {
          straat: form.straat, huisnummer: form.huisnummer,
          gemeente: form.gemeente, postcode: form.postcode, land: form.land,
        } : null,
        herkomst: form.herkomst || null,
        herkomstToelichting: form.herkomst === 'ANDERE' ? form.herkomstToelichting || null : null,
        voorkeurContactwijze: form.voorkeurContactwijze,
        allergenen: form.allergenen,
        specialeEisen: form.specialeEisen.filter(e => e.trim()),
      }
      const { data } = await axios.put(`/api/klanten/${id}`, body)
      setKlant(data)
      setBewerkModus(false)
      setForm(null)
      toast.success('Klant bijgewerkt.')
    } catch (err: unknown) {
      const res = axios.isAxiosError(err) ? err.response?.data : null
      const msg = res?.bericht ?? res?.message ?? res?.detail ?? null
      toast.error(msg ?? 'Opslaan mislukt. Controleer alle velden.')
    } finally {
      setBezig(false)
    }
  }

  if (laden) return <KlantDetailSkeleton />
  if (!klant) return null

  const initialen = [klant.voornaam?.[0], klant.familienaam?.[0]]
    .filter(Boolean).join('').toUpperCase()

  return (
    <div className="flex flex-col gap-0">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-5">
        <Link to="/klanten" className="hover:text-amber-700 transition-colors">Klanten</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-800 font-medium">{klant.volledigNaam}</span>
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
            {initialen || <User className="h-5 w-5" />}
          </div>
          <h1 className="text-xl font-semibold text-slate-900">{klant.volledigNaam}</h1>
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
      {(tab === 'gegevens' || bewerkModus) && (
        <form onSubmit={opslaan} noValidate>
          <GegevensTabblad
            klant={klant}
            bewerk={bewerkModus}
            form={form}
            setVeld={setVeld}
          />
          {bewerkModus && (
            <div className="flex gap-3 pt-6 mt-6 border-t border-slate-200">
              <button
                type="submit"
                disabled={bezig}
                className="px-5 py-2 rounded-md bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
              >
                {bezig ? 'Bezig…' : 'Opslaan'}
              </button>
              <button
                type="button"
                onClick={annuleer}
                className="px-4 py-2 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm transition-colors"
              >
                Annuleren
              </button>
            </div>
          )}
        </form>
      )}
      {tab === 'reservaties' && !bewerkModus && (
        <TabPlaceholder label="Reservaties" omschrijving="Openstaande en bevestigde bestellingen van deze klant." />
      )}
      {tab === 'historiek' && !bewerkModus && (
        <TabPlaceholder label="Historiek" omschrijving="Afgehandelde bestellingen en alles wat deze klant eerder kocht." />
      )}
    </div>
  )
}

// ─── Gegevens tabblad (unified view/edit) ─────────────────────────────────────

function GegevensTabblad({ klant, bewerk, form, setVeld }: {
  klant: KlantResponse
  bewerk: boolean
  form: FormData | null
  setVeld: <K extends keyof FormData>(key: K, value: FormData[K]) => void
}) {
  const f = form ?? vanKlant(klant)

  function toggleAllergeen(a: Allergeen) {
    setVeld('allergenen', f.allergenen.includes(a)
      ? f.allergenen.filter(x => x !== a)
      : [...f.allergenen, a]
    )
  }

  function voegEisToe() {
    setVeld('specialeEisen', [...f.specialeEisen, ''])
  }

  function wijzigEis(i: number, v: string) {
    const eisen = [...f.specialeEisen]
    eisen[i] = v
    setVeld('specialeEisen', eisen)
  }

  function verwijderEis(i: number) {
    setVeld('specialeEisen', f.specialeEisen.filter((_, j) => j !== i))
  }

  const allergenenWeergave = bewerk ? f.allergenen : klant.allergenen
  const eisenWeergave = bewerk ? f.specialeEisen : klant.specialeEisen.map(e => e.omschrijving)

  return (
    <div className="flex flex-col gap-8">

      {/* Naam */}
      <Sectie titel="Naam">
        <div className="grid grid-cols-2 gap-4">
          <Veld label="Voornaam" bewerk={bewerk} weergave={klant.voornaam}>
            <input value={f.voornaam} onChange={e => setVeld('voornaam', e.target.value)} className={invoeerveld} />
          </Veld>
          <Veld label="Familienaam" bewerk={bewerk} weergave={klant.familienaam} vereist>
            <input required value={f.familienaam} onChange={e => setVeld('familienaam', e.target.value)} className={invoeerveld} />
          </Veld>
        </div>
      </Sectie>

      {/* Contactgegevens */}
      <Sectie titel="Contactgegevens">
        <div className="grid grid-cols-2 gap-4">
          <Veld
            label="Email" bewerk={bewerk}
            weergave={klant.email
              ? <a href={`mailto:${klant.email}`} className="hover:text-amber-700 underline">{klant.email}</a>
              : undefined
            }
          >
            <input type="email" value={f.email} onChange={e => setVeld('email', e.target.value)} className={invoeerveld} />
          </Veld>
          <Veld label="Telefoon" bewerk={bewerk} weergave={klant.telefoon}>
            <input value={f.telefoon} onChange={e => setVeld('telefoon', e.target.value)} className={invoeerveld} />
          </Veld>
        </div>
      </Sectie>

      {/* Adres */}
      <Sectie titel="Adres">
        {bewerk ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Veld label="Straat" bewerk weergave={undefined}>
                  <input value={f.straat} onChange={e => setVeld('straat', e.target.value)} className={invoeerveld} />
                </Veld>
              </div>
              <Veld label="Nr." bewerk weergave={undefined}>
                <input value={f.huisnummer} onChange={e => setVeld('huisnummer', e.target.value)} className={invoeerveld} />
              </Veld>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Veld label="Postcode" bewerk weergave={undefined}>
                <input value={f.postcode} onChange={e => setVeld('postcode', e.target.value)} className={invoeerveld} />
              </Veld>
              <Veld label="Gemeente" bewerk weergave={undefined}>
                <input value={f.gemeente} onChange={e => setVeld('gemeente', e.target.value)} className={invoeerveld} />
              </Veld>
            </div>
          </div>
        ) : klant.adres ? (
          <span className="text-sm text-slate-800">
            {klant.adres.straat} {klant.adres.huisnummer}<br />
            {klant.adres.postcode} {klant.adres.gemeente}<br />
            {klant.adres.land}
          </span>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        )}
      </Sectie>

      {/* Voorkeur & herkomst */}
      <Sectie titel="Voorkeur & herkomst">
        <div className="grid grid-cols-2 gap-4">
          <Veld
            label="Voorkeur contact" bewerk={bewerk}
            weergave={CONTACT_LABELS[klant.voorkeurContactwijze] ?? klant.voorkeurContactwijze}
          >
            <select
              value={f.voorkeurContactwijze}
              onChange={e => setVeld('voorkeurContactwijze', e.target.value as VoorkeurContactwijze)}
              className={invoeerveld}
            >
              {CONTACT_OPTIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Veld>
          <Veld
            label="Herkomst" bewerk={bewerk}
            weergave={klant.herkomst ? (HERKOMST_LABELS[klant.herkomst] ?? klant.herkomst) : undefined}
          >
            <select
              value={f.herkomst}
              onChange={e => setVeld('herkomst', e.target.value as Herkomst | '')}
              className={invoeerveld}
            >
              {HERKOMST_OPTIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Veld>
          {((bewerk && f.herkomst === 'ANDERE') || (!bewerk && klant.herkomst === 'ANDERE')) && (
            <div className="col-span-2">
              <Veld label="Toelichting herkomst" bewerk={bewerk} weergave={klant.herkomstToelichting}>
                <input
                  value={f.herkomstToelichting}
                  onChange={e => setVeld('herkomstToelichting', e.target.value)}
                  className={invoeerveld}
                />
              </Veld>
            </div>
          )}
        </div>
      </Sectie>

      {/* Allergieën */}
      <Sectie titel="Allergieën">
        {bewerk ? (
          <div className="flex flex-wrap gap-2">
            {ALLE_ALLERGENEN.map(a => (
              <button
                key={a} type="button"
                onClick={() => toggleAllergeen(a)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  f.allergenen.includes(a)
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                {ALLERGEEN_LABELS[a]}
              </button>
            ))}
          </div>
        ) : (
          allergenenWeergave.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {allergenenWeergave.map(a => <AllergeenBadge key={a} allergeen={a} />)}
            </div>
          ) : (
            <span className="text-sm text-slate-400">Geen allergieën geregistreerd</span>
          )
        )}
      </Sectie>

      {/* Speciale eisen */}
      <Sectie titel="Speciale eisen">
        {bewerk ? (
          <div className="flex flex-col gap-2">
            {f.specialeEisen.map((eis, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={eis}
                  onChange={e => wijzigEis(i, e.target.value)}
                  placeholder="bv. Geen varkensvlees"
                  className={`${invoeerveld} flex-1`}
                />
                <button type="button" onClick={() => verwijderEis(i)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button" onClick={voegEisToe}
              className="flex items-center gap-1.5 text-amber-700 hover:text-amber-800 text-xs font-medium w-fit mt-1"
            >
              <Plus className="h-3.5 w-3.5" /> Eis toevoegen
            </button>
          </div>
        ) : (
          eisenWeergave.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {eisenWeergave.map((eis, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                  {eis}
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-sm text-slate-400">Geen speciale eisen geregistreerd</span>
          )
        )}
      </Sectie>

      {klant.isGeanonimiseerd && (
        <div className="rounded-md bg-slate-100 border border-slate-200 px-4 py-3 text-slate-500 text-sm">
          Deze klant is geanonimiseerd. Persoonsgegevens werden verwijderd.
        </div>
      )}
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

function TabPlaceholder({ label, omschrijving }: { label: string; omschrijving: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
      <p className="text-slate-700 font-medium">{label}</p>
      <p className="text-slate-400 text-sm max-w-sm">{omschrijving}</p>
      <p className="text-slate-300 text-xs mt-1">Beschikbaar zodra de reservatiemodule is ingebouwd.</p>
    </div>
  )
}

function KlantDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-4 w-48 bg-slate-100 rounded" />
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-slate-100" />
        <div className="h-5 w-40 bg-slate-100 rounded" />
      </div>
      <div className="h-8 w-64 bg-slate-100 rounded" />
      <div className="grid grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded" />)}
      </div>
    </div>
  )
}

const invoeerveld = 'w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white'
