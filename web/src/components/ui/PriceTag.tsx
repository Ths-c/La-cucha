import { formatPrice, isOnPromo, pricePerLabel } from '@/utils'
import type { ProductUnit } from '@/types/domain'

interface PriceTagProps {
  price: number | null
  promoPrice?: number | null
  unit?: ProductUnit
  showPer?: boolean
}

/** Muestra el precio normal y, si hay oferta vigente, el precio promocional. */
export function PriceTag({ price, promoPrice = null, unit = 'UNITS', showPer = false }: PriceTagProps) {
  if (price == null) return <span className="text-sm text-slate-400">Sin precio</span>
  if (isOnPromo(price, promoPrice)) {
    return (
      <span className="text-sm">
        <span className="mr-1.5 text-slate-400 line-through">{formatPrice(price)}</span>
        <span className="font-bold text-red-600">{formatPrice(promoPrice)}</span>
        {showPer && <span className="ml-1 text-xs font-normal text-slate-500">{pricePerLabel(unit)}</span>}
      </span>
    )
  }
  return (
    <span className="text-sm font-semibold text-slate-800">
      {formatPrice(price)}
      {showPer && <span className="ml-1 text-xs font-normal text-slate-500">{pricePerLabel(unit)}</span>}
    </span>
  )
}
