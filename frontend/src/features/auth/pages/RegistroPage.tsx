import React from "react"
import { Link, useNavigate } from "react-router-dom"
import { UserPlus, Mail, Lock, User, ArrowRight } from "lucide-react"

export function RegistroPage() {
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Demo navigation to login page
    navigate("/login")
  }

  return (
    <div className="w-full bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl">
      <div className="text-center mb-6">
        <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-3">
          <UserPlus className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Crear Cuenta</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Consume <code className="bg-muted px-1 py-0.5 rounded text-[11px]">POST /registrations</code> en el backend Python
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Nombre Completo</label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              required
              placeholder="Juan Pérez"
              className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Correo Electrónico</label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              required
              placeholder="nombre@ejemplo.com"
              className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-2"
        >
          Registrarse <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-border text-center text-xs">
        <span className="text-muted-foreground">¿Ya tienes una cuenta? </span>
        <Link to="/login" className="font-bold text-primary hover:underline">
          Inicia sesión aquí
        </Link>
      </div>
    </div>
  )
}
