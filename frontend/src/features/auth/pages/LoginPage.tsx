import React from "react"
import { Link, useNavigate } from "react-router-dom"
import { Lock, Mail, ArrowRight, Shield } from "lucide-react"

export function LoginPage() {
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Demo navigation to catalog
    navigate("/catalogo")
  }

  return (
    <div className="w-full bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl">
      <div className="text-center mb-6">
        <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-3">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Iniciar Sesión</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Autenticación directa con Cognito User Pool (SDK AWS)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">Contraseña</label>
            <a href="#" onClick={(e) => e.preventDefault()} className="text-[11px] font-semibold text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
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
          Ingresar <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-border text-center text-xs">
        <span className="text-muted-foreground">¿No tienes una cuenta? </span>
        <Link to="/registro" className="font-bold text-primary hover:underline">
          Regístrate gratis
        </Link>
      </div>
    </div>
  )
}
