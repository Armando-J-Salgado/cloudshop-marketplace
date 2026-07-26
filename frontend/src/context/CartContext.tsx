import React, { createContext, useContext, useEffect, useState } from "react"
import { apiClient, type Product } from "@/services/apiClient"
import { useAuth } from "@/hooks/useAuth"

// No existe GET /carts/{id} en el backend (backend/lambdas/carts/get_cart no
// tiene código todavía), así que no hay forma de recuperar el carrito real
// desde el servidor. Este contexto mantiene el carrito en localStorage como
// fuente de verdad del lado del cliente, y llama a los endpoints de
// mutación (POST/PATCH/DELETE /carts/{id}/products/{productId}) para
// mantener el backend sincronizado en la medida de lo posible.

export interface CartLineItem {
  productId: string
  storeId: string
  name: string
  price: number
  quantity: number
}

interface CartContextType {
  items: CartLineItem[]
  addItem: (product: Product, quantity: number) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  clear: () => Promise<void>
  subtotal: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

function storageKey(cartId: string) {
  return `cloudshop.cart.${cartId}`
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<CartLineItem[]>([])

  useEffect(() => {
    if (!user) {
      setItems([])
      return
    }
    const raw = localStorage.getItem(storageKey(user.id))
    setItems(raw ? (JSON.parse(raw) as CartLineItem[]) : [])
  }, [user])

  const persist = (next: CartLineItem[]) => {
    setItems(next)
    if (user) {
      localStorage.setItem(storageKey(user.id), JSON.stringify(next))
    }
  }

  const addItem = async (product: Product, quantity: number) => {
    if (!user) return
    await apiClient.carts.addProduct(user.id, product.ProductId, quantity)
    const existing = items.find((i) => i.productId === product.ProductId)
    const next = existing
      ? items.map((i) =>
          i.productId === product.ProductId ? { ...i, quantity: i.quantity + quantity } : i
        )
      : [
          ...items,
          {
            productId: product.ProductId,
            storeId: product.StoreId,
            name: product.Name,
            price: Number(product.Price),
            quantity,
          },
        ]
    persist(next)
  }

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) return
    await apiClient.carts.modifyQuantity(user.id, productId, quantity)
    persist(items.map((i) => (i.productId === productId ? { ...i, quantity } : i)))
  }

  const removeItem = async (productId: string) => {
    if (!user) return
    await apiClient.carts.removeProduct(user.id, productId)
    persist(items.filter((i) => i.productId !== productId))
  }

  const clear = async () => {
    if (!user) return
    await apiClient.carts.clear(user.id)
    persist([])
  }

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clear, subtotal }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart debe ser utilizado dentro de un CartProvider")
  }
  return context
}
