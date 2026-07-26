import React from "react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { useAuth } from "@/hooks/useAuth"
import { Search, Eye } from "lucide-react"

export function StoreOrders() {
  const { user } = useAuth()
  const operatorStoreId = user?.storeId || "store-001"

  const storeOrders = [
    { id: "ord-88392", customerId: "usr-cli-001", customerEmail: "cliente@cloudshop.test", date: "25 Jul 2026", total: 1574.97, status: "CREADO" },
    { id: "ord-88301", customerId: "usr-cli-001", customerEmail: "cliente@cloudshop.test", date: "18 Jul 2026", total: 249.50, status: "COMPLETADO" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos de la Tienda"
        description={`Gestión y despacho de órdenes asignadas a la tienda ${operatorStoreId}`}
      />

      <div className="bento-cell space-y-4">
        <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-xl border border-border max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar pedido por ID..."
            className="w-full text-xs bg-transparent focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-3 px-4 font-semibold">ID Pedido</th>
                <th className="py-3 px-4 font-semibold">Cliente (PK)</th>
                <th className="py-3 px-4 font-semibold">Fecha</th>
                <th className="py-3 px-4 font-semibold">Total</th>
                <th className="py-3 px-4 font-semibold">Estado</th>
                <th className="py-3 px-4 font-semibold text-right">Acciones Operador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {storeOrders.map((o) => (
                <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-foreground">{o.id}</td>
                  <td className="py-3 px-4 font-mono text-muted-foreground">{o.customerId}</td>
                  <td className="py-3 px-4">{o.date}</td>
                  <td className="py-3 px-4 font-bold text-foreground">${o.total.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        o.status === "COMPLETADO"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-blue-500/10 text-blue-600"
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/operacion/pedidos/${o.customerId}/${o.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-500/20 transition-colors"
                    >
                      <Eye className="h-3 w-3" /> Procesar Orden
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
