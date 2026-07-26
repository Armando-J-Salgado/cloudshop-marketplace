import React, { useLayoutEffect } from "react"
import { Outlet } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { RoleSwitcher } from "@/components/layout/RoleSwitcher"

export function ShopLayout() {
  useLayoutEffect(() => {
    document.documentElement.dataset.skin = "client"
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AppHeader />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>
      <footer className="border-t border-border bg-card/50 py-8 px-4 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <div className="h-6 w-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-black text-xs">
              CS
            </div>
            CloudShop Marketplace
          </div>
          <p>&copy; {new Date().getFullYear()} CloudShop Enterprise — Todos los derechos reservados.</p>
        </div>
      </footer>
      <RoleSwitcher />
    </div>
  )
}
