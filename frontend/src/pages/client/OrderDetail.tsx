import React, { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { ArrowLeft, Ban, AlertCircle } from "lucide-react"
import { apiClient, ApiError, type Order } from "@/services/apiClient"

export function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    if (!orderId) return
    let cancelled = false
    apiClient.orders
      .get(orderId)
      .then((result) => {
        if (!cancelled) setOrder(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Error al cargar el pedido")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [orderId])

  const handleCancel = async () => {
    if (!orderId) return
    setIsCancelling(true)
    try {
      const result = await apiClient.orders.cancel(orderId)
      setOrder(result.order)
      setIsCancelModalOpen(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cancelar el pedido")
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link
        to="/pedidos"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a mis pedidos
      </Link>

      <PageHeader
        title={`Pedido: ${orderId}`}
        description="Información detallada sobre tu compra y estado de entrega"
        badge={
          order && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                order.Status === "CANCELLED"
                  ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                  : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
              }`}
            >
              {order.Status}
            </span>
          )
        }
      />

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Cargando pedido...</p>
      ) : !order ? (
        <p className="text-xs text-muted-foreground">Pedido no encontrado.</p>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground font-medium">Tienda proveedora</span>
              <p className="font-bold text-foreground text-sm mt-0.5">{order.StoreId}</p>
            </div>
            <div>
              <span className="text-muted-foreground font-medium">Fecha de Emisión</span>
              <p className="font-bold text-foreground text-sm mt-0.5">
                {new Date(order.CreatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <h4 className="font-bold text-foreground text-sm">Productos solicitados</h4>
            {order.Items.map((item) => (
              <div
                key={item.ProductId}
                className="p-3 bg-muted/40 rounded-xl border border-border flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-foreground">{item.Name}</p>
                  <p className="text-muted-foreground text-[11px]">
                    Cantidad: {item.Quantity} x ${Number(item.Price).toFixed(2)}
                  </p>
                </div>
                <span className="font-extrabold text-foreground">
                  ${(Number(item.Price) * item.Quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground">Monto Total:</span>
              <p className="text-xl font-black text-foreground">${Number(order.Total).toFixed(2)} USD</p>
            </div>

            {(order.Status === "PENDING" || order.Status === "CONFIRMED") && (
              <button
                onClick={() => setIsCancelModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-600 font-bold text-xs hover:bg-rose-500/20 transition-colors"
              >
                <Ban className="h-4 w-4" /> Cancelar Pedido
              </button>
            )}
          </div>
        </div>
      )}

      {isCancelModalOpen && (
        <>
          <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50" onClick={() => setIsCancelModalOpen(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">¿Confirmar cancelación de pedido?</h3>
            <p className="text-xs text-muted-foreground">
              Esta acción solicitará la cancelación del pedido <strong>{orderId}</strong>.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted"
              >
                Volver
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Sí, cancelar pedido
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
