import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { Upload, CheckCircle2, AlertCircle, Loader2, ExternalLink, FileText } from 'lucide-react'

interface Status { aantalProducten: number }
interface Resultaat { geimporteerd: number; fouten: string[] }

export function NevoImportPage() {
  const [status, setStatus] = useState<Status | null>(null)
  const [bezig, setBezig] = useState(false)
  const [resultaat, setResultaat] = useState<Resultaat | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { laadStatus() }, [])

  async function laadStatus() {
    try {
      const { data } = await axios.get('/api/admin/nevo/status')
      setStatus(data)
    } catch {
      toast.error('Kon NEVO-status niet ophalen.')
    }
  }

  async function handleBestand(bestand: File) {
    setBezig(true)
    setResultaat(null)
    const formData = new FormData()
    formData.append('bestand', bestand)
    try {
      const { data } = await axios.post('/api/admin/nevo/importeer', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResultaat(data)
      if (data.geimporteerd > 0) toast.success(`${data.geimporteerd} producten geïmporteerd.`)
      await laadStatus()
    } catch (err: unknown) {
      const res = axios.isAxiosError(err) ? err.response?.data : null
      toast.error(res?.bericht ?? 'Import mislukt.')
    } finally {
      setBezig(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 mb-1">NEVO-databank importeren</h1>
        <p className="text-sm text-slate-500">
          De NEVO (Nederlands Voedingsstoffendatabestand) bevat voedingswaarden voor vers fruit, groenten, vlees, zuivel en duizenden andere producten — alles in het Nederlands.
        </p>
      </div>

      {/* Status */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
        status && status.aantalProducten > 0
          ? 'bg-green-50 border-green-200'
          : 'bg-amber-50 border-amber-200'
      }`}>
        {status && status.aantalProducten > 0
          ? <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          : <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
        }
        <div>
          <p className="text-sm font-medium text-slate-800">
            {status === null
              ? 'Status laden…'
              : status.aantalProducten > 0
              ? `${status.aantalProducten.toLocaleString('nl-BE')} producten geladen`
              : 'Nog geen NEVO-data aanwezig'
            }
          </p>
          {status && status.aantalProducten > 0 && (
            <p className="text-xs text-slate-500">Je kunt de databank opnieuw importeren om te updaten.</p>
          )}
        </div>
      </div>

      {/* Stap 1: download */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Stap 1 — Download de NEVO-data</h2>
        <div className="border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
          <ol className="text-sm text-slate-600 flex flex-col gap-2 list-decimal list-inside">
            <li>
              Ga naar{' '}
              <a
                href="https://nevo-online.rivm.nl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-700 hover:underline inline-flex items-center gap-1"
              >
                nevo-online.rivm.nl <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>Klik op <strong>"Data downloaden"</strong> (of <em>"Download"</em> in het menu)</li>
            <li>Download het Excel-bestand (<code className="bg-slate-100 px-1 rounded text-xs">.xlsx</code>)</li>
            <li>Open het bestand in Excel of LibreOffice Calc</li>
            <li>Sla het op als <strong>CSV</strong> (scheidingsteken: puntkomma of komma)</li>
          </ol>

          <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
            <p className="text-xs font-medium text-slate-600 mb-1.5">Vereiste kolomnamen in de CSV (niet hoofdlettergevoelig):</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 font-mono text-xs text-slate-500">
              {[
                ['code / Productcode', 'verplicht'],
                ['naam / Productomschrijving', 'verplicht'],
                ['groep / Levensmiddelengroep', 'optioneel'],
                ['Energie (kcal)', 'optioneel'],
                ['Eiwit (g)', 'optioneel'],
                ['Koolhydraten (g)', 'optioneel'],
                ['Suikers (g)', 'optioneel'],
                ['Vet (g)', 'optioneel'],
                ['Verzadigd vet (g)', 'optioneel'],
                ['Voedingsvezel (g)', 'optioneel'],
                ['Natrium (mg)', 'optioneel'],
              ].map(([kol, type]) => (
                <div key={kol} className="flex gap-1">
                  <span className="text-slate-700">{kol}</span>
                  <span className={type === 'verplicht' ? 'text-red-500' : 'text-slate-400'}>({type})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stap 2: upload */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Stap 2 — Importeer het CSV-bestand</h2>

        <div
          className="border-2 border-dashed border-slate-200 hover:border-amber-300 rounded-lg p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors group"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault()
            const f = e.dataTransfer.files[0]
            if (f) handleBestand(f)
          }}
        >
          {bezig
            ? <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
            : <Upload className="h-8 w-8 text-slate-300 group-hover:text-amber-400 transition-colors" />
          }
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">
              {bezig ? 'Importeren…' : 'Sleep CSV hier of klik om te kiezen'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">CSV met komma of puntkomma als scheidingsteken</p>
          </div>
          <input
            ref={inputRef} type="file" accept=".csv,.txt" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleBestand(f) }}
          />
        </div>
      </div>

      {/* Resultaat */}
      {resultaat && (
        <div className={`border rounded-lg p-4 flex flex-col gap-2 ${
          resultaat.fouten.length === 0 ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'
        }`}>
          <div className="flex items-center gap-2">
            {resultaat.fouten.length === 0
              ? <CheckCircle2 className="h-5 w-5 text-green-600" />
              : <AlertCircle className="h-5 w-5 text-amber-600" />
            }
            <p className="text-sm font-medium text-slate-800">
              {resultaat.geimporteerd} producten geïmporteerd
              {resultaat.fouten.length > 0 && `, ${resultaat.fouten.length} rij(en) overgeslagen`}
            </p>
          </div>
          {resultaat.fouten.length > 0 && (
            <ul className="text-xs text-slate-600 flex flex-col gap-1 ml-7">
              {resultaat.fouten.slice(0, 10).map((f, i) => (
                <li key={i} className="flex items-start gap-1">
                  <FileText className="h-3 w-3 mt-0.5 shrink-0 text-amber-500" />
                  {f}
                </li>
              ))}
              {resultaat.fouten.length > 10 && (
                <li className="text-slate-400">… en nog {resultaat.fouten.length - 10} andere</li>
              )}
            </ul>
          )}
        </div>
      )}

      <div className="pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          Na de import kun je NEVO selecteren als actieve provider bij het aanmaken van ingrediënten.
          Je kunt ook wisselen tussen OpenFoodFacts (verpakte producten) en NEVO (vers & basisingrediënten).
        </p>
      </div>
    </div>
  )
}
