import { Badge } from './Badge'

interface StockBadgeProps {
  stock: number
  stockMin: number
}

/** Destaca visualmente el stock: rojo si está bajo el mínimo. */
export function StockBadge({ stock, stockMin }: StockBadgeProps) {
  const low = stockMin > 0 && stock < stockMin
  return (
    <span
      className={
        low
          ? 'inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700'
          : 'inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800'
      }
    >
      {stock} {stockMin > 0 && <span className="ml-1 font-normal text-inherit opacity-70">/ {stockMin}</span>}
      {low && <Badge tone="red" className="ml-1">Bajo</Badge>}
    </span>
  )
}