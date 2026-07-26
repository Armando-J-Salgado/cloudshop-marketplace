import React, { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { ArrowLeft, Store as StoreIcon, Package, AlertCircle } from "lucide-react"
import { apiClient, ApiError, type Store, type Product } from "@/services/apiClient"

export function StoreDetail() {
  const { storeId } = useParams<{ storeId: string }>()
  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!storeId) return
    setIsLoading(true)
    Promise.all([
      apiClient.stores.get(storeId).catch(() => null),
      apiClient.products.list({ storeId, limit: 50 }),
    ])
      .then(([storeRes, productsRes]) => {
        if (storeRes) setStore(storeRes.store)
        setProducts(productsRes.products.filter((p) => p.Status === "ACTIVE"))
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Error al cargar datos"))
      .finally(() => setIsLoading(false))
  }, [storeId])

  if (isLoading) return <p className="text-xs text-muted-foreground p-6">Cargando...</p>

  return (
    <div className="space-y-6">
      <Link to="/tiendas"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver a tiendas
      </Link>

      <PageHeader
        title={store?.Name || `Tienda: ${storeId}`}
        description={store?.Description || ""}
      />

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span>
        </div>
      )}

      {store && (
        <div className="p-4 bg-card border border-border rounded-2xl flex items-center gap-4 text-xs">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <StoreIcon className="h-6 w-6" />
          </div>
          <div className="space-y-0.5">
            <p className="text-muted-foreground">{store.Email} &bull; {store.Phone}</p>
            <p className="text-muted-foreground">{store.Address}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" /> Productos disponibles
        </h3>
        {products.length === 0 ? (
          <p className="text-xs text-muted-foreground">Esta tienda no tiene productos activos.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <Link
                key={p.ProductId}
                to={`/catalogo/${p.StoreId}/${p.ProductId}`}
                className="p-4 bg-card border border-border rounded-2xl hover:shadow-md hover:border-primary/30 transition-all space-y-2"
              >
                <h4 className="text-sm font-bold text-foreground truncate">{p.Name}</h4>
                <div className="flex justify-between text-xs">
                  <span className="font-extrabold text-primary">${Number(p.Price).toFixed(2)}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${p.Stock > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
                    {p.Stock > 0 ? `${p.Stock} un.` : "Agotado"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
