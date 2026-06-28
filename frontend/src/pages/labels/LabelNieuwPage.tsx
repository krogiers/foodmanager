import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'sonner'
import { ChevronRight, Loader2 } from 'lucide-react'
import { STANDAARD_SJABLOON_HTML } from './labelsjabloon-default'

export function LabelNieuwPage() {
  const navigate = useNavigate()
  const [naam, setNaam] = useState('')
  const [breedteMm, setBreedteMm] = useState('60')
  const [hoogteMm, setHoogteMm] = useState('40')
  const [bezig, setBezig] = useState(false)

  async function opslaan(e: React.FormEvent) {
    e.preventDefault()
    setBezig(true)
    try {
      const { data } = await axios.post('/api/labels', {
        naam,
        breedteMm: parseInt(breedteMm),
        hoogteMm: parseInt(hoogteMm),
        htmlTemplate: STANDAARD_SJABLOON_HTML,
      })
      toast.success(`"${data.naam}" aangemaakt.`)
      navigate(`/labels/${data.id}`)
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
        <Link to="/labels" className="hover:text-amber-700 transition-colors">Labels</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-800 font-medium">Nieuw sjabloon</span>
      </nav>

      <h1 className="text-xl font-semibold text-slate-900 mb-6">Nieuw labelsjabloon</h1>

      <form onSubmit={opslaan} className="flex flex-col gap-6 max-w-sm">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Naam <span className="text-red-500">*</span>
          </label>
          <input
            required value={naam} onChange={e => setNaam(e.target.value)}
            placeholder="bv. Standaard etiket, Groot formaat…"
            className={veld}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Formaat (mm)</label>
          <div className="flex items-center gap-2">
            <input
              type="number" min="10" max="500" required
              value={breedteMm} onChange={e => setBreedteMm(e.target.value)}
              placeholder="Breedte"
              className={`${veld} w-28`}
            />
            <span className="text-slate-400 text-sm">×</span>
            <input
              type="number" min="10" max="500" required
              value={hoogteMm} onChange={e => setHoogteMm(e.target.value)}
              placeholder="Hoogte"
              className={`${veld} w-28`}
            />
            <span className="text-slate-400 text-sm">mm</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Het standaard HTML-sjabloon wordt automatisch ingevuld. Je kunt het daarna aanpassen.
          </p>
        </div>

        <div className="flex gap-3 pt-2 border-t border-slate-100">
          <button type="submit" disabled={bezig}
            className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium rounded-md transition-colors">
            {bezig && <Loader2 className="h-4 w-4 animate-spin" />}
            {bezig ? 'Bezig…' : 'Sjabloon aanmaken'}
          </button>
          <button type="button" onClick={() => navigate('/labels')}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm rounded-md transition-colors">
            Annuleren
          </button>
        </div>
      </form>
    </div>
  )
}

const veld = 'w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white'
