import React from "react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { PagePlaceholder } from "@/components/common/PagePlaceholder"
import { Plus, Eye } from "lucide-react"

export function AdminTiendasPage() {
  const stores = [
    { id: "store-001", name: "Tienda Tech Central", ownerId: "usr-002", status: "Activa" },
    { id: "store-002", name: "Hogar & Confort", ownerId: "usr-007", status: "Activa" },
    { id: "store-003", name: "Sporting Goods", ownerId: "usr-006", status: "Inactiva" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Tiendas"
        description="Módulo de administración de tiendas registradas"
        action={
          <Link
            to="/admin/tiendas/nueva"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Crear Tienda
          </Link>
        }
      />

      <PagePlaceholder
        title="Consulta y Administración de Tiendas"
        module="Tiendas (Módulo 3)"
        status="Sin backend"
      />

      <div className="bento-cell space-y-4">
        <h3 className="text-base font-bold text-foreground">Tiendas Registradas (Demo)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-3 px-4 font-semibold">ID Tienda</th>
                <th className="py-3 px-4 font-semibold">Nombre</th>
                <th className="py-3 px-4 font-semibold">Operador OwnerId</th>
                <th className="py-3 px-4 font-semibold">Estado</th>
                <th className="py-3 px-4 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stores.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-foreground">{s.id}</td>
                  <td className="py-3 px-4 font-semibold text-foreground">{s.name}</td>
                  <td className="py-3 px-4 font-mono text-muted-foreground">{s.ownerId}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.status === "Activa" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/admin/tiendas/${s.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors"
                    >
                      <Eye className="h-3 w-3" /> Ver / Asignar
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
