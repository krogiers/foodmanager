import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'sonner'
import { Plus, Tag } from 'lucide-react'
import type { LabelsjabloonSummaryResponse } from '../../types/label'

export function LabelsPage() {
  const navigate = useNavigate()
  const [sjablonen, setSjablonen] = useState<LabelsjabloonSummaryResponse[]>([])
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    axios.get('/api/labels')
      .then(r => setSjablonen(r.data))
      .catch(() => toast.error('Kon labelsjablonen niet laden.'))
      .finally(() => setLaden(false))
  }, [])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Labelsjablonen</h1>
        <button
          onClick={() => navigate('/labels/nieuw')}
          className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          <Plus className="h-4 w-4" /> Nieuw sjabloon
        </button>
      </div>

      {laden ? (
        <div className="flex flex-col gap-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />)}
        </div>
      ) : sjablonen.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Tag className="h-10 w-10 text-slate-300" />
          <p className="text-slate-500 text-sm">Nog geen labelsjablonen aangemaakt.</p>
          <button
            onClick={() => navigate('/labels/nieuw')}
            className="text-amber-600 hover:text-amber-700 text-sm font-medium"
          >
            Maak je eerste sjabloon aan →
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sjablonen.map(s => (
            <button
              key={s.id}
              onDoubleClick={() => navigate(`/labels/${s.id}`)}
              onClick={() => navigate(`/labels/${s.id}`)}
              className="flex items-center gap-4 px-4 py-3 bg-white border border-slate-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-colors text-left group"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-slate-100 group-hover:bg-amber-100 rounded border border-slate-200 flex items-center justify-center transition-colors">
                <Tag className="h-4 w-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">{s.naam}</p>
                <p className="text-xs text-slate-400">{s.breedteMm} × {s.hoogteMm} mm</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
