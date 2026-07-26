import React from "react"
import { cn } from "@/lib/utils"

interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function BentoGrid({ children, className, ...props }: BentoGridProps) {
  return (
    <div className={cn("bento-grid", className)} {...props}>
      {children}
    </div>
  )
}
