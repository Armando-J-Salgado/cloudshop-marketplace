import React, { useLayoutEffect } from "react"
import { Outlet } from "react-router-dom"
import { AdminSidebar } from "@/components/layout/AdminSidebar"
import { RoleSwitcher } from "@/components/layout/RoleSwitcher"

export function AdminLayout() {
  useLayoutEffect(() => {
    document.documentElement.dataset.skin = "admin"
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
      <RoleSwitcher />
    </div>
  )
}
