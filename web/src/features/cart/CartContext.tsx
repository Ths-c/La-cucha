import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export interface CartItem {
  supplierProductId: number
  name: string
  quantity: number
}

interface CartContextValue {
  items: CartItem[]
  note: string
  count: number
  add: (product: { id: number; name: string }) => void
  setQuantity: (supplierProductId: number, quantity: number) => void
  remove: (supplierProductId: number) => void
  setNote: (note: string) => void
  clear: () => void
  isInCart: (supplierProductId: number) => boolean
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [note, setNoteState] = useState('')

  const setNote = useCallback((value: string) => setNoteState(value), [])

  const add = useCallback((product: { id: number; name: string }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.supplierProductId === product.id)
      if (existing) {
        return prev.map((i) =>
          i.supplierProductId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        )
      }
      return [...prev, { supplierProductId: product.id, name: product.name, quantity: 1 }]
    })
  }, [])

  const setQuantity = useCallback((supplierProductId: number, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((i) => i.supplierProductId !== supplierProductId)
      }
      return prev.map((i) =>
        i.supplierProductId === supplierProductId ? { ...i, quantity } : i,
      )
    })
  }, [])

  const remove = useCallback((supplierProductId: number) => {
    setItems((prev) => prev.filter((i) => i.supplierProductId !== supplierProductId))
  }, [])

  const clear = useCallback(() => {
    setItems([])
    setNoteState('')
  }, [])

  const isInCart = useCallback(
    (supplierProductId: number) => items.some((i) => i.supplierProductId === supplierProductId),
    [items],
  )

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      note,
      count: items.reduce((acc, i) => acc + i.quantity, 0),
      add,
      setQuantity,
      remove,
      setNote: (n) => setNote(n),
      clear,
      isInCart,
    }),
    [items, note, add, setQuantity, remove, clear, isInCart, setNote],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return ctx
}