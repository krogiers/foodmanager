import { X } from 'lucide-react'
import { useEffect } from 'react'
import { cn } from '../../lib/utils'

interface SlideOverProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  width?: 'md' | 'lg' | 'xl'
}

export function SlideOver({ open, onClose, title, children, width = 'lg' }: SlideOverProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const widthClass = { md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' }[width]

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="fixed inset-0 bg-black/20" onClick={onClose} />
      <div className={cn('relative z-50 flex flex-col bg-white shadow-xl w-full h-full', widthClass)}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-500">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}
