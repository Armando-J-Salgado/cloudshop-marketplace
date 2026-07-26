import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { Store as StoreIcon, AlertCircle } from "lucide-react"
import { apiClient, ApiError, type Store } from "@/services/apiClient"

export function Stores() {
  const [stores, setStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiClient.stores.list({ limit: 50 })
      .then((res) => setStores(res.stores.filter((s) => s.Status === "ACTIVE")))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Error al cargar tiendas"))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tiendas Registradas"
        description="Explora las tiendas activas del marketplace CloudShop"
      />

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Cargando tiendas...</p>
      ) : stores.length === 0 ? (
        <p className="text-xs text-muted-foreground">No hay tiendas disponibles actualmente.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((store) => (
            <Link
              key={store.StoreId}
              to={`/tiendas/${store.StoreId}`}
              className="p-5 bg-card border border-border rounded-2xl shadow-xs hover:shadow-md hover:border-primary/30 transition-all space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <StoreIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-foreground truncate">{store.Name}</h3>
                  <p className="text-[11px] text-muted-foreground">{store.Email}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{store.Description}</p>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">{store.Address}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">Activa</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
