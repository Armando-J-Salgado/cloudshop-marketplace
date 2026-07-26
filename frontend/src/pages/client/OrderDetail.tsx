import React, { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { ArrowLeft, Ban } from "lucide-react"

export function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>()
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [status, setStatus] = useState("CREADO")

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
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              status === "CANCELADO"
                ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
            }`}
          >
            {status}
          </span>
        }
      />

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
        {/* Customer Order Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground font-medium">Tienda proveedora</span>
            <p className="font-bold text-foreground text-sm mt-0.5">Tienda Tech Central (store-001)</p>
          </div>
          <div>
            <span className="text-muted-foreground font-medium">Fecha de Emisión</span>
            <p className="font-bold text-foreground text-sm mt-0.5">25 de Julio, 2026</p>
          </div>
        </div>

        {/* Product Items */}
        <div className="border-t border-border pt-4 space-y-3">
          <h4 className="font-bold text-foreground text-sm">Productos solicitados</h4>
          <div className="p-3 bg-muted/40 rounded-xl border border-border flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-foreground">Laptop Gamer Ultra 16GB</p>
              <p className="text-muted-foreground text-[11px]">Cantidad: 1 x $1,299.99</p>
            </div>
            <span className="font-extrabold text-foreground">$1,299.99</span>
          </div>

          <div className="p-3 bg-muted/40 rounded-xl border border-border flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-foreground">Audífonos Bluetooth noise cancelling</p>
              <p className="text-muted-foreground text-[11px]">Cantidad: 2 x $129.99</p>
            </div>
            <span className="font-extrabold text-foreground">$259.98</span>
          </div>
        </div>

        <div className="border-t border-border pt-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground">Monto Total:</span>
            <p className="text-xl font-black text-foreground">$1,574.97 USD</p>
          </div>

          {status === "CREADO" && (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-600 font-bold text-xs hover:bg-rose-500/20 transition-colors"
            >
              <Ban className="h-4 w-4" /> Cancelar Pedido
            </button>
          )}
        </div>
      </div>

      {/* AlertDialog Cancellation Confirmation */}
      {isCancelModalOpen && (
        <>
          <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50" onClick={() => setIsCancelModalOpen(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">¿Confirmar cancelación de pedido?</h3>
            <p className="text-xs text-muted-foreground">
              Esta acción solicitará la cancelación del pedido <strong>{orderId}</strong> y liberará la orden en la tienda.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted"
              >
                Volver
              </button>
              <button
                onClick={() => {
                  setStatus("CANCELADO")
                  setIsCancelModalOpen(false)
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs shadow-md hover:opacity-90 transition-opacity"
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
