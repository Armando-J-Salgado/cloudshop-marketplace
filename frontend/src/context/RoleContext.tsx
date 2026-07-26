import React, { createContext, useContext, useState, useEffect } from "react"

export type UserRole = "admin" | "operator" | "client"

interface RoleContextType {
  role: UserRole
  setRole: (role: UserRole) => void
  operatorStoreId: string
  setOperatorStoreId: (storeId: string) => void
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem("cloudshop_dev_role")
    return (saved as UserRole) || "admin"
  })

  const [operatorStoreId, setOperatorStoreIdState] = useState<string>(() => {
    return localStorage.getItem("cloudshop_dev_operator_store") || "store-001"
  })

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole)
    localStorage.setItem("cloudshop_dev_role", newRole)
  }

  const setOperatorStoreId = (storeId: string) => {
    setOperatorStoreIdState(storeId)
    localStorage.setItem("cloudshop_dev_operator_store", storeId)
  }

  return (
    <RoleContext.Provider value={{ role, setRole, operatorStoreId, setOperatorStoreId }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider")
  }
  return context
}
