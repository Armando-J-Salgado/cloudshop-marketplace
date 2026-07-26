import React, { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Store,
  BarChart3,
  ChevronDown,
  LogOut,
  Boxes,
  Menu,
  X,
  User,
  ScrollText,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function AdminSidebar() {
  const location = useLocation()
  const { user, roles } = useAuth()
  const [isReportsOpen, setIsReportsOpen] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const isOperator = roles.includes("operator") && !roles.includes("admin")
  const operatorStoreId = user?.storeId || "store-001"

  const adminNav = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    {
      label: "Reportes",
      icon: BarChart3,
      isGroup: true,
      children: [
        { to: "/admin/reportes/ventas-por-tienda", label: "Ventas por Tienda" },
        { to: "/admin/reportes/mas-vendidos", label: "Más Vendidos" },
        { to: "/admin/reportes/agotados", label: "Productos Agotados" },
        { to: "/admin/reportes/top-clientes", label: "Top Clientes" },
      ],
    },
    { to: "/admin/productos", label: "Productos", icon: Package },
    { to: "/admin/pedidos", label: "Pedidos Globales", icon: ShoppingBag },
    { to: "/admin/usuarios", label: "Usuarios", icon: Users },
    { to: "/admin/tiendas", label: "Tiendas", icon: Store },
    { to: "/admin/auditoria", label: "Auditoría", icon: ScrollText },
  ]

  const operatorNav = [
    { to: "/operacion/inventario", label: "Inventario Tienda", icon: Boxes },
    { to: "/operacion/pedidos", label: "Pedidos de Tienda", icon: ShoppingBag },
  ]

  const currentNav = isOperator ? operatorNav : adminNav

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2.5 rounded-2xl bg-card border border-border text-foreground shadow-md"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-xs z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border p-4 flex flex-col justify-between transition-transform duration-200 ease-in-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="space-y-6">
          {/* Header Branding */}
          <div className="flex items-center justify-between px-2 pt-1">
            <Link to="/catalogo" className="flex items-center gap-2.5 font-bold text-lg">
              <div className="h-9 w-9 rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center font-extrabold text-sm shadow-md">
                CS
              </div>
              <div className="flex flex-col">
                <span className="text-sidebar-foreground font-extrabold tracking-tight leading-none text-base">
                  CloudShop
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">
                  {isOperator ? "Panel Operador" : "Admin Bento"}
                </span>
              </div>
            </Link>
          </div>

          {/* Active Store Banner for Operator */}
          {isOperator && (
            <div className="px-3 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                <Store className="h-3 w-3" /> Tienda Asignada
              </div>
              <p className="text-xs font-extrabold truncate">{operatorStoreId}</p>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1">
            {currentNav.map((item: any) => {
              if (item.isGroup) {
                const isGroupActive = item.children.some((c: any) =>
                  location.pathname.startsWith(c.to)
                )
                return (
                  <div key={item.label} className="space-y-1">
                    <button
                      onClick={() => setIsReportsOpen(!isReportsOpen)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-colors",
                        isGroupActive
                          ? "bg-sidebar-accent text-sidebar-foreground"
                          : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform duration-200",
                          isReportsOpen && "rotate-180"
                        )}
                      />
                    </button>

                    {isReportsOpen && (
                      <div className="pl-8 space-y-1">
                        {item.children.map((child: any) => {
                          const isActive = location.pathname === child.to
                          return (
                            <Link
                              key={child.to}
                              to={child.to}
                              onClick={() => setIsMobileOpen(false)}
                              className={cn(
                                "block px-3 py-1.5 rounded-xl text-xs font-medium transition-colors",
                                isActive
                                  ? "bg-sidebar-primary/10 text-sidebar-primary font-bold"
                                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                              )}
                            >
                              {child.label}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              const isActive = location.pathname === item.to
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer Profile Links */}
        <div className="pt-4 border-t border-sidebar-border space-y-1">
          <Link
            to="/admin/perfil"
            className="flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-semibold text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <User className="h-4 w-4" /> Perfil de Usuario
          </Link>
          <Link
            to="/catalogo"
            className="flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-semibold text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <LogOut className="h-4 w-4" /> Ir a Tienda (Cliente)
          </Link>
        </div>
      </aside>
    </>
  )
}
