import React, { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { ArrowLeft, Save } from "lucide-react"

export function AdminOrderDetail() {
  const { customerId, orderId } = useParams<{ customerId: string; orderId: string }>()
  const [currentStatus, setCurrentStatus] = useState("EN_PREPARACION")

  const statusOptions = ["CREADO", "EN_PREPARACION", "ENVIADO", "COMPLETADO", "CANCELADO"]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link
        to="/admin/pedidos"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a pedidos globales
      </Link>

      <PageHeader
        title={`Administrar Pedido: ${orderId}`}
        description={`Cliente PK: ${customerId}`}
      />

      <div className="bento-cell space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pb-4 border-b border-border">
          <div>
            <span className="text-muted-foreground font-medium">ID del Pedido</span>
            <p className="font-mono font-bold text-foreground mt-0.5">{orderId}</p>
          </div>
          <div>
            <span className="text-muted-foreground font-medium">CustomerId (PK DynamoDB)</span>
            <p className="font-mono font-bold text-foreground mt-0.5">{customerId}</p>
          </div>
          <div>
            <span className="text-muted-foreground font-medium">Tienda</span>
            <p className="font-bold text-foreground mt-0.5">store-001</p>
          </div>
        </div>

        {/* Change Status Control */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Actualizar Estado del Pedido
          </h4>

          <div className="flex flex-wrap gap-2">
            {statusOptions.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setCurrentStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  currentStatus === st
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-background border border-border text-foreground hover:bg-muted"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => alert(`Estado actualizado a ${currentStatus}`)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:opacity-90 transition-opacity"
          >
            <Save className="h-4 w-4" /> Guardar Estado
          </button>
        </div>
      </div>
    </div>
  )
}
