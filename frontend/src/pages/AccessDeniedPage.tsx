import React from "react"
import { Link } from "react-router-dom"
import { ShieldAlert, ArrowLeft } from "lucide-react"

export function AccessDeniedPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="rounded-full bg-rose-500/10 p-5 mb-4 text-rose-600 dark:text-rose-400 border border-rose-500/20">
        <ShieldAlert className="h-12 w-12" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">403 — Acceso Denegado</h1>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        No tienes permisos suficientes con tu rol actual para acceder a esta ruta. Utiliza el selector de rol en la esquina inferior derecha para probar este permiso en desarrollo.
      </p>
      <Link
        to="/catalogo"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:opacity-90 transition-opacity"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al Catálogo
      </Link>
    </div>
  )
}
