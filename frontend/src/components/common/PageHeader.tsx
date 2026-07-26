import React from "react"

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  badge?: React.ReactNode
}

export function PageHeader({ title, description, action, badge }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border mb-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  )
}
