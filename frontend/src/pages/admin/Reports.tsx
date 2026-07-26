import React from "react"
import { useLocation, Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { BentoGrid } from "@/components/bento/BentoGrid"
import { BentoCard } from "@/components/bento/BentoCard"
import { StatTile } from "@/components/bento/StatTile"
import { BarChart3, TrendingUp, AlertOctagon, Award, Store } from "lucide-react"

export function Reports() {
  const location = useLocation()
  const path = location.pathname

  const tabs = [
    { to: "/admin/reportes/ventas-por-tienda", label: "Ventas por Tienda" },
    { to: "/admin/reportes/mas-vendidos", label: "Más Vendidos" },
    { to: "/admin/reportes/agotados", label: "Productos Agotados" },
    { to: "/admin/reportes/top-clientes", label: "Top Clientes" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes Ejecutivos"
        description="Módulo 6 del ASD · Análisis consolidado de la plataforma"
        badge={
          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-bold">
            Sin backend (Hardcoded demo)
          </span>
        }
      />

      {/* Navigation Sub-tabs */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-border">
        {tabs.map((t) => {
          const isActive = path === t.to
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border text-foreground hover:bg-muted"
              }`}
            >
              {t.label}
            </Link>
          )
        })}
      </div>

      {/* Render sub-view according to path */}
      {path.includes("mas-vendidos") ? (
        <BentoGrid>
          <BentoCard span="4x1" title="Productos Más Vendidos" subtitle="Ranking acumulado de unidades comercializadas">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-2">
              {[
                { name: "Laptop Gamer Ultra 16GB", qty: "340 unidades", total: "$441,996.60", store: "Tienda Tech Central" },
                { name: "Audífonos Bluetooth Pro", qty: "280 unidades", total: "$36,397.20", store: "Tienda Tech Central" },
                { name: "Silla Ergonómica de Oficina", qty: "190 unidades", total: "$47,405.00", store: "Hogar & Confort" },
                { name: "Zapatillas Deportivas Air", qty: "150 unidades", total: "$13,485.00", store: "Sporting Goods" },
              ].map((p, i) => (
                <div key={i} className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    #{i + 1} Más Vendido
                  </span>
                  <h4 className="text-xs font-bold text-foreground mt-1 truncate">{p.name}</h4>
                  <p className="text-[11px] text-muted-foreground">{p.store}</p>
                  <div className="flex justify-between items-center text-xs pt-2 border-t border-border/60 mt-2">
                    <span className="font-extrabold text-foreground">{p.qty}</span>
                    <span className="font-bold text-primary">{p.total}</span>
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>
        </BentoGrid>
      ) : path.includes("agotados") ? (
        <BentoGrid>
          <BentoCard span="4x1" title="Alertas de Inventario: Productos Agotados" subtitle="Productos con Stock igual a cero">
            <div className="space-y-3 py-2">
              {[
                { code: "PROD-004", name: "Zapatillas Running Air", store: "Sporting Goods", category: "Deportes", stock: 0 },
                { code: "PROD-012", name: "Monitor 4K Curved 27''", store: "Tienda Tech Central", category: "Electrónica", stock: 0 },
                { code: "PROD-019", name: "Cafetera Expresso Pro", store: "Hogar & Confort", category: "Hogar", stock: 0 },
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
                      <AlertOctagon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground">Código: {item.code} • {item.store}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 text-xs font-bold border border-rose-500/20">
                    Agotado (0 un.)
                  </span>
                </div>
              ))}
            </div>
          </BentoCard>
        </BentoGrid>
      ) : path.includes("top-clientes") ? (
        <BentoGrid>
          <BentoCard span="4x1" title="Top Clientes del Año" subtitle="Clientes con mayor volumen acumulado de compra">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
              {[
                { name: "María López", email: "maria@gmail.com", orders: 18, spent: "$4,250.00", badge: "Platinum" },
                { name: "Carlos Ramírez", email: "carlos.r@gmail.com", orders: 12, spent: "$2,890.50", badge: "Gold" },
                { name: "Sofía Martínez", email: "sofia.m@gmail.com", orders: 9, spent: "$1,920.00", badge: "Gold" },
              ].map((c, i) => (
                <div key={i} className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700">
                      Nivel {c.badge}
                    </span>
                    <Award className="h-4 w-4 text-amber-500" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">{c.name}</h4>
                  <p className="text-xs text-muted-foreground">{c.email}</p>
                  <div className="flex justify-between text-xs pt-2 border-t border-border">
                    <span>{c.orders} Pedidos</span>
                    <span className="font-extrabold text-foreground">{c.spent}</span>
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>
        </BentoGrid>
      ) : (
        /* Default: Ventas por Tienda */
        <BentoGrid>
          <BentoCard span="2x1" interactive>
            <StatTile
              label="Tienda Tech Central"
              value="$42,890.50"
              delta="33.4% del mercado"
              deltaType="positive"
              icon={Store}
            />
          </BentoCard>
          <BentoCard span="2x1" interactive>
            <StatTile
              label="Hogar & Confort"
              value="$31,200.00"
              delta="24.3% del mercado"
              deltaType="positive"
              icon={Store}
            />
          </BentoCard>
          <BentoCard span="2x1" interactive>
            <StatTile
              label="Sporting Goods"
              value="$18,450.00"
              delta="14.3% del mercado"
              deltaType="neutral"
              icon={Store}
            />
          </BentoCard>
          <BentoCard span="2x1" interactive>
            <StatTile
              label="Moda & Estilo"
              value="$12,100.00"
              delta="9.4% del mercado"
              deltaType="neutral"
              icon={Store}
            />
          </BentoCard>
        </BentoGrid>
      )}
    </div>
  )
}
