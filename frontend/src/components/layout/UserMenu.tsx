import React from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { User, LogOut, ShieldCheck, ShoppingBag, Store, LogIn } from "lucide-react"

export function UserMenu() {
  const { user, roles, status, logout } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = React.useState(false)

  if (status === "anon" || !user) {
    return (
      <Link
        to="/login"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity"
      >
        <LogIn className="h-4 w-4" /> Iniciar sesión
      </Link>
    )
  }

  const primaryRole = roles[0] || "client"

  const roleBadge = {
    admin: { text: "Administrador", color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300" },
    operator: { text: "Operador", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
    client: { text: "Cliente", color: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const handleLogout = async () => {
    setIsOpen(false)
    await logout()
    navigate("/login")
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-full hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20">
          {initials}
        </div>
        <span className="text-xs font-semibold text-foreground hidden md:inline">{user.name}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 z-50 rounded-2xl bg-card border border-border p-2 shadow-xl animate-in fade-in slide-in-from-top-2">
            <div className="px-3 py-2 border-b border-border mb-1">
              <p className="text-xs font-bold text-foreground truncate">{user.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
              <span
                className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${roleBadge[primaryRole].color}`}
              >
                {roleBadge[primaryRole].text}
              </span>
            </div>

            <div className="space-y-0.5">
              <Link
                to="/perfil"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-foreground rounded-xl hover:bg-muted transition-colors"
              >
                <User className="h-4 w-4 text-muted-foreground" /> Mi Perfil
              </Link>
              <Link
                to="/pedidos"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-foreground rounded-xl hover:bg-muted transition-colors"
              >
                <ShoppingBag className="h-4 w-4 text-muted-foreground" /> Mis Pedidos
              </Link>

              {roles.includes("admin") && (
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors font-medium"
                >
                  <ShieldCheck className="h-4 w-4" /> Panel Administrador
                </Link>
              )}

              {roles.includes("operator") && (
                <Link
                  to="/operacion"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors font-medium"
                >
                  <Store className="h-4 w-4" /> Panel de Operador
                </Link>
              )}
            </div>

            <div className="border-t border-border pt-1 mt-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive rounded-xl hover:bg-destructive/10 transition-colors text-left"
              >
                <LogOut className="h-4 w-4" /> Cerrar sesión
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
