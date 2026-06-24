import { useNavigate, Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { KlantForm } from './KlantForm'

export function KlantNieuwPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-0">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-5">
        <Link to="/klanten" className="hover:text-amber-700 transition-colors">Klanten</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-800 font-medium">Nieuwe klant</span>
      </nav>

      <h1 className="text-xl font-semibold text-slate-900 mb-6">Nieuwe klant</h1>

      <KlantForm
        onOpgeslagen={klant => navigate(`/klanten/${klant.id}`)}
        onAnnuleer={() => navigate('/klanten')}
      />
    </div>
  )
}
