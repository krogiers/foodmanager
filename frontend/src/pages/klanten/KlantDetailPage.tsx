import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'sonner'
import { ChevronRight, Pencil, MapPin, Phone, Mail, User } from 'lucide-react'
import { AllergeenBadge } from '../../components/ui/AllergeenBadge'
import { SlideOver } from '../../components/ui/SlideOver'
import { KlantForm } from './KlantForm'
import type { KlantResponse } from '../../types/klant'

const HERKOMST_LABELS: Record<string, string> = {
  MOND_TOT_MOND: 'Mond tot mond', SOCIALE_MEDIA: 'Sociale media',
  WEBSITE: 'Website', EVENT: 'Event', ANDERE: 'Andere'
}
const CONTACT_LABELS: Record<string, string> = {
  EMAIL: 'Email', TELEFOON: 'Telefoon', SMS: 'SMS',
  WHATSAPP: 'WhatsApp', FACEBOOK: 'Facebook', MESSENGER: 'Messenger', INSTAGRAM: 'Instagram'
}

type Tab = 'gegevens' | 'reservaties' | 'historiek'

const TABS: { id: Tab; label: string }[] = [
  { id: 'gegevens', label: 'Gegevens' },
  { id: 'reservaties', label: 'Reservaties' },
  { id: 'historiek', label: 'Historiek' },
]

export function KlantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [klant, setKlant] = useState<KlantResponse | null>(null)
  const [laden, setLaden] = useState(true)
  const [tab, setTab] = useState<Tab>('gegevens')
  const [bewerkOpen, setBewerkOpen] = useState(false)

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

  if (laden) return <KlantDetailSkeleton />
  if (!klant) return null

  const initialen = [klant.voornaam?.[0], klant.familienaam[0]]
    .filter(Boolean).join('').toUpperCase()

  return (
    <div className="flex flex-col gap-0">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-5">
        <Link to="/klanten" className="hover:text-amber-700 transition-colors">Klanten</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-800 font-medium">{klant.volledigNaam}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-base font-semibold shrink-0">
            {initialen || <User className="h-5 w-5" />}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{klant.volledigNaam}</h1>
            {klant.email && (
              <a href={`mailto:${klant.email}`} className="text-sm text-slate-500 hover:text-amber-700">
                {klant.email}
              </a>
            )}
          </div>
        </div>
        <button
          onClick={() => setBewerkOpen(true)}
          className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" /> Bewerken
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <div className="flex gap-0">
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

      {/* Tab content */}
      {tab === 'gegevens' && <TabGegevens klant={klant} />}
      {tab === 'reservaties' && <TabPlaceholder label="Reservaties" omschrijving="Openstaande en bevestigde bestellingen van deze klant." />}
      {tab === 'historiek' && <TabPlaceholder label="Historiek" omschrijving="Afgehandelde bestellingen en alles wat deze klant eerder kocht." />}

      {/* Edit slide-over */}
      <SlideOver
        open={bewerkOpen}
        onClose={() => setBewerkOpen(false)}
        title={`${klant.volledigNaam} bewerken`}
      >
        <KlantForm
          klant={klant}
          onOpgeslagen={() => { setBewerkOpen(false); laad() }}
          onAnnuleer={() => setBewerkOpen(false)}
        />
      </SlideOver>
    </div>
  )
}

function TabGegevens({ klant }: { klant: KlantResponse }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Contactgegevens */}
      <Section titel="Contactgegevens">
        <div className="flex flex-col gap-3 text-sm">
          {klant.email ? (
            <Row icon={<Mail className="h-4 w-4" />} label="Email">
              <a href={`mailto:${klant.email}`} className="hover:text-amber-700 underline">{klant.email}</a>
            </Row>
          ) : (
            <Row icon={<Mail className="h-4 w-4" />} label="Email">
              <span className="text-slate-400">Niet opgegeven</span>
            </Row>
          )}
          {klant.telefoon && (
            <Row icon={<Phone className="h-4 w-4" />} label="Telefoon">
              <span>{klant.telefoon}</span>
            </Row>
          )}
          {klant.adres && (
            <Row icon={<MapPin className="h-4 w-4" />} label="Adres">
              <span>
                {klant.adres.straat} {klant.adres.huisnummer}<br />
                {klant.adres.postcode} {klant.adres.gemeente}<br />
                {klant.adres.land}
              </span>
            </Row>
          )}
        </div>
      </Section>

      {/* Voorkeur */}
      <Section titel="Voorkeur">
        <dl className="flex flex-col gap-3 text-sm">
          <div>
            <dt className="text-slate-500 text-xs mb-0.5">Voorkeur contact</dt>
            <dd className="font-medium">{CONTACT_LABELS[klant.voorkeurContactwijze] ?? klant.voorkeurContactwijze}</dd>
          </div>
          {klant.herkomst && (
            <div>
              <dt className="text-slate-500 text-xs mb-0.5">Herkomst</dt>
              <dd className="font-medium">
                {HERKOMST_LABELS[klant.herkomst] ?? klant.herkomst}
                {klant.herkomstToelichting && (
                  <span className="font-normal text-slate-500"> — {klant.herkomstToelichting}</span>
                )}
              </dd>
            </div>
          )}
        </dl>
      </Section>

      {/* Allergieën */}
      {klant.allergenen.length > 0 && (
        <Section titel="Allergieën" fullWidth>
          <div className="flex flex-wrap gap-2">
            {klant.allergenen.map(a => <AllergeenBadge key={a} allergeen={a} />)}
          </div>
        </Section>
      )}

      {/* Speciale eisen */}
      {klant.specialeEisen.length > 0 && (
        <Section titel="Speciale eisen" fullWidth>
          <ul className="flex flex-col gap-1.5">
            {klant.specialeEisen.map(e => (
              <li key={e.id} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                {e.omschrijving}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {klant.isGeanonimiseerd && (
        <div className="md:col-span-2 rounded-md bg-slate-100 border border-slate-200 px-4 py-3 text-slate-500 text-sm">
          Deze klant is geanonimiseerd. Persoonsgegevens werden verwijderd.
        </div>
      )}
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

function Section({ titel, children, fullWidth }: { titel: string; children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <div className={fullWidth ? 'md:col-span-2' : ''}>
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{titel}</h3>
      {children}
    </div>
  )
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-slate-400 mt-0.5 shrink-0">{icon}</span>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-slate-700">{children}</span>
      </div>
    </div>
  )
}

function KlantDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-4 w-48 bg-slate-100 rounded" />
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-slate-100" />
        <div className="flex flex-col gap-2">
          <div className="h-5 w-40 bg-slate-100 rounded" />
          <div className="h-3 w-28 bg-slate-100 rounded" />
        </div>
      </div>
      <div className="h-8 w-full bg-slate-100 rounded" />
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded" />)}
      </div>
    </div>
  )
}
