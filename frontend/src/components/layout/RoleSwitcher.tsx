import React, { useState } from "react"
import { useRole } from "@/context/RoleContext"
import type { UserRole } from "@/context/RoleContext"
import { Shield, UserCheck, ShoppingBag, Settings2, Store } from "lucide-react"

export function RoleSwitcher() {
  const { role, setRole, operatorStoreId, setOperatorStoreId } = useRole()
  const [isOpen, setIsOpen] = useState(false)

  const roleLabels: Record<UserRole, { label: string; icon: React.ElementType; color: string }> = {
    admin: { label: "Administrador", icon: Shield, color: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30" },
    operator: { label: "Operador", icon: UserCheck, color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
    client: { label: "Cliente", icon: ShoppingBag, color: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  }

  const CurrentIcon = roleLabels[role].icon

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <div className="mb-2 p-3 bg-card border border-border rounded-2xl shadow-xl w-64 space-y-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Settings2 className="h-3.5 w-3.5" /> Rol de Desarrollo
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cerrar
            </button>
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {(Object.keys(roleLabels) as UserRole[]).map((r) => {
              const Icon = roleLabels[r].icon
              const isSelected = role === r
              return (
                <button
                  key={r}
                  onClick={() => {
                    setRole(r)
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                    isSelected
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="capitalize">{roleLabels[r].label}</span>
                </button>
              )
            })}
          </div>

          {role === "operator" && (
            <div className="pt-2 border-t border-border space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                <Store className="h-3 w-3" /> Tienda asignada
              </label>
              <input
                type="text"
                value={operatorStoreId}
                onChange={(e) => setOperatorStoreId(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-background border border-border rounded-lg"
                placeholder="ID de Tienda (ej. store-001)"
              />
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-full border shadow-lg backdrop-blur-md text-xs font-semibold transition-all hover:scale-105 ${roleLabels[role].color}`}
      >
        <CurrentIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Modo: {roleLabels[role].label}</span>
        <span className="sm:hidden capitalize">{role}</span>
      </button>
    </div>
  )
}
