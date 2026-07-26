import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { useAuth } from "@/hooks/useAuth"
import { Eye, RefreshCw, AlertCircle } from "lucide-react"
import { apiClient, ApiError, type Order } from "@/services/apiClient"

export function StoreOrders() {
  const { user } = useAuth()
  const operatorStoreId = user?.storeId || ""
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await apiClient.orders.list({ limit: 50 })
      // Filter orders belonging to this operator's store
      setOrders(result.orders.filter((o) => o.StoreId === operatorStoreId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cargar pedidos")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [operatorStoreId])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos de la Tienda"
        description={`Gestión y despacho de órdenes para la tienda ${operatorStoreId || "(sin asignar)"}`}
        action={
          <button onClick={fetchOrders} disabled={isLoading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        }
      />

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span>
        </div>
      )}

      <div className="bento-cell space-y-4">
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Cargando pedidos...</p>
        ) : orders.length === 0 ? (
          <p className="text-xs text-muted-foreground">No hay pedidos para esta tienda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-3 px-4 font-semibold">ID Pedido</th>
                  <th className="py-3 px-4 font-semibold">Cliente</th>
                  <th className="py-3 px-4 font-semibold">Fecha</th>
                  <th className="py-3 px-4 font-semibold">Total</th>
                  <th className="py-3 px-4 font-semibold">Estado</th>
                  <th className="py-3 px-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((o) => (
                  <tr key={`${o.CustomerId}-${o.OrderId}`} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-foreground text-[11px]">{o.OrderId.slice(0, 8)}...</td>
                    <td className="py-3 px-4 font-mono text-muted-foreground text-[11px]">{o.CustomerId.slice(0, 12)}...</td>
                    <td className="py-3 px-4">{new Date(o.CreatedAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-bold text-foreground">${Number(o.Total).toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        o.Status === "DELIVERED" ? "bg-emerald-500/10 text-emerald-600"
                        : o.Status === "CANCELLED" ? "bg-rose-500/10 text-rose-600"
                        : "bg-blue-500/10 text-blue-600"
                      }`}>{o.Status}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link to={`/operacion/pedidos/${o.CustomerId}/${o.OrderId}`}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-500/20 transition-colors">
                        <Eye className="h-3 w-3" /> Procesar
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
