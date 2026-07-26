import React from "react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { Search, Eye, Filter } from "lucide-react"

export function AdminPedidosPage() {
  const orders = [
    { id: "ord-88392", customerId: "usr-003", customerEmail: "maria@gmail.com", date: "25 Jul 2026", total: 1574.97, status: "CREADO", storeId: "store-001" },
    { id: "ord-88301", customerId: "usr-003", customerEmail: "maria@gmail.com", date: "18 Jul 2026", total: 249.50, status: "COMPLETADO", storeId: "store-002" },
    { id: "ord-88250", customerId: "usr-004", customerEmail: "roberto@gmail.com", date: "10 Jul 2026", total: 89.90, status: "EN_PREPARACION", storeId: "store-003" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consulta Global de Pedidos"
        description="Listado general de pedidos de todas las tiendas de la plataforma"
      />

      <div className="bento-cell space-y-4">
        <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-xl border border-border max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por ID de pedido, cliente o tienda..."
            className="w-full text-xs bg-transparent focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-3 px-4 font-semibold">ID Pedido</th>
                <th className="py-3 px-4 font-semibold">Cliente (Partition Key)</th>
                <th className="py-3 px-4 font-semibold">Tienda</th>
                <th className="py-3 px-4 font-semibold">Fecha</th>
                <th className="py-3 px-4 font-semibold">Total</th>
                <th className="py-3 px-4 font-semibold">Estado</th>
                <th className="py-3 px-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-foreground">{o.id}</td>
                  <td className="py-3 px-4 font-mono text-muted-foreground">{o.customerId}</td>
                  <td className="py-3 px-4">{o.storeId}</td>
                  <td className="py-3 px-4">{o.date}</td>
                  <td className="py-3 px-4 font-bold text-foreground">${o.total.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        o.status === "COMPLETADO"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : o.status === "EN_PREPARACION"
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-blue-500/10 text-blue-600"
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/admin/pedidos/${o.customerId}/${o.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors"
                    >
                      <Eye className="h-3 w-3" /> Gestionar
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
