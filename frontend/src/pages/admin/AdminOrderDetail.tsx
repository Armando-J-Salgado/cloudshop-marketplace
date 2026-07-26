import React, { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { ArrowLeft, Save, AlertCircle } from "lucide-react"
import { apiClient, ApiError, type Order } from "@/services/apiClient"

const STATUS_OPTIONS = ["CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED"]

export function AdminOrderDetail() {
  const { customerId, orderId } = useParams<{ customerId: string; orderId: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [selectedStatus, setSelectedStatus] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) return
    apiClient.orders.get(orderId)
      .then((o) => { setOrder(o); setSelectedStatus(o.Status) })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Error al cargar pedido"))
      .finally(() => setIsLoading(false))
  }, [orderId])

  const handleUpdateStatus = async () => {
    if (!orderId || !customerId || !selectedStatus) return
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)
    try {
      const updated = await apiClient.orders.updateStatus(orderId, customerId, selectedStatus)
      setOrder(updated)
      setSuccess(`Estado actualizado a ${selectedStatus}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al actualizar estado")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <p className="text-xs text-muted-foreground p-6">Cargando pedido...</p>

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/admin/pedidos"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver a pedidos globales
      </Link>

      <PageHeader
        title={`Administrar Pedido: ${orderId?.slice(0, 8)}...`}
        description={`Cliente: ${customerId}`}
        badge={order && (
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            order.Status === "CANCELLED" ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
            : order.Status === "DELIVERED" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pb-4 border-b border-border">
            <div>
              <span className="text-muted-foreground font-medium">Tienda</span>
              <p className="font-mono font-bold text-foreground mt-0.5">{order.StoreId}</p>
            </div>
            <div>
              <span className="text-muted-foreground font-medium">Total</span>
              <p className="font-bold text-foreground mt-0.5">${Number(order.Total).toFixed(2)}</p>
            </div>
            <div>
              <span className="text-muted-foreground font-medium">Fecha</span>
              <p className="font-semibold text-foreground mt-0.5">{new Date(order.CreatedAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-foreground">Items del pedido</h4>
            {order.Items.map((item) => (
              <div key={item.ProductId} className="p-3 bg-muted/40 rounded-xl border border-border flex justify-between text-xs">
                <div>
                  <p className="font-bold text-foreground">{item.Name}</p>
                  <p className="text-muted-foreground">Cantidad: {item.Quantity} x ${Number(item.Price).toFixed(2)}</p>
                </div>
                <span className="font-extrabold text-foreground">${(Number(item.Price) * item.Quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {order.Status !== "CANCELLED" && order.Status !== "DELIVERED" && (
            <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Actualizar Estado</h4>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((st) => (
                  <button key={st} type="button" onClick={() => setSelectedStatus(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedStatus === st ? "bg-primary text-primary-foreground shadow-xs" : "bg-background border border-border text-foreground hover:bg-muted"
                    }`}>{st}</button>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={handleUpdateStatus} disabled={isSubmitting || selectedStatus === order.Status}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:opacity-90 disabled:opacity-50">
                  <Save className="h-4 w-4" /> {isSubmitting ? "Guardando..." : "Guardar Estado"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
