import { NavLink } from 'react-router-dom'
import { FlaskConical, BookOpen, ShoppingBag, Users, CalendarDays, Tag, Package, LayoutDashboard, Settings } from 'lucide-react'
import { cn } from '../../lib/utils'

const groepen = [
  {
    label: 'Productie',
    items: [
      { to: '/ingredienten', label: 'Ingrediënten', icon: FlaskConical },
      { to: '/recepten', label: 'Recepten', icon: BookOpen },
      { to: '/producten', label: 'Producten', icon: ShoppingBag },
      { to: '/stock', label: 'Stock', icon: Package },
      { to: '/labels', label: 'Labels', icon: Tag },
    ]
  },
  {
    label: 'Klanten & Verkoop',
    items: [
      { to: '/klanten', label: 'Klanten', icon: Users },
      { to: '/reservaties', label: 'Reservaties', icon: CalendarDays },
    ]
  },
  {
    label: 'Beheer',
    items: [
      { to: '/instellingen', label: 'Instellingen', icon: Settings },
    ]
  },
]

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col">
      <div className="px-5 py-4 border-b border-slate-200">
        <span className="text-base font-bold text-amber-700 tracking-tight">FoodManager</span>
      </div>
      <nav className="flex-1 py-3 px-2 flex flex-col gap-4 overflow-y-auto">
        <NavLink
          to="/"
          end
          className={({ isActive }) => cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
            isActive ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          )}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          Dashboard
        </NavLink>

        {groepen.map(groep => (
          <div key={groep.label} className="flex flex-col gap-0.5">
            <span className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {groep.label}
            </span>
            {groep.items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
