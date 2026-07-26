import React, { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { UserMenu } from "./UserMenu"
import { useAuth } from "@/hooks/useAuth"
import { ShoppingCart, Store, ShoppingBag, Shield, Menu, X } from "lucide-react"

export function AppHeader() {
  const location = useLocation()
  const { roles } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false)

  const navLinks = [
    { to: "/catalogo", label: "Catálogo", icon: ShoppingBag },
    { to: "/pedidos", label: "Mis Pedidos", icon: Store },
    { to: "/tiendas", label: "Tiendas", icon: Store },
  ]

  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/catalogo" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
            <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-sm shadow-md">
              CS
            </div>
            <span className="text-foreground font-extrabold tracking-tight">CloudShop</span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.to)
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Privileged Panel Link */}
          {roles.includes("admin") && (
            <Link
              to="/admin"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 text-xs font-semibold hover:bg-indigo-500/20 transition-all"
            >
              <Shield className="h-3.5 w-3.5" /> Admin Panel
            </Link>
          )}
          {roles.includes("operator") && (
            <Link
              to="/operacion"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-semibold hover:bg-emerald-500/20 transition-all"
            >
              <Store className="h-3.5 w-3.5" /> Panel Operador
            </Link>
          )}

          {/* Cart Button */}
          <button
            onClick={() => setIsCartSheetOpen(!isCartSheetOpen)}
            className="relative p-2 rounded-full hover:bg-muted transition-colors text-foreground"
            aria-label="Carrito de compras"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
              2
            </span>
          </button>

          {/* User Menu */}
          <UserMenu />

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card px-4 pt-2 pb-4 space-y-2 animate-in fade-in">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-muted"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}

      {/* Cart Quick Preview Sheet */}
      {isCartSheetOpen && (
        <>
          <div className="fixed inset-0 bg-background/60 backdrop-blur-xs z-50" onClick={() => setIsCartSheetOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card border-l border-border p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2 font-bold text-lg text-foreground">
                  <ShoppingCart className="h-5 w-5 text-primary" /> Carrito de Compras
                </div>
                <button
                  onClick={() => setIsCartSheetOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Sample Cart Items */}
              <div className="py-4 space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                    PROD
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">Producto Ejemplo A</p>
                    <p className="text-[11px] text-muted-foreground">Tienda Central • Cantidad: 1</p>
                    <p className="text-xs font-bold text-primary mt-0.5">$24.99</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                    PROD
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">Producto Ejemplo B</p>
                    <p className="text-[11px] text-muted-foreground">Tienda Express • Cantidad: 2</p>
                    <p className="text-xs font-bold text-primary mt-0.5">$15.00</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Total Estimado:</span>
                <span className="font-extrabold text-foreground text-base">$54.99</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/carrito"
                  onClick={() => setIsCartSheetOpen(false)}
                  className="w-full text-center px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors"
                >
                  Ver Carrito
                </Link>
                <Link
                  to="/checkout"
                  onClick={() => setIsCartSheetOpen(false)}
                  className="w-full text-center px-4 py-2.5 rounded-xl bg-accent text-accent-foreground text-xs font-bold shadow-md hover:opacity-90 transition-opacity"
                >
                  Ir a Checkout
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  )
}
