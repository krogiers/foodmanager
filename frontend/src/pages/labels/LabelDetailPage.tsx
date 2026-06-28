import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'sonner'
import { ChevronRight, Printer, Pencil, Trash2, Save, X, Loader2 } from 'lucide-react'
import type { LabelsjabloonResponse } from '../../types/label'
import { BESCHIKBARE_TOKENS } from './labelsjabloon-default'

const VOORBEELD_DATA: Record<string, string> = {
  '{{productnaam}}':            'Chocoladetaart',
  '{{ingredienten}}':           'Tarwebloem, Suiker, Boter, Eieren, Cacao, Bakpoeder, Zout',
  '{{allergenen_bevat}}':       'Gluten (tarwe), Eieren, Melk',
  '{{allergenen_kan_bevatten}}': 'Noten, Pinda\'s',
  '{{voedingswaarden}}':        '<table class="voedingswaarden"><thead><tr><th colspan="2">Voedingswaarden (per batch)</th></tr></thead><tbody><tr><td>Energie</td><td>2400 kcal</td></tr><tr><td>Eiwitten</td><td>48 g</td></tr><tr><td>Koolhydraten</td><td>320 g</td></tr><tr><td>Vetten</td><td>110 g</td></tr></tbody></table>',
  '{{houdbaarheid}}':           '15/10/2025',
  '{{producent}}':              'Bakkerij',
}

function vulVoorbeeldIn(template: string): string {
  let result = template
  for (const [token, waarde] of Object.entries(VOORBEELD_DATA)) {
    result = result.replaceAll(token, waarde)
  }
  return result
}

export function LabelDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [sjabloon, setSjabloon] = useState<LabelsjabloonResponse | null>(null)
  const [laden, setLaden] = useState(true)
  const [editModus, setEditModus] = useState(false)

  const [naam, setNaam] = useState('')
  const [breedteMm, setBreedteMm] = useState('')
  const [hoogteMm, setHoogteMm] = useState('')
  const [htmlTemplate, setHtmlTemplate] = useState('')
  const [bezig, setBezig] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    axios.get(`/api/labels/${id}`)
      .then(r => {
        setSjabloon(r.data)
        reset(r.data)
      })
      .catch(() => toast.error('Kon sjabloon niet laden.'))
      .finally(() => setLaden(false))
  }, [id])

  function reset(s: LabelsjabloonResponse) {
    setNaam(s.naam)
    setBreedteMm(String(s.breedteMm))
    setHoogteMm(String(s.hoogteMm))
    setHtmlTemplate(s.htmlTemplate)
  }

  function startEdit() {
    if (sjabloon) reset(sjabloon)
    setEditModus(true)
  }

  function annuleer() {
    if (sjabloon) reset(sjabloon)
    setEditModus(false)
  }

  async function opslaan() {
    if (!sjabloon) return
    setBezig(true)
    try {
      const { data } = await axios.put(`/api/labels/${id}`, {
        naam, breedteMm: parseInt(breedteMm), hoogteMm: parseInt(hoogteMm), htmlTemplate,
      })
      setSjabloon(data)
      setEditModus(false)
      toast.success('Sjabloon opgeslagen.')
    } catch (err: unknown) {
      const res = axios.isAxiosError(err) ? err.response?.data : null
      toast.error(res?.bericht ?? 'Opslaan mislukt.')
    } finally {
      setBezig(false)
    }
  }

  async function verwijder() {
    if (!confirm(`Sjabloon "${sjabloon?.naam}" definitief verwijderen?`)) return
    try {
      await axios.delete(`/api/labels/${id}`)
      toast.success('Sjabloon verwijderd.')
      navigate('/labels')
    } catch {
      toast.error('Verwijderen mislukt.')
    }
  }

  function voegTokenIn(token: string) {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end   = ta.selectionEnd
    const nieuw = htmlTemplate.slice(0, start) + token + htmlTemplate.slice(end)
    setHtmlTemplate(nieuw)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + token.length, start + token.length)
    })
  }

  const voorbeeldHtml = useCallback(() => {
    const breedte = parseInt(editModus ? breedteMm : String(sjabloon?.breedteMm ?? 60))
    const hoogte  = parseInt(editModus ? hoogteMm  : String(sjabloon?.hoogteMm  ?? 40))
    const inhoud  = editModus ? htmlTemplate : (sjabloon?.htmlTemplate ?? '')
    const gevuld  = vulVoorbeeldIn(inhoud)
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
  @page { size: ${breedte}mm ${hoogte}mm; margin: 0; }
  body  { margin: 0; padding: 0; }
  .__label__ { width: ${breedte}mm; height: ${hoogte}mm; overflow: hidden; }
</style></head><body><div class="__label__">${gevuld}</div></body></html>`
  }, [editModus, breedteMm, hoogteMm, htmlTemplate, sjabloon])

  if (laden) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />)}
      </div>
    )
  }

  if (!sjabloon) return <p className="text-slate-500 text-sm">Sjabloon niet gevonden.</p>

  return (
    <div className="flex flex-col gap-0 h-full">
      {/* Breadcrumb + acties */}
      <div className="flex items-center justify-between mb-5">
        <nav className="flex items-center gap-1.5 text-sm text-slate-500">
          <Link to="/labels" className="hover:text-amber-700 transition-colors">Labels</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-800 font-medium">{sjabloon.naam}</span>
        </nav>
        <div className="flex items-center gap-2">
          {!editModus ? (
            <>
              <button
                onClick={() => navigate(`/labels/${id}/afdruk`)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                <Printer className="h-4 w-4" /> Afdrukken
              </button>
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-md transition-colors"
              >
                <Pencil className="h-4 w-4" /> Bewerken
              </button>
              <button
                onClick={verwijder}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 text-sm font-medium rounded-md transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button onClick={opslaan} disabled={bezig}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium rounded-md transition-colors">
                {bezig ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {bezig ? 'Bezig…' : 'Opslaan'}
              </button>
              <button onClick={annuleer}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium rounded-md transition-colors">
                <X className="h-4 w-4" /> Annuleren
              </button>
            </>
          )}
        </div>
      </div>

      {/* Formaat-velden in edit-modus */}
      {editModus && (
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Naam</label>
            <input value={naam} onChange={e => setNaam(e.target.value)} className={veld} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Breedte (mm)</label>
            <input type="number" min="10" max="500" value={breedteMm}
              onChange={e => setBreedteMm(e.target.value)} className={`${veld} w-24`} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Hoogte (mm)</label>
            <input type="number" min="10" max="500" value={hoogteMm}
              onChange={e => setHoogteMm(e.target.value)} className={`${veld} w-24`} />
          </div>
        </div>
      )}

      {/* Split-screen */}
      <div className="flex gap-4 flex-1 min-h-0" style={{ height: 'calc(100vh - 200px)' }}>

        {/* Links: editor of info */}
        <div className="flex flex-col gap-2 w-1/2 min-h-0">
          {editModus ? (
            <>
              <div className="flex flex-wrap gap-1.5">
                {BESCHIKBARE_TOKENS.map(t => (
                  <button
                    key={t.token}
                    type="button"
                    onClick={() => voegTokenIn(t.token)}
                    className="px-2 py-0.5 text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded hover:bg-amber-100 transition-colors font-mono"
                  >
                    {t.token}
                  </button>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                value={htmlTemplate}
                onChange={e => setHtmlTemplate(e.target.value)}
                spellCheck={false}
                className="flex-1 font-mono text-xs border border-slate-200 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none bg-slate-950 text-green-400"
              />
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Naam</p>
                <p className="text-sm text-slate-800">{sjabloon.naam}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Formaat</p>
                <p className="text-sm text-slate-800">{sjabloon.breedteMm} × {sjabloon.hoogteMm} mm</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">HTML-sjabloon</p>
                <pre className="text-xs font-mono bg-slate-950 text-green-400 rounded-md p-3 overflow-auto max-h-64 whitespace-pre-wrap">
                  {sjabloon.htmlTemplate}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Rechts: live preview */}
        <div className="flex flex-col gap-2 w-1/2 min-h-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Preview</p>
            <span className="text-xs text-slate-400">(voorbeelddata)</span>
          </div>
          <div className="flex-1 border border-slate-200 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center">
            <iframe
              key={voorbeeldHtml()}
              srcDoc={voorbeeldHtml()}
              className="border-0"
              style={{
                width: `${parseInt(editModus ? breedteMm : String(sjabloon.breedteMm)) * 3.78}px`,
                height: `${parseInt(editModus ? hoogteMm : String(sjabloon.hoogteMm)) * 3.78}px`,
                maxWidth: '100%',
                maxHeight: '100%',
              }}
              title="Label preview"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

const veld = 'border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white'
