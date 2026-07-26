import React, { useLayoutEffect } from "react"
import { Outlet, Link } from "react-router-dom"
import { RoleSwitcher } from "@/components/layout/RoleSwitcher"

export function AuthLayout() {
  useLayoutEffect(() => {
    document.documentElement.dataset.skin = "client"
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-md mx-auto flex items-center justify-between pb-4">
        <Link to="/catalogo" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
          <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-sm shadow-md">
            CS
          </div>
          <span className="text-foreground font-extrabold tracking-tight">CloudShop</span>
        </Link>
      </header>

      <main className="w-full max-w-md mx-auto my-auto py-6">
        <Outlet />
      </main>

      <footer className="w-full max-w-md mx-auto pt-4 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} CloudShop Enterprise. Todos los derechos reservados.</p>
      </footer>

      <RoleSwitcher />
    </div>
  )
}
