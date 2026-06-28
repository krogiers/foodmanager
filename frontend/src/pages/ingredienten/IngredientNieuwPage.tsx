import { useNavigate, Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { IngredientForm } from './IngredientForm'

export function IngredientNieuwPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-0">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-5">
        <Link to="/ingredienten" className="hover:text-amber-700 transition-colors">Ingrediënten</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-800 font-medium">Nieuw ingrediënt</span>
      </nav>

      <h1 className="text-xl font-semibold text-slate-900 mb-6">Nieuw ingrediënt</h1>

      <IngredientForm
        onOpgeslagen={ingredient => navigate(`/ingredienten/${ingredient.id}`)}
        onAnnuleer={() => navigate('/ingredienten')}
      />
    </div>
  )
}
