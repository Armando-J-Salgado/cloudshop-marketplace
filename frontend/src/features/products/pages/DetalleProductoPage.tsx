import React, { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { ShoppingCart, ArrowLeft, Star, Store, ShieldCheck, Truck } from "lucide-react"

export function DetalleProductoPage() {
  const { storeId, productId } = useParams<{ storeId: string; productId: string }>()
  const [quantity, setQuantity] = useState(1)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        to="/catalogo"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al catálogo
      </Link>

      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image Placeholder */}
        <div className="h-72 sm:h-96 rounded-2xl bg-muted/60 flex items-center justify-center border border-border">
          <div className="h-32 w-32 rounded-3xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-3xl">
            CS
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                Electrónica
              </span>
              <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
                <Star className="h-4 w-4 fill-amber-500" /> 4.9 (124 reseñas)
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Laptop Gamer Ultra High Performance
            </h1>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Store className="h-4 w-4" /> Vendido por: <strong className="text-foreground">{storeId}</strong>
            </div>

            <div className="text-3xl font-black text-foreground pt-2">
              $1,299.99 <span className="text-xs text-muted-foreground font-normal">USD</span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border">
              Procesador de última generación, 16GB RAM DDR5, SSD NVMe 1TB y tarjeta gráfica dedicada. Diseñada para alto rendimiento y multitarea intensiva.
            </p>
          </div>

          {/* Purchasing Options */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-foreground">Cantidad:</span>
              <div className="flex items-center border border-border rounded-xl bg-background overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-xs font-bold hover:bg-muted"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-xs font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1.5 text-xs font-bold hover:bg-muted"
                >
                  +
                </button>
              </div>
            </div>

            <button className="w-full py-3 px-6 rounded-xl bg-accent text-accent-foreground font-bold text-sm shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <ShoppingCart className="h-5 w-5" /> Agregar al Carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
