import React, { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { ShoppingCart, ArrowLeft, Store, Package, AlertCircle } from "lucide-react"
import { apiClient, ApiError, type Product } from "@/services/apiClient"
import { useAuth } from "@/hooks/useAuth"
import { useCart } from "@/context/CartContext"

export function ProductDetail() {
  const { storeId, productId } = useParams<{ storeId: string; productId: string }>()
  const { user } = useAuth()
  const { addItem } = useCart()
  const navigate = useNavigate()
  const [quantity, setQuantity] = useState(1)
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    if (!storeId || !productId) return
    let cancelled = false
    setIsLoading(true)
    apiClient.products
      .get(storeId, productId)
      .then((result) => {
        if (!cancelled) setProduct(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Error al cargar el producto")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [storeId, productId])

  const handleAddToCart = async () => {
    if (!user || !product) return
    setIsAdding(true)
    setError(null)
    try {
      await addItem(product, quantity)
      navigate("/carrito")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al agregar el producto al carrito")
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        to="/catalogo"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al catálogo
      </Link>

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Cargando producto...</p>
      ) : !product ? (
        <p className="text-xs text-muted-foreground">Producto no encontrado.</p>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-72 sm:h-96 rounded-2xl bg-muted/60 flex items-center justify-center border border-border">
            <div className="h-32 w-32 rounded-3xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-3xl shadow-xs">
              <Package className="h-16 w-16" />
            </div>
          </div>

          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {product.Name}
              </h1>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Store className="h-4 w-4" /> Vendido por: <strong className="text-foreground">{product.StoreId}</strong>
              </div>

              <div className="text-3xl font-black text-foreground pt-2">
                ${Number(product.Price).toFixed(2)} <span className="text-xs text-muted-foreground font-normal">USD</span>
              </div>

              <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                Stock disponible: {product.Stock}
              </p>
            </div>

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

              <button
                onClick={handleAddToCart}
                disabled={isAdding || product.Status !== "ACTIVE"}
                className="w-full py-3 px-6 rounded-xl bg-accent text-accent-foreground font-bold text-sm shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShoppingCart className="h-5 w-5" /> Agregar al Carrito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
