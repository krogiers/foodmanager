import { useState, useEffect } from 'react'
import axios from 'axios'
import { Users, FlaskConical, ShoppingBag, Plus, X, Check } from 'lucide-react'

// --- Productietaken (localStorage, reset elke dag) ---

interface Taak {
  id: string
  omschrijving: string
  gedaan: boolean
}

const TAKEN_KEY = 'fm_productietaken'

function laadTaken(): Taak[] {
  try {
    const raw = localStorage.getItem(TAKEN_KEY)
    if (!raw) return []
    const { datum, taken } = JSON.parse(raw) as { datum: string; taken: Taak[] }
    if (datum !== vandaagIso()) return []
    return taken
  } catch {
    return []
  }
}

function slaaTakenOp(taken: Taak[]) {
  localStorage.setItem(TAKEN_KEY, JSON.stringify({ datum: vandaagIso(), taken }))
}

function vandaagIso() {
  return new Date().toISOString().slice(0, 10)
}

// --- Dashboard ---

interface Stats {
  klanten: number
  ingredienten: number
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [taken, setTaken] = useState<Taak[]>(laadTaken)
  const [nieuweTaak, setNieuweTaak] = useState('')

  useEffect(() => {
    async function laadStats() {
      try {
        const [k, i] = await Promise.all([
          axios.get('/api/klanten?size=1'),
          axios.get('/api/ingredienten?size=1'),
        ])
        setStats({ klanten: k.data.totalElements, ingredienten: i.data.totalElements })
      } catch {
        // stats zijn niet kritiek
      }
    }
    laadStats()
  }, [])

  function updateTaken(bijgewerkt: Taak[]) {
    setTaken(bijgewerkt)
    slaaTakenOp(bijgewerkt)
  }

  function voegToe() {
    const tekst = nieuweTaak.trim()
    if (!tekst) return
    updateTaken([...taken, { id: crypto.randomUUID(), omschrijving: tekst, gedaan: false }])
    setNieuweTaak('')
  }

  function toggleTaak(id: string) {
    updateTaken(taken.map(t => t.id === id ? { ...t, gedaan: !t.gedaan } : t))
  }

  function verwijderTaak(id: string) {
    updateTaken(taken.filter(t => t.id !== id))
  }

  function verwijderGedaan() {
    updateTaken(taken.filter(t => !t.gedaan))
  }

  const datum = new Date().toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })
  const gedaanAantal = taken.filter(t => t.gedaan).length
  const openAantal = taken.filter(t => !t.gedaan).length

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900 capitalize">{datum}</h1>
        <p className="text-sm text-slate-500 mt-0.5">Goedemorgen — hier is je overzicht voor vandaag.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatKaart
          icon={<Users className="h-5 w-5 text-amber-600" />}
          label="Klanten"
          waarde={stats?.klanten}
          href="/klanten"
        />
        <StatKaart
          icon={<FlaskConical className="h-5 w-5 text-amber-600" />}
          label="Ingrediënten"
          waarde={stats?.ingredienten}
          href="/ingredienten"
        />
        <StatKaart
          icon={<ShoppingBag className="h-5 w-5 text-amber-600" />}
          label="Afhalingen vandaag"
          waarde={undefined}
          placeholder="—"
          href="/reservaties"
        />
      </div>

      {/* Hoofd grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Afhaling vandaag */}
        <Widget titel="Afhaling vandaag">
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
            <ShoppingBag className="h-8 w-8 text-slate-200" />
            <p className="text-slate-400 text-sm">Geen afhalingen gepland.</p>
            <p className="text-slate-300 text-xs">Beschikbaar zodra de reservatiemodule is ingebouwd.</p>
          </div>
        </Widget>

        {/* Productietaken */}
        <Widget
          titel="Productietaken"
          actie={
            gedaanAantal > 0
              ? <button onClick={verwijderGedaan} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                  Verwijder afgevinkte ({gedaanAantal})
                </button>
              : undefined
          }
        >
          {/* Voortgang */}
          {taken.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>{gedaanAantal} van {taken.length} gedaan</span>
                {openAantal > 0 && <span className="text-amber-600 font-medium">{openAantal} open</span>}
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: taken.length ? `${(gedaanAantal / taken.length) * 100}%` : '0%' }}
                />
              </div>
            </div>
          )}

          {/* Takenlijst */}
          <div className="flex flex-col gap-1 mb-3">
            {taken.length === 0 && (
              <p className="text-slate-400 text-sm py-4 text-center">Geen taken voor vandaag.</p>
            )}
            {taken.map(taak => (
              <div
                key={taak.id}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  taak.gedaan ? 'bg-slate-50' : 'bg-white hover:bg-amber-50'
                }`}
              >
                <button
                  onClick={() => toggleTaak(taak.id)}
                  className={`shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                    taak.gedaan
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-slate-300 hover:border-amber-500'
                  }`}
                >
                  {taak.gedaan && <Check className="h-3 w-3" strokeWidth={3} />}
                </button>
                <span className={`flex-1 text-sm ${taak.gedaan ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                  {taak.omschrijving}
                </span>
                <button
                  onClick={() => verwijderTaak(taak.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-400 transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Nieuwe taak */}
          <form
            onSubmit={e => { e.preventDefault(); voegToe() }}
            className="flex gap-2"
          >
            <input
              value={nieuweTaak}
              onChange={e => setNieuweTaak(e.target.value)}
              placeholder="Taak toevoegen..."
              className="flex-1 text-sm border border-slate-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            />
            <button
              type="submit"
              disabled={!nieuweTaak.trim()}
              className="p-2 rounded-md bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </form>
        </Widget>
      </div>

      {/* Te produceren (placeholder voor later) */}
      <Widget titel="Te produceren deze week">
        <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
          <p className="text-slate-400 text-sm">Productieoverzicht volgt zodra reservaties en producten beschikbaar zijn.</p>
        </div>
      </Widget>
    </div>
  )
}

function StatKaart({
  icon, label, waarde, placeholder = '...', href
}: {
  icon: React.ReactNode
  label: string
  waarde: number | undefined
  placeholder?: string
  href?: string
}) {
  const content = (
    <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center gap-3 hover:border-amber-200 hover:bg-amber-50 transition-colors">
      <div className="shrink-0">{icon}</div>
      <div>
        <div className="text-xl font-bold text-slate-900">
          {waarde !== undefined ? waarde : placeholder}
        </div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  )

  return href
    ? <a href={href}>{content}</a>
    : <div>{content}</div>
}

function Widget({
  titel, actie, children
}: {
  titel: string
  actie?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-700">{titel}</h2>
        {actie}
      </div>
      {children}
    </div>
  )
}
