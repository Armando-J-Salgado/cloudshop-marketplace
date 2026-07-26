import React, { useState } from "react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { Trash2, ArrowRight, AlertCircle } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { ApiError } from "@/services/apiClient"

export function Cart() {
  const { items, updateQuantity, removeItem, subtotal } = useCart()
  const [error, setError] = useState<string | null>(null)

  const handleQuantity = async (productId: string, quantity: number) => {
    if (quantity < 1) return
    try {
      await updateQuantity(productId, quantity)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al actualizar la cantidad")
    }
  }

  const handleRemove = async (productId: string) => {
    try {
      await removeItem(productId)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al eliminar el producto")
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Carrito de Compras"
        description="Revisa los productos seleccionados antes de proceder con el pedido"
      />

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Tu carrito está vacío.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.productId}
                className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 shadow-xs"
              >
                <div className="h-16 w-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                  {item.productId.slice(0, 4).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-sm truncate">{item.name}</h3>
                  <p className="text-xs font-extrabold text-primary mt-0.5">${item.price.toFixed(2)}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-border rounded-xl bg-background overflow-hidden text-xs">
                    <button
                      onClick={() => handleQuantity(item.productId, item.quantity - 1)}
                      className="px-2.5 py-1 font-bold hover:bg-muted"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 font-bold">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantity(item.productId, item.quantity + 1)}
                      className="px-2.5 py-1 font-bold hover:bg-muted"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemove(item.productId)}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-fit space-y-4">
            <h3 className="text-base font-bold text-foreground pb-3 border-b border-border">Resumen del Pedido</h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-sm font-extrabold text-foreground pt-3 border-t border-border">
                <span>Total:</span>
                <span className="text-base text-primary">${subtotal.toFixed(2)}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="w-full py-3 px-4 rounded-xl bg-accent text-accent-foreground font-bold text-xs shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-4"
            >
              Confirmar e ir a Checkout <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
