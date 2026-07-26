import React, { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { useRole } from "@/context/RoleContext"
import { ArrowLeft, CheckCircle2, XCircle, Truck, PackageCheck } from "lucide-react"

export function PedidoTiendaDetallePage() {
  const { customerId, orderId } = useParams<{ customerId: string; orderId: string }>()
  const { operatorStoreId } = useRole()
  const [status, setStatus] = useState("CREADO")

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link
        to="/operacion/pedidos"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a pedidos de tienda
      </Link>

      <PageHeader
        title={`Atención de Orden: ${orderId}`}
        description={`Tienda: ${operatorStoreId} • Partition Key (CustomerId): ${customerId}`}
        badge={
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              status === "COMPLETADO"
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                : status === "CANCELADO"
                ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
            }`}
          >
            {status}
          </span>
        }
      />

      <div className="bento-cell space-y-6">
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Acciones de Gestión de Operador
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setStatus("EN_PREPARACION")}
              className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                status === "EN_PREPARACION"
                  ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              <PackageCheck className="h-5 w-5 text-amber-500" />
              <div>
                <div className="text-xs font-bold">Aceptar y Preparar</div>
                <div className="text-[10px] text-muted-foreground">EN_PREPARACION</div>
              </div>
            </button>

            <button
              onClick={() => setStatus("ENVIADO")}
              className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                status === "ENVIADO"
                  ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              <Truck className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-xs font-bold">Despachar Pedido</div>
                <div className="text-[10px] text-muted-foreground">ENVIADO</div>
              </div>
            </button>

            <button
              onClick={() => setStatus("CANCELADO")}
              className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                status === "CANCELADO"
                  ? "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              <XCircle className="h-5 w-5 text-rose-500" />
              <div>
                <div className="text-xs font-bold">Rechazar / Cancelar</div>
                <div className="text-[10px] text-muted-foreground">CANCELADO</div>
              </div>
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-border space-y-2 text-xs">
          <h4 className="font-bold text-foreground">Items a empacar</h4>
          <div className="p-3 bg-muted/40 rounded-xl border border-border flex justify-between">
            <span>1x Laptop Gamer Ultra 16GB</span>
            <span className="font-bold">$1,299.99</span>
          </div>
          <div className="p-3 bg-muted/40 rounded-xl border border-border flex justify-between">
            <span>2x Audífonos Bluetooth Noise Cancelling</span>
            <span className="font-bold">$259.98</span>
          </div>
        </div>
      </div>
    </div>
  )
}
