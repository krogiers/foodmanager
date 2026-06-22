import { LogOut, User } from 'lucide-react'

export function Topbar() {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-end px-6 shrink-0">
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <User className="h-4 w-4" />
        <span className="font-medium">Beheerder</span>
        <button className="ml-2 p-1.5 rounded hover:bg-slate-100 text-slate-500" title="Uitloggen">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
