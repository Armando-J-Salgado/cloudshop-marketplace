import React from "react"
import { cn } from "@/lib/utils"

export type BentoSpan = "1x1" | "2x1" | "2x2" | "1x2" | "4x1" | "3x1" | "3x2"

interface BentoCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  children: React.ReactNode
  span?: BentoSpan
  title?: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
  interactive?: boolean
}

const spanStyles: Record<BentoSpan, string> = {
  "1x1": "col-span-1 row-span-1",
  "2x1": "sm:col-span-2 row-span-1",
  "2x2": "sm:col-span-2 row-span-2",
  "1x2": "col-span-1 row-span-2",
  "4x1": "sm:col-span-2 xl:col-span-4 row-span-1",
  "3x1": "sm:col-span-2 xl:col-span-3 row-span-1",
  "3x2": "sm:col-span-2 xl:col-span-3 row-span-2",
}

export function BentoCard({
  children,
  span = "1x1",
  title,
  subtitle,
  action,
  interactive = false,
  className,
  ...props
}: BentoCardProps) {
  return (
    <div
      className={cn(
        "bento-cell flex flex-col justify-between overflow-hidden",
        spanStyles[span],
        interactive && "bento-cell-interactive cursor-pointer",
        className
      )}
      {...props}
    >
      {(title || action || subtitle) && (
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            {title && <h3 className="font-semibold text-foreground text-lg tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="flex-1 flex flex-col justify-center">{children}</div>
    </div>
  )
}
