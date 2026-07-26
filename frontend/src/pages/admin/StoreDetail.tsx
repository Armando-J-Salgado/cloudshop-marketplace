import React, { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { ArrowLeft, Edit, Trash2, AlertCircle } from "lucide-react"
import { apiClient, ApiError, type Store } from "@/services/apiClient"

export function StoreDetail() {
  const { storeId } = useParams<{ storeId: string }>()
  const [store, setStore] = useState<Store | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)

  useEffect(() => {
    if (!storeId) return
    apiClient.stores.get(storeId)
      .then((res) => setStore(res.store))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Error al cargar tienda"))
      .finally(() => setIsLoading(false))
  }, [storeId])

  const handleDeactivate = async () => {
    if (!storeId) return
    setIsDeactivating(true)
    try {
      await apiClient.stores.delete(storeId)
      setStore((prev) => prev ? { ...prev, Status: "INACTIVE" } : prev)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al desactivar tienda")
    } finally {
      setIsDeactivating(false)
    }
  }

  if (isLoading) return <p className="text-xs text-muted-foreground p-6">Cargando tienda...</p>

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/admin/tiendas"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver a tiendas
      </Link>

      <PageHeader
        title={store?.Name || `Tienda: ${storeId}`}
        description={store?.Description || ""}
        badge={store && (
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${store.Status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border border-rose-500/20"}`}>
            {store.Status}
          </span>
        )}
      />

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span>
        </div>
      )}

      {store && (
        <div className="bento-cell space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground font-medium">Store ID</span>
              <p className="font-mono font-bold text-foreground mt-0.5">{store.StoreId}</p>
            </div>
            <div>
              <span className="text-muted-foreground font-medium">Owner ID (Operador)</span>
              <p className="font-mono font-bold text-foreground mt-0.5">{store.OwnerId}</p>
            </div>
            <div>
              <span className="text-muted-foreground font-medium">Email</span>
              <p className="font-bold text-foreground mt-0.5">{store.Email}</p>
            </div>
            <div>
              <span className="text-muted-foreground font-medium">Teléfono</span>
              <p className="font-bold text-foreground mt-0.5">{store.Phone}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-muted-foreground font-medium">Dirección</span>
              <p className="font-bold text-foreground mt-0.5">{store.Address}</p>
            </div>
            <div>
              <span className="text-muted-foreground font-medium">Creada</span>
              <p className="font-semibold text-foreground mt-0.5">{new Date(store.CreatedAt).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground font-medium">Última actualización</span>
              <p className="font-semibold text-foreground mt-0.5">{new Date(store.UpdatedAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between">
            <Link to={`/admin/tiendas/${storeId}/editar`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary font-semibold text-xs hover:bg-primary/20 transition-colors">
              <Edit className="h-4 w-4" /> Editar Tienda
            </Link>
            {store.Status === "ACTIVE" && (
              <button onClick={handleDeactivate} disabled={isDeactivating}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-600 font-semibold text-xs hover:bg-rose-500/20 transition-colors disabled:opacity-50">
                <Trash2 className="h-4 w-4" /> {isDeactivating ? "Desactivando..." : "Desactivar Tienda"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
