import React from "react"
import { AlertCircle, Construction } from "lucide-react"

interface PagePlaceholderProps {
  title: string
  module: string
  status?: "Pendiente" | "Sin backend"
  description?: string
  children?: React.ReactNode
}

export function PagePlaceholder({
  title,
  module,
  status = "Pendiente",
  description,
  children,
}: PagePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              {module}
            </span>
            <span
              className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                status === "Sin backend"
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                  : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20"
              }`}
            >
              {status}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">{title}</h1>
        </div>
      </div>

      <div className="bento-cell bg-card/60 p-8 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-center">
        <div className="rounded-full bg-muted p-4 mb-4 text-muted-foreground">
          <Construction className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-4">
          {description ||
            `Esta pantalla forma parte del módulo "${module}" del ASD. Actualmente está disponible en mapa de navegación.`}
        </p>

        {status === "Sin backend" && (
          <div className="flex items-center gap-2 text-xs bg-amber-500/10 text-amber-800 dark:text-amber-300 p-3 rounded-xl border border-amber-500/20 max-w-md text-left">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              <strong>Nota de Backend:</strong> Este módulo no cuenta con Lambdas/API Gateway en la infraestructura actual (0 lambdas). Se requiere integración en iteraciones futuras.
            </span>
          </div>
        )}

        {children && <div className="mt-6 w-full">{children}</div>}
      </div>
    </div>
  )
}
