import React, { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { Shield, UserCheck, ArrowLeft, Save, AlertTriangle } from "lucide-react"

export function AdminUsuarioPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState("operator")
  const [isActive, setIsActive] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Demo save
    navigate("/admin/usuarios")
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title={`Administración de Usuario: ${userId}`}
        description="Asignación de rol y habilitación de cuenta"
        action={
          <Link
            to="/admin/usuarios"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al listado
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="bento-cell space-y-6">
        <div className="space-y-4">
          <h3 className="text-base font-bold text-foreground">Detalles de la cuenta</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-muted-foreground font-medium">ID del Usuario</label>
              <p className="font-mono font-semibold text-foreground mt-0.5">{userId}</p>
            </div>
            <div>
              <label className="text-muted-foreground font-medium">Correo Electrónico</label>
              <p className="font-semibold text-foreground mt-0.5 font-sans">usuario.ejemplo@cloudshop.com</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border space-y-4">
          <h3 className="text-base font-bold text-foreground">Cambiar Rol</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "client", label: "Cliente", desc: "Comprar productos en la tienda" },
              { id: "operator", label: "Operador", desc: "Gestionar inventario y pedidos de su tienda" },
              { id: "admin", label: "Administrador", desc: "Acceso total a la plataforma" },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRole(r.id)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  selectedRole === r.id
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

        <div className="pt-4 border-t border-border flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-foreground">Estado de la Cuenta</h4>
            <p className="text-xs text-muted-foreground">Desactivar impide que el usuario inicie sesión</p>
          </div>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              isActive ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
            }`}
          >
            {isActive ? "Cuenta Activa" : "Cuenta Desactivada"}
          </button>
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:opacity-90 transition-opacity"
          >
            <Save className="h-4 w-4" /> Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  )
}
