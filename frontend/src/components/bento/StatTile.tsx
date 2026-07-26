import React from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatTileProps {
  label: string
  value: string | number
  delta?: string
  deltaType?: "positive" | "negative" | "neutral"
  icon?: LucideIcon
  description?: string
  className?: string
}

export function StatTile({
  label,
  value,
  delta,
  deltaType = "positive",
  icon: Icon,
  description,
  className,
}: StatTileProps) {
  return (
    <div className={cn("flex flex-col justify-between h-full py-1", className)}>
      <div className="flex items-center justify-between text-muted-foreground mb-2">
        <span className="text-sm font-medium tracking-tight text-muted-foreground">{label}</span>
        {Icon && (
          <div className="rounded-2xl bg-primary/10 p-2.5 text-primary flex items-center justify-center">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-[2.75rem] leading-none font-semibold tracking-tight tabular-nums text-foreground">
          {value}
        </div>
        
        {(delta || description) && (
          <div className="flex items-center gap-2 pt-1">
            {delta && (
              <span
                className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center",
                  deltaType === "positive" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                  deltaType === "negative" && "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                  deltaType === "neutral" && "bg-muted text-muted-foreground"
                )}
              >
                {delta}
              </span>
            )}
            {description && (
              <span className="text-xs text-muted-foreground">{description}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
