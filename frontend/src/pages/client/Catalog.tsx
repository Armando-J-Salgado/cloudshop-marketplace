import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { Search, ShoppingCart, Eye, Package, AlertCircle } from "lucide-react"
import { apiClient, ApiError, type Product } from "@/services/apiClient"
import { useAuth } from "@/hooks/useAuth"
import { useCart } from "@/context/CartContext"

export function Catalog() {
  const { user } = useAuth()
  const { addItem } = useCart()
  const [search, setSearch] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addingId, setAddingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    apiClient.products
      .list()
      .then((result) => {
        if (!cancelled) setProducts(result.products)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Error al cargar el catálogo")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = products.filter((p) =>
    p.Name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddToCart = async (product: Product) => {
    if (!user) return
    setAddingId(product.ProductId)
    try {
      await addItem(product, 1)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al agregar el producto al carrito")
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogo de Productos"
        description="Explora productos comercializados por nuestras tiendas asociadas"
      />

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos por nombre..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Cargando productos...</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground">No se encontraron productos.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((p) => (
            <div
              key={`${p.StoreId}-${p.ProductId}`}
              className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="h-48 bg-muted/60 relative flex items-center justify-center p-4">
                  <div className="h-20 w-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-lg group-hover:scale-110 transition-transform shadow-xs">
                    <Package className="h-10 w-10" />
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-foreground text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {p.Name}
                  </h3>
                </div>
              </div>

              <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-border/50 mt-2">
                <div>
                  <span className="text-xs text-muted-foreground block">Precio</span>
                  <span className="text-lg font-extrabold text-foreground">${Number(p.Price).toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Link
                    to={`/catalogo/${p.StoreId}/${p.ProductId}`}
                    className="p-2 rounded-xl border border-border hover:bg-muted text-foreground transition-colors"
                    title="Ver detalle"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleAddToCart(p)}
                    disabled={addingId === p.ProductId}
                    className="p-2 rounded-xl bg-accent text-accent-foreground font-semibold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                    title="Agregar al carrito"
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
