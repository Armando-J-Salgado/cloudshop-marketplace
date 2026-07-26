import React, { useState } from "react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { Trash2, ArrowRight, Store } from "lucide-react"

export function Cart() {
  const [items, setItems] = useState([
    { id: "PROD-001", storeId: "store-001", storeName: "Tienda Tech Central", name: "Laptop Gamer Ultra", price: 1299.99, quantity: 1 },
    { id: "PROD-002", storeId: "store-001", storeName: "Tienda Tech Central", name: "Audífonos Bluetooth Noise Cancelling", price: 129.99, quantity: 2 },
  ])

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Carrito de Compras"
        description="Revisa los productos seleccionados antes de proceder con el pedido"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 shadow-xs"
            >
              <div className="h-16 w-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                PROD
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Store className="h-3 w-3" /> {item.storeName}
                </div>
                <h3 className="font-bold text-foreground text-sm truncate">{item.name}</h3>
                <p className="text-xs font-extrabold text-primary mt-0.5">${item.price.toFixed(2)}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center border border-border rounded-xl bg-background overflow-hidden text-xs">
                  <button
                    onClick={() =>
                      setItems(
                        items.map((i) =>
                          i.id === item.id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i
                        )
                      )
                    }
                    className="px-2.5 py-1 font-bold hover:bg-muted"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 font-bold">{item.quantity}</span>
                  <button
                    onClick={() =>
                      setItems(
                        items.map((i) =>
                          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                        )
                      )
                    }
                    className="px-2.5 py-1 font-bold hover:bg-muted"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => setItems(items.filter((i) => i.id !== item.id))}
                  className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-fit space-y-4">
          <h3 className="text-base font-bold text-foreground pb-3 border-b border-border">Resumen del Pedido</h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span className="font-semibold text-foreground">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Envío estimado:</span>
              <span className="font-semibold text-foreground">$15.00</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-foreground pt-3 border-t border-border">
              <span>Total:</span>
              <span className="text-base text-primary">${(subtotal + 15).toFixed(2)}</span>
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
    </div>
  )
}
