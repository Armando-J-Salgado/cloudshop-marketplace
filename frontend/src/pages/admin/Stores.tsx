import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { Plus, Eye, Search, RefreshCw, AlertCircle } from "lucide-react"
import { apiClient, ApiError, type Store } from "@/services/apiClient"

export function Stores() {
  const [stores, setStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStores = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await apiClient.stores.list({ limit: 50 })
      setStores(result.stores)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cargar tiendas")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStores()
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Tiendas"
        description="Administración de tiendas registradas en la plataforma"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={fetchStores}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <Link
              to="/admin/tiendas/nueva"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" /> Crear Tienda
            </Link>
          </div>
        }
      />

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bento-cell space-y-4">
        <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-xl border border-border max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre o ID..."
            className="w-full text-xs bg-transparent focus:outline-none"
          />
        </div>

        {isLoading ? (
          <p className="text-xs text-muted-foreground">Cargando tiendas...</p>
        ) : stores.length === 0 ? (
          <p className="text-xs text-muted-foreground">No hay tiendas registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-3 px-4 font-semibold">ID Tienda</th>
                  <th className="py-3 px-4 font-semibold">Nombre</th>
                  <th className="py-3 px-4 font-semibold">Operador (OwnerId)</th>
                  <th className="py-3 px-4 font-semibold">Email</th>
                  <th className="py-3 px-4 font-semibold">Estado</th>
                  <th className="py-3 px-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stores.map((s) => (
                  <tr key={s.StoreId} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-foreground text-[11px]">{s.StoreId.slice(0, 8)}...</td>
                    <td className="py-3 px-4 font-semibold text-foreground">{s.Name}</td>
                    <td className="py-3 px-4 font-mono text-muted-foreground text-[11px]">{s.OwnerId?.slice(0, 12)}...</td>
                    <td className="py-3 px-4 text-muted-foreground">{s.Email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.Status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                        }`}
                      >
                        {s.Status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Link
                        to={`/admin/tiendas/${s.StoreId}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors"
                      >
                        <Eye className="h-3 w-3" /> Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
