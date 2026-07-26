import React, { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { useAuth } from "@/hooks/useAuth"
import { ArrowLeft, XCircle, Truck, PackageCheck, AlertCircle } from "lucide-react"
import { apiClient, ApiError, type Order } from "@/services/apiClient"

export function UpdateOrderStatus() {
  const { customerId, orderId } = useParams<{ customerId: string; orderId: string }>()
  const { user } = useAuth()
  const operatorStoreId = user?.storeId || ""
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) return
    apiClient.orders.get(orderId)
      .then((o) => setOrder(o))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Error al cargar pedido"))
      .finally(() => setIsLoading(false))
  }, [orderId])

  const handleStatusChange = async (newStatus: string) => {
    if (!orderId || !customerId) return
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)
    try {
      const updated = await apiClient.orders.updateStatus(orderId, customerId, newStatus)
      setOrder(updated)
      setSuccess(`Estado actualizado a ${newStatus}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al actualizar estado")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <p className="text-xs text-muted-foreground p-6">Cargando pedido...</p>

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/operacion/pedidos"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver a pedidos de tienda
      </Link>

      <PageHeader
        title={`Atención de Orden: ${orderId?.slice(0, 8)}...`}
        description={`Tienda: ${operatorStoreId} | Cliente: ${customerId}`}
        badge={order && (
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            order.Status === "DELIVERED" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
            : order.Status === "CANCELLED" ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
            : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
          }`}>{order.Status}</span>
        )}
      />

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">{success}</div>
      )}

      {order && (
        <div className="bento-cell space-y-6">
          {order.Status !== "CANCELLED" && order.Status !== "DELIVERED" && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Acciones de Operador</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button onClick={() => handleStatusChange("CONFIRMED")} disabled={isSubmitting}
                  className="p-3 rounded-2xl border border-border bg-card text-foreground hover:bg-muted flex items-center gap-2.5 transition-all disabled:opacity-50">
                  <PackageCheck className="h-5 w-5 text-amber-500" />
                  <div><div className="text-xs font-bold">Confirmar</div><div className="text-[10px] text-muted-foreground">CONFIRMED</div></div>
                </button>
                <button onClick={() => handleStatusChange("PREPARING")} disabled={isSubmitting}
                  className="p-3 rounded-2xl border border-border bg-card text-foreground hover:bg-muted flex items-center gap-2.5 transition-all disabled:opacity-50">
                  <PackageCheck className="h-5 w-5 text-orange-500" />
                  <div><div className="text-xs font-bold">Preparar</div><div className="text-[10px] text-muted-foreground">PREPARING</div></div>
                </button>
                <button onClick={() => handleStatusChange("SHIPPED")} disabled={isSubmitting}
                  className="p-3 rounded-2xl border border-border bg-card text-foreground hover:bg-muted flex items-center gap-2.5 transition-all disabled:opacity-50">
                  <Truck className="h-5 w-5 text-blue-500" />
                  <div><div className="text-xs font-bold">Despachar</div><div className="text-[10px] text-muted-foreground">SHIPPED</div></div>
                </button>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-border space-y-2 text-xs">
            <h4 className="font-bold text-foreground">Items del pedido</h4>
            {order.Items.map((item) => (
              <div key={item.ProductId} className="p-3 bg-muted/40 rounded-xl border border-border flex justify-between">
                <span>{item.Quantity}x {item.Name}</span>
                <span className="font-bold">${(Number(item.Price) * item.Quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between font-extrabold text-foreground pt-2 border-t border-border">
              <span>Total:</span>
              <span>${Number(order.Total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
