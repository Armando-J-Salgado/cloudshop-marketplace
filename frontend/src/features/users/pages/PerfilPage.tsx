import React from "react"
import { PageHeader } from "@/components/common/PageHeader"
import { useRole } from "@/context/RoleContext"
import { User, Mail, Shield, Key, Calendar } from "lucide-react"

export function PerfilPage() {
  const { role } = useRole()

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Perfil de Usuario"
        description="Gestión de datos de cuenta y credenciales"
      />

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-border">
          <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold border border-primary/20">
            UD
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Usuario Demo</h3>
            <p className="text-xs text-muted-foreground">usuario@cloudshop.com</p>
            <span className="inline-block mt-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
              Rol: {role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Mail className="h-4 w-4" /> Correo Electrónico
            </div>
            <p className="text-sm font-semibold text-foreground">usuario@cloudshop.com</p>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Shield className="h-4 w-4" /> Rol Asignado
            </div>
            <p className="text-sm font-semibold text-foreground capitalize">{role}</p>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Key className="h-4 w-4" /> ID de Usuario (Cognito Sub)
            </div>
            <p className="text-xs font-mono font-semibold text-foreground">usr-9482-a84f-b129</p>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Calendar className="h-4 w-4" /> Fecha de Registro
            </div>
            <p className="text-sm font-semibold text-foreground">25 de Julio, 2026</p>
          </div>
        </div>
      </div>
    </div>
  )
}
