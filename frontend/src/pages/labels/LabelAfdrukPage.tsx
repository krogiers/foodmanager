import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'sonner'
import { ChevronRight, FileDown, Loader2, Eye } from 'lucide-react'
import type { LabelsjabloonResponse } from '../../types/label'

interface ReceptOptie {
  id: string
  naam: string
  houdbaarheid?: { waarde: number; eenheid: 'DAGEN' | 'WEKEN' | 'MAANDEN' } | null
}

type HoudbaarheidModus = 'vrije_tekst' | 'datum' | 'berekend'

const HOUDBAARHEID_LABEL: Record<string, string> = {
  DAGEN: 'dag(en)', WEKEN: 'week/weken', MAANDEN: 'maand(en)',
}

function bereken(datum: string, waarde: number, eenheid: string): string {
  const d = new Date(datum)
  if (eenheid === 'DAGEN')   d.setDate(d.getDate() + waarde)
  if (eenheid === 'WEKEN')   d.setDate(d.getDate() + waarde * 7)
  if (eenheid === 'MAANDEN') d.setMonth(d.getMonth() + waarde)
  return d.toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formaatDatum(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function LabelAfdrukPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [sjabloon, setSjabloon] = useState<LabelsjabloonResponse | null>(null)
  const [recepten, setRecepten] = useState<ReceptOptie[]>([])
  const [laden, setLaden] = useState(true)

  const [receptId, setReceptId] = useState('')
  const [modus, setModus] = useState<HoudbaarheidModus>('vrije_tekst')
  const [vrijeTekst, setVrijeTekst] = useState('')
  const [manueleDatum, setManueleDatum] = useState('')
  const [productiedatum, setProductiedatum] = useState(new Date().toISOString().slice(0, 10))
  const [aantalExemplaren, setAantalExemplaren] = useState('1')

  const [bezig, setBezig] = useState(false)
  const [previewBezig, setPreviewBezig] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      axios.get(`/api/labels/${id}`),
      axios.get('/api/recepten?paginaGrootte=1000&sorteerOp=naam&sorteerRichting=ASC'),
    ]).then(([labelRes, receptRes]) => {
      setSjabloon(labelRes.data)
      const lijst: ReceptOptie[] = receptRes.data.content
      setRecepten(lijst)
      if (lijst.length > 0) setReceptId(lijst[0].id)
    }).catch(() => toast.error('Kon gegevens niet laden.'))
     .finally(() => setLaden(false))
  }, [id])

  const geselecteerdRecept = recepten.find(r => r.id === receptId) ?? null

  function houdbaarheidWaarde(): string {
    switch (modus) {
      case 'vrije_tekst': return vrijeTekst
      case 'datum':       return formaatDatum(manueleDatum)
      case 'berekend': {
        const hb = geselecteerdRecept?.houdbaarheid
        if (!hb || !productiedatum) return ''
        return bereken(productiedatum, hb.waarde, hb.eenheid)
      }
    }
  }

  async function toonVoorbeeld() {
    if (!receptId) return
    setPreviewBezig(true)
    try {
      const params = new URLSearchParams({ receptId, houdbaarheid: houdbaarheidWaarde() })
      const { data } = await axios.get(`/api/labels/${id}/voorbeeld?${params}`)
      setPreviewHtml(data)
    } catch {
      toast.error('Voorbeeld laden mislukt.')
    } finally {
      setPreviewBezig(false)
    }
  }

  async function afdrukken() {
    if (!receptId) return
    setBezig(true)
    try {
      const params = new URLSearchParams({
        receptId,
        houdbaarheid: houdbaarheidWaarde(),
        aantalExemplaren,
      })
      const resp = await axios.get(`/api/labels/${id}/afdruk?${params}`, { responseType: 'blob' })
      const url  = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href  = url
      link.download = `label-${sjabloon?.naam ?? 'afdruk'}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('PDF genereren mislukt.')
    } finally {
      setBezig(false)
    }
  }

  if (laden) return <div className="h-32 bg-slate-100 rounded-lg animate-pulse" />
  if (!sjabloon) return <p className="text-slate-500 text-sm">Sjabloon niet gevonden.</p>

  const hb = houdbaarheidWaarde()

  return (
    <div className="flex flex-col gap-0">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-5">
        <Link to="/labels" className="hover:text-amber-700 transition-colors">Labels</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to={`/labels/${id}`} className="hover:text-amber-700 transition-colors">{sjabloon.naam}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-800 font-medium">Afdrukken</span>
      </nav>

      <h1 className="text-xl font-semibold text-slate-900 mb-6">Afdrukken — {sjabloon.naam}</h1>

      <div className="flex gap-8">
        {/* Formulier links */}
        <div className="flex flex-col gap-6 w-80">

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Recept <span className="text-red-500">*</span>
            </label>
            {recepten.length === 0 ? (
              <p className="text-sm text-slate-400">Geen recepten beschikbaar.</p>
            ) : (
              <select value={receptId} onChange={e => setReceptId(e.target.value)} className={veld}>
                {recepten.map(r => <option key={r.id} value={r.id}>{r.naam}</option>)}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Houdbaarheidsdatum</label>
            <div className="flex flex-col gap-2">
              {([
                ['vrije_tekst', 'Vrije tekst (bv. "Zie deksel")'],
                ['datum',       'Manuele datum'],
                ['berekend',    'Berekend op basis van recept'],
              ] as [HoudbaarheidModus, string][]).map(([m, label]) => (
                <label key={m} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio" name="modus" value={m} checked={modus === m}
                    onChange={() => setModus(m)} className="accent-amber-600"
                  />
                  <span className="text-sm text-slate-700">{label}</span>
                </label>
              ))}

              <div className="mt-1">
                {modus === 'vrije_tekst' && (
                  <input
                    value={vrijeTekst} onChange={e => setVrijeTekst(e.target.value)}
                    placeholder='bv. "Zie deksel"'
                    className={veld}
                  />
                )}
                {modus === 'datum' && (
                  <input type="date" value={manueleDatum}
                    onChange={e => setManueleDatum(e.target.value)} className={veld} />
                )}
                {modus === 'berekend' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500">Productiedatum</label>
                    <input type="date" value={productiedatum}
                      onChange={e => setProductiedatum(e.target.value)} className={veld} />
                    {geselecteerdRecept?.houdbaarheid ? (
                      <p className="text-xs text-slate-500">
                        Houdbaarheid: {geselecteerdRecept.houdbaarheid.waarde}{' '}
                        {HOUDBAARHEID_LABEL[geselecteerdRecept.houdbaarheid.eenheid]}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-600">Recept heeft geen houdbaarheid ingesteld.</p>
                    )}
                  </div>
                )}
              </div>

              {hb && (
                <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded px-2 py-1">
                  Op label: <strong className="text-slate-700">{hb}</strong>
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Aantal exemplaren</label>
            <input
              type="number" min="1" max="500" value={aantalExemplaren}
              onChange={e => setAantalExemplaren(e.target.value)}
              className={`${veld} w-24`}
            />
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            <button onClick={afdrukken} disabled={bezig || !receptId}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium rounded-md transition-colors">
              {bezig ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              {bezig ? 'PDF genereren…' : `PDF downloaden (${aantalExemplaren}×)`}
            </button>
            <button onClick={toonVoorbeeld} disabled={previewBezig || !receptId}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-60 text-slate-700 text-sm font-medium rounded-md transition-colors">
              {previewBezig ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              {previewBezig ? 'Laden…' : 'Voorbeeld laden'}
            </button>
            <button onClick={() => navigate(`/labels/${id}`)}
              className="text-sm text-slate-500 hover:text-slate-700 text-center py-1">
              ← Terug naar sjabloon
            </button>
          </div>
        </div>

        {/* Preview rechts */}
        <div className="flex-1 flex flex-col gap-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Voorbeeld met echte receptdata</p>
          <div className="flex-1 border border-slate-200 rounded-md bg-slate-100 flex items-center justify-center min-h-64 p-4">
            {previewHtml ? (
              <iframe
                srcDoc={previewHtml}
                className="border border-slate-300 shadow-sm"
                style={{
                  width: `${sjabloon.breedteMm * 3.78}px`,
                  height: `${sjabloon.hoogteMm * 3.78}px`,
                  maxWidth: '100%',
                  maxHeight: '500px',
                }}
                title="Label voorbeeld"
              />
            ) : (
              <div className="text-center">
                <p className="text-slate-400 text-sm">
                  {previewBezig ? 'Laden…' : 'Klik "Voorbeeld laden" om een preview te zien met echte receptdata.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const veld = 'w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white'
