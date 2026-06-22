import type { Allergeen } from '../../types/ingredient'
import { cn } from '../../lib/utils'

const LABELS: Record<Allergeen, string> = {
  GLUTEN: 'Gluten', SCHAALDIEREN: 'Schaaldieren', EIEREN: 'Eieren', VIS: 'Vis',
  PINDA: 'Pinda', SOJA: 'Soja', MELK: 'Melk', NOTEN: 'Noten',
  SELDERIJ: 'Selderij', MOSTERD: 'Mosterd', SESAM: 'Sesam',
  SULFIET: 'Sulfiet', LUPINE: 'Lupine', WEEKDIEREN: 'Weekdieren'
}

export function AllergeenBadge({ allergeen, size = 'sm' }: { allergeen: Allergeen; size?: 'sm' | 'xs' }) {
  return (
    <span className={cn(
      'inline-block rounded-full font-medium bg-amber-100 text-amber-800 border border-amber-200',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-1.5 py-0 text-[10px]'
    )}>
      {LABELS[allergeen]}
    </span>
  )
}
