import React from "react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { Users, Search, Shield, UserCheck, Eye } from "lucide-react"

export function ConsultaUsuariosPage() {
  const users = [
    { id: "usr-001", name: "Alexander Quinteros", email: "alex@cloudshop.com", role: "admin", status: "Activo" },
    { id: "usr-002", name: "Carlos Operador", email: "carlos@tiendacentral.com", role: "operator", status: "Activo" },
    { id: "usr-003", name: "María Cliente", email: "maria@gmail.com", role: "client", status: "Activo" },
    { id: "usr-004", name: "Roberto Inactivo", email: "roberto@gmail.com", role: "client", status: "Inactivo" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Usuarios"
        description="Consulta y modificación de roles de usuarios registrados"
      />

      <div className="bento-cell space-y-4">
        <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-xl border border-border max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            className="w-full text-xs bg-transparent focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-3 px-4 font-semibold">Usuario</th>
                <th className="py-3 px-4 font-semibold">Correo</th>
                <th className="py-3 px-4 font-semibold">Rol</th>
                <th className="py-3 px-4 font-semibold">Estado</th>
                <th className="py-3 px-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-semibold text-foreground">{u.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.role === "admin"
                          ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                          : u.role === "operator"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === "Activo"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-rose-500/10 text-rose-600"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/admin/usuarios/${u.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors"
                    >
                      <Eye className="h-3 w-3" /> Ver / Editar
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
