import { Badge } from '@/components/ui/Badge'
import { MOVEMENT_LABELS, MOVEMENT_SIGN, formatDateTime } from '@/utils'

interface MovementRow {
  type: string
  quantity: number
  stockBefore: number
  stockAfter: number
  supplier: { id: number; name: string } | null
  note: string | null
  createdAt: string
}

const typeTone: Record<string, 'green' | 'red' | 'amber' | 'slate'> = {
  BUY: 'green',
  MANUAL_ADJUST: 'slate',
  SALE: 'red',
  BREAKAGE: 'red',
  EXPIRY: 'amber',
  DONATION: 'amber',
  INTERNAL_CONSUMPTION: 'slate',
}

export function MovementItem({ m }: { m: MovementRow }) {
  const sign = MOVEMENT_SIGN[m.type]
  const isOut = sign === '-'
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Badge tone={typeTone[m.type] ?? 'slate'}>{MOVEMENT_LABELS[m.type]}</Badge>
          <span
            className={`text-sm font-bold ${isOut ? 'text-red-600' : 'text-emerald-700'}`}
          >
            {sign ?? ''}
            {m.quantity} u.
          </span>
        </div>
        {m.note && <p className="mt-0.5 truncate text-xs text-slate-500">{m.note}</p>}
        {m.supplier && <p className="text-xs text-slate-500">Proveedor: {m.supplier.name}</p>}
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xs text-slate-500">{formatDateTime(m.createdAt)}</p>
        <p className="text-xs text-slate-400">
          {m.stockBefore} → {m.stockAfter}
        </p>
      </div>
    </div>
  )
}