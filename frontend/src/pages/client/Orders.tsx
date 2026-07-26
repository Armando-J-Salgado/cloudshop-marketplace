import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { Eye, AlertCircle } from "lucide-react"
import { apiClient, ApiError, type Order } from "@/services/apiClient"

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    apiClient.orders
      .list()
      .then((result) => {
        if (!cancelled) setOrders(result.orders)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Error al cargar los pedidos")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Mis Pedidos"
        description="Historial y estado de tus compras realizadas en CloudShop"
      />

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Cargando pedidos...</p>
      ) : orders.length === 0 ? (
        <p className="text-xs text-muted-foreground">Todavía no tienes pedidos.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div
              key={o.OrderId}
              className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-foreground text-sm">{o.OrderId}</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      o.Status === "DELIVERED"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : o.Status === "CANCELLED"
                          ? "bg-rose-500/10 text-rose-600"
                          : "bg-blue-500/10 text-blue-600"
                    }`}
                  >
                    {o.Status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tienda: <strong>{o.StoreId}</strong> • Realizado el {new Date(o.CreatedAt).toLocaleDateString()}
                </p>
                <p className="text-sm font-extrabold text-foreground">${Number(o.Total).toFixed(2)} USD</p>
              </div>

              <Link
                to={`/pedidos/${o.OrderId}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary font-semibold text-xs hover:bg-primary/20 transition-colors w-fit"
              >
                <Eye className="h-4 w-4" /> Detalle del Pedido
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
