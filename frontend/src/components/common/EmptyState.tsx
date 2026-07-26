import React from "react"
import { FolderOpen } from "lucide-react"

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ElementType
  action?: React.ReactNode
}

export function EmptyState({
  title,
  description,
  icon: Icon = FolderOpen,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-border bg-card/40 my-4">
      <div className="rounded-full bg-muted p-3 mb-3 text-muted-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="text-xs text-muted-foreground mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
