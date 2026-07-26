import React from "react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { ShoppingBag, Eye, Clock, CheckCircle } from "lucide-react"

export function MisPedidosPage() {
  const orders = [
    { id: "ord-88392", date: "25 Jul 2026", total: 1574.97, status: "CREADO", store: "Tienda Tech Central" },
    { id: "ord-88301", date: "18 Jul 2026", total: 249.50, status: "COMPLETADO", store: "Hogar & Confort" },
  ]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Mis Pedidos"
        description="Historial y estado de tus compras realizadas en CloudShop"
      />

      <div className="space-y-4">
        {orders.map((o) => (
          <div
            key={o.id}
            className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-foreground text-sm">{o.id}</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    o.status === "COMPLETADO"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-blue-500/10 text-blue-600"
                  }`}
                >
                  {o.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Tienda: <strong>{o.store}</strong> • Realizado el {o.date}
              </p>
              <p className="text-sm font-extrabold text-foreground">${o.total.toFixed(2)} USD</p>
            </div>

            <Link
              to={`/pedidos/${o.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary font-semibold text-xs hover:bg-primary/20 transition-colors w-fit"
            >
              <Eye className="h-4 w-4" /> Detalle del Pedido
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
