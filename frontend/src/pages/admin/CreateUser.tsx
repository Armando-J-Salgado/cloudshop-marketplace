import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { ArrowLeft, UserPlus, AlertCircle } from "lucide-react"
import { apiClient, ApiError } from "@/services/apiClient"

export function CreateUser() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "operator" as "operator" | "admin" | "client",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await apiClient.users.create(form.email, form.password, form.name, form.role)
      setSuccess(true)
      setTimeout(() => navigate("/admin/usuarios"), 1500)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al crear el usuario")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="Crear Nuevo Usuario"
        description="Registrar un operador o administrador en la plataforma"
        action={
          <Link
            to="/admin/usuarios"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al listado
          </Link>
        }
      />

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          Usuario creado exitosamente. Redirigiendo...
        </div>
      )}

      <form onSubmit={handleSubmit} className="bento-cell space-y-6">
        <div className="space-y-4">
          <h3 className="text-base font-bold text-foreground">Información del Usuario</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="font-semibold text-foreground">Nombre completo</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Nombre del usuario"
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-foreground">Correo electrónico</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="correo@ejemplo.com"
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-foreground">Contraseña</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Mínimo 8 caracteres con mayúscula, número y símbolo"
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border space-y-4">
          <h3 className="text-base font-bold text-foreground">Rol del Usuario</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "client", label: "Cliente", desc: "Comprar productos y consultar pedidos" },
              { id: "operator", label: "Operador", desc: "Gestionar inventario y pedidos de su tienda" },
              { id: "admin", label: "Administrador", desc: "Acceso total a la plataforma" },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setForm({ ...form, role: r.id as typeof form.role })}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  form.role === r.id
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                    : "border-border bg-card text-foreground hover:bg-muted"
                }`}
              >
                <div className="text-xs font-bold capitalize">{r.label}</div>
                <div className="text-[10px] text-muted-foreground mt-1 leading-tight">{r.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" /> {isSubmitting ? "Creando..." : "Crear Usuario"}
          </button>
        </div>
      </form>
    </div>
  )
}
