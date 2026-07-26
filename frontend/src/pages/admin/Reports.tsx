import React, { useEffect, useState } from "react"
import { useLocation, Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { BentoGrid } from "@/components/bento/BentoGrid"
import { BentoCard } from "@/components/bento/BentoCard"
import { StatTile } from "@/components/bento/StatTile"
import { AlertOctagon, Award, Store, RefreshCw, AlertCircle } from "lucide-react"
import { apiClient, ApiError } from "@/services/apiClient"

interface DashboardData {
  TotalSales: number
  TotalOrders: number
  SalesByStore: Array<{ StoreId: string; TotalSales: number }>
  TopProducts: Array<{ ProductId: string; Name: string; TotalSold: number }>
  OutOfStockProducts: Array<{ ProductId: string; Name: string; StoreId: string }>
  TopCustomers: Array<{ CustomerId: string; OrderCount: number }>
  OrdersByStatus: Record<string, number>
}

export function Reports() {
  const location = useLocation()
  const path = location.pathname

  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await apiClient.dashboard.get()
      setData(result)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cargar los datos del dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

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
        description="Módulo 6 · Análisis consolidado de la plataforma"
        action={
          <button
            onClick={fetchDashboard}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Refrescar
          </button>
        }
      />

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

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

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Cargando datos del dashboard...</p>
      ) : !data ? (
        <p className="text-xs text-muted-foreground">No se pudieron obtener los datos.</p>
      ) : (
        <>
          {/* Render sub-view according to path */}
          {path.includes("mas-vendidos") ? (
            <BentoGrid>
              <BentoCard span="4x1" title="Productos Más Vendidos" subtitle="Ranking acumulado de unidades comercializadas">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-2">
                  {data.TopProducts.length === 0 ? (
                    <p className="text-xs text-muted-foreground col-span-4">No hay datos de ventas aún.</p>
                  ) : (
                    data.TopProducts.slice(0, 8).map((p, i) => (
                      <div key={p.ProductId} className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          #{i + 1} Más Vendido
                        </span>
                        <h4 className="text-xs font-bold text-foreground mt-1 truncate">{p.Name}</h4>
                        <p className="text-[11px] text-muted-foreground">{p.ProductId}</p>
                        <div className="flex justify-between items-center text-xs pt-2 border-t border-border/60 mt-2">
                          <span className="font-extrabold text-foreground">{p.TotalSold} unidades</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </BentoCard>
            </BentoGrid>
          ) : path.includes("agotados") ? (
            <BentoGrid>
              <BentoCard span="4x1" title="Alertas de Inventario: Productos Agotados" subtitle="Productos con Stock igual a cero">
                <div className="space-y-3 py-2">
                  {data.OutOfStockProducts.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No hay productos agotados actualmente.</p>
                  ) : (
                    data.OutOfStockProducts.map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
                            <AlertOctagon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">{item.Name}</p>
                            <p className="text-[11px] text-muted-foreground">ID: {item.ProductId} &bull; {item.StoreId}</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 text-xs font-bold border border-rose-500/20">
                          Agotado (0 un.)
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </BentoCard>
            </BentoGrid>
          ) : path.includes("top-clientes") ? (
            <BentoGrid>
              <BentoCard span="4x1" title="Top Clientes" subtitle="Clientes con mayor cantidad de pedidos realizados">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
                  {data.TopCustomers.length === 0 ? (
                    <p className="text-xs text-muted-foreground col-span-3">No hay datos de clientes aún.</p>
                  ) : (
                    data.TopCustomers.slice(0, 9).map((c, i) => (
                      <div key={c.CustomerId} className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700">
                            #{i + 1} Top Cliente
                          </span>
                          <Award className="h-4 w-4 text-amber-500" />
                        </div>
                        <h4 className="text-sm font-bold text-foreground truncate">{c.CustomerId}</h4>
                        <div className="flex justify-between text-xs pt-2 border-t border-border">
                          <span>{c.OrderCount} Pedidos</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </BentoCard>
            </BentoGrid>
          ) : (
            /* Default: Ventas por Tienda */
            <BentoGrid>
              {data.SalesByStore.length === 0 ? (
                <BentoCard span="4x1">
                  <p className="text-xs text-muted-foreground">No hay datos de ventas por tienda aún.</p>
                </BentoCard>
              ) : (
                data.SalesByStore.map((store) => (
                  <BentoCard key={store.StoreId} span="2x1" interactive>
                    <StatTile
                      label={store.StoreId}
                      value={`$${store.TotalSales.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                      delta={`${((store.TotalSales / (data.TotalSales || 1)) * 100).toFixed(1)}% del total`}
                      deltaType="positive"
                      icon={Store}
                    />
                  </BentoCard>
                ))
              )}
            </BentoGrid>
          )}
        </>
      )}
    </div>
  )
}
