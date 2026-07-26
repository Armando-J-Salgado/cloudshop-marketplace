import React, { createContext, useContext, useState, useEffect } from "react"
import { mockAuth as authAdapter } from "@/services/mockAuth"
import type { AuthUser, UserRole } from "@/services/mockAuth"

export type AuthStatus = "loading" | "authed" | "anon"

interface AuthContextType {
  user: AuthUser | null
  roles: UserRole[]
  status: AuthStatus
  login: (email: string, pass: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [roles, setRoles] = useState<UserRole[]>([])
  const [status, setStatus] = useState<AuthStatus>("loading")

  useEffect(() => {
    const session = authAdapter.getSession()
    if (session) {
      setUser(session.user)
      setRoles(session.roles)
      setStatus("authed")
    } else {
      setUser(null)
      setRoles([])
      setStatus("anon")
    }
  }, [])

  const login = async (email: string, pass: string) => {
    const session = await authAdapter.login(email, pass)
    setUser(session.user)
    setRoles(session.roles)
    setStatus("authed")
  }

  const logout = async () => {
    await authAdapter.logout()
    setUser(null)
    setRoles([])
    setStatus("anon")
  }

  return (
    <AuthContext.Provider value={{ user, roles, status, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth debe ser utilizado dentro de un AuthProvider")
  }
  return context
}
