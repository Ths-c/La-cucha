import { formatPrice } from '@/utils'

interface PriceTagProps {
  price: number | null
  bagPrice?: number | null
}

/** Muestra ambos precios sin que uno tape al otro: por kilo y por bolsa. */
export function PriceTag({ price, bagPrice = null }: PriceTagProps) {
  if (price == null && bagPrice == null) {
    return <span className="text-sm text-slate-400">Sin precio</span>
  }
  return (
    <span className="flex flex-col gap-0.5 text-sm">
      {price != null && (
        <span className="font-semibold text-slate-800">
          {formatPrice(price)} <span className="text-xs font-normal text-slate-500">/ kilo</span>
        </span>
      )}
      {bagPrice != null && (
        <span className="font-semibold text-slate-800">
          {formatPrice(bagPrice)} <span className="text-xs font-normal text-slate-500">/ bolsa</span>
        </span>
      )}
    </span>
  )
}
