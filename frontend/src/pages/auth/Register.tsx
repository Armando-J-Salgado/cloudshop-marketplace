import React from "react"
import { Link } from "react-router-dom"
import { UserPlus, Mail, Lock, User, Phone, MapPin, ArrowRight, ShieldAlert } from "lucide-react"

export function Register() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="w-full bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-3">
            <UserPlus className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Crear Cuenta</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Módulo de Registro de Usuarios (POST /registrations)
          </p>
        </div>

        {/* Backend Placeholder Notice */}
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-medium space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldAlert className="h-4 w-4 text-amber-600" /> Registro - Backend Pendiente (Fase 3)
          </div>
          <p className="text-[11px] leading-relaxed">
            El registro se consume vía HTTP contra <code>POST /registrations</code> en la Fase 3.
            Por el momento, puedes iniciar sesión directamente con las cuentas semilla.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Nombre Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                disabled
                placeholder="Juan Pérez"
                className="w-full pl-9 pr-3 py-2 text-xs bg-muted/50 border border-border rounded-xl text-foreground cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                disabled
                placeholder="juan@ejemplo.com"
                className="w-full pl-9 pr-3 py-2 text-xs bg-muted/50 border border-border rounded-xl text-foreground cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                disabled
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs bg-muted/50 border border-border rounded-xl text-foreground cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Teléfono</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  disabled
                  placeholder="+503 7000-0000"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-muted/50 border border-border rounded-xl text-foreground cursor-not-allowed"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Ciudad</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  disabled
                  placeholder="San Salvador"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-muted/50 border border-border rounded-xl text-foreground cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled
            className="w-full py-2.5 px-4 rounded-xl bg-primary/50 text-primary-foreground font-semibold text-xs cursor-not-allowed flex items-center justify-center gap-2 mt-4"
          >
            Registrarse (Disponible en Fase 3) <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-border text-center text-xs">
          <span className="text-muted-foreground">¿Ya tienes una cuenta? </span>
          <Link to="/login" className="font-bold text-primary hover:underline">
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  )
}
