import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { IngredientenPage } from './pages/ingredienten/IngredientenPage'
import { IngredientNieuwPage } from './pages/ingredienten/IngredientNieuwPage'
import { IngredientDetailPage } from './pages/ingredienten/IngredientDetailPage'
import { KlantenPage } from './pages/klanten/KlantenPage'
import { KlantNieuwPage } from './pages/klanten/KlantNieuwPage'
import { KlantDetailPage } from './pages/klanten/KlantDetailPage'
import { ReceptenPage } from './pages/recepten/ReceptenPage'
import { ReceptNieuwPage } from './pages/recepten/ReceptNieuwPage'
import { ReceptDetailPage } from './pages/recepten/ReceptDetailPage'
import { LabelsPage } from './pages/labels/LabelsPage'
import { LabelNieuwPage } from './pages/labels/LabelNieuwPage'
import { LabelDetailPage } from './pages/labels/LabelDetailPage'
import { LabelAfdrukPage } from './pages/labels/LabelAfdrukPage'
import { InstellingenPage } from './pages/admin/InstellingenPage'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ingredienten" element={<IngredientenPage />} />
          <Route path="/ingredienten/nieuw" element={<IngredientNieuwPage />} />
          <Route path="/ingredienten/:id" element={<IngredientDetailPage />} />
          <Route path="/klanten" element={<KlantenPage />} />
          <Route path="/klanten/nieuw" element={<KlantNieuwPage />} />
          <Route path="/klanten/:id" element={<KlantDetailPage />} />
          <Route path="/recepten" element={<ReceptenPage />} />
          <Route path="/recepten/nieuw" element={<ReceptNieuwPage />} />
          <Route path="/recepten/:id" element={<ReceptDetailPage />} />
          <Route path="/producten" element={<Placeholder titel="Producten" />} />
          <Route path="/reservaties" element={<Placeholder titel="Reservaties" />} />
          <Route path="/labels" element={<LabelsPage />} />
          <Route path="/labels/nieuw" element={<LabelNieuwPage />} />
          <Route path="/labels/:id" element={<LabelDetailPage />} />
          <Route path="/labels/:id/afdruk" element={<LabelAfdrukPage />} />
          <Route path="/stock" element={<Placeholder titel="Stock" />} />
          <Route path="/instellingen" element={<InstellingenPage />} />
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
