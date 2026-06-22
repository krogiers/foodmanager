import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { IngredientenPage } from './pages/ingredienten/IngredientenPage'
import { KlantenPage } from './pages/klanten/KlantenPage'
import { KlantDetailPage } from './pages/klanten/KlantDetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ingredienten" element={<IngredientenPage />} />
          <Route path="/klanten" element={<KlantenPage />} />
          <Route path="/klanten/:id" element={<KlantDetailPage />} />
          <Route path="/recepten" element={<Placeholder titel="Recepten" />} />
          <Route path="/producten" element={<Placeholder titel="Producten" />} />
          <Route path="/reservaties" element={<Placeholder titel="Reservaties" />} />
          <Route path="/labels" element={<Placeholder titel="Labels" />} />
          <Route path="/stock" element={<Placeholder titel="Stock" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function Placeholder({ titel }: { titel: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold text-slate-900">{titel}</h1>
      <p className="text-slate-400 text-sm">Nog niet geïmplementeerd.</p>
    </div>
  )
}
