import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { Search, Eye, UserPlus, RefreshCw, AlertCircle } from "lucide-react"
import { apiClient, ApiError } from "@/services/apiClient"

interface UserItem {
  id: string
  email: string
  name: string
  role: string
  status: string
  created_at: string
}

export function Users() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await apiClient.users.list()
      setUsers(result.data.users)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cargar usuarios")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const filtered = users.filter((u) => {
    const term = searchTerm.toLowerCase()
    return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Usuarios"
        description="Consulta y administración de usuarios registrados en Cognito"
        action={
          <div className="flex items-center gap-2">
            <button onClick={fetchUsers} disabled={isLoading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <Link to="/admin/usuarios/nuevo"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:opacity-90 transition-opacity">
              <UserPlus className="h-4 w-4" /> Crear Usuario
            </Link>
          </div>
        }
      />

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span>
        </div>
      )}

      <div className="bento-cell space-y-4">
        <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-xl border border-border max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar por nombre o correo..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-transparent focus:outline-none" />
        </div>

        {isLoading ? (
          <p className="text-xs text-muted-foreground">Cargando usuarios...</p>
        ) : (
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
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">{u.name || "—"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.role === "admin" ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                        : u.role === "operator" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "bg-muted text-muted-foreground"
                      }`}>{u.role || "client"}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                      }`}>{u.status || "active"}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link to={`/admin/usuarios/${u.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors">
                        <Eye className="h-3 w-3" /> Ver / Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
