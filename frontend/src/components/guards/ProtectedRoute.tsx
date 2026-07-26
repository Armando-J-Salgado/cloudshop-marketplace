import React from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import type { UserRole } from "@/services/mockAuth"

interface ProtectedRouteProps {
  allow: UserRole[]
  children: React.ReactNode
}

export function ProtectedRoute({ allow, children }: ProtectedRouteProps) {
  const { status, roles } = useAuth()

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (status === "anon") {
    return <Navigate to="/login" replace />
  }

  const hasPermission = roles.some((r) => allow.includes(r))
  if (!hasPermission) {
    return <Navigate to="/403" replace />
  }

  return <>{children}</>
}

