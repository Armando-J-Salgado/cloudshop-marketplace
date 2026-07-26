import React from "react"
import { Link } from "react-router-dom"
import { Compass, ArrowLeft } from "lucide-react"

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="rounded-full bg-primary/10 p-5 mb-4 text-primary border border-primary/20">
        <Compass className="h-12 w-12" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">404 — Página no encontrada</h1>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        La ruta solicitada no existe en la aplicación o ha sido removida.
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
