import React, { useEffect, useState } from "react"
import { PageHeader } from "@/components/common/PageHeader"
import { BentoGrid } from "@/components/bento/BentoGrid"
import { BentoCard } from "@/components/bento/BentoCard"
import { StatTile } from "@/components/bento/StatTile"
import {
  DollarSign,
  ShoppingBag,
  Store,
  TrendingUp,
  AlertOctagon,
  Award,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
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

export function Dashboard() {
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
      setError(err instanceof ApiError ? err.message : "Error al cargar el dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  const totalOrders = data ? Object.values(data.OrdersByStatus).reduce((a, b) => a + b, 0) : 0

  const getStatusPercentage = (status: string) => {
    if (!data || totalOrders === 0) return 0
    return Math.round(((data.OrdersByStatus[status] || 0) / totalOrders) * 100)
  }

  const topStore = data?.SalesByStore.sort((a, b) => b.TotalSales - a.TotalSales)[0]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Ejecutivo"
        description="Módulo 6 · Métricas consolidadas en tiempo real"
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

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Cargando métricas del dashboard...</p>
      ) : !data ? (
        <p className="text-xs text-muted-foreground">No se pudieron obtener datos.</p>
      ) : (
        <BentoGrid>
          {/* Total Sales: 2x1 */}
          <BentoCard span="2x1" interactive>
            <StatTile
              label="Total de Ventas Globales"
              value={`$${data.TotalSales.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
              delta={`${data.TotalOrders} pedidos registrados`}
              deltaType="positive"
              icon={DollarSign}
              description="Acumulado total"
            />
          </BentoCard>

          {/* Store Sales: 2x1 */}
          <BentoCard span="2x1" interactive>
            <StatTile
              label="Tienda con Más Ventas"
              value={topStore ? `$${topStore.TotalSales.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$0.00"}
              delta={topStore?.StoreId || "Sin datos"}
              deltaType="neutral"
              icon={Store}
              description={topStore ? `${((topStore.TotalSales / (data.TotalSales || 1)) * 100).toFixed(1)}% del volumen total` : ""}
            />
          </BentoCard>

          {/* Orders by Status: 2x2 */}
          <BentoCard
            span="2x2"
            title="Pedidos por Estado"
            subtitle="Desglose operativo en tiempo real"
            action={
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <ShoppingBag className="h-5 w-5" />
              </div>
            }
          >
            <div className="space-y-3 py-2">
              {Object.entries(data.OrdersByStatus).map(([status, count]) => {
                const pct = getStatusPercentage(status)
                const colorMap: Record<string, string> = {
                  DELIVERED: "bg-emerald-500",
                  CONFIRMED: "bg-blue-500",
                  IN_PREPARATION: "bg-amber-500",
                  SHIPPED: "bg-indigo-500",
                  PENDING: "bg-sky-500",
                  CANCELLED: "bg-rose-500",
                }
                const textColorMap: Record<string, string> = {
                  DELIVERED: "text-emerald-600",
                  CONFIRMED: "text-blue-600",
                  IN_PREPARATION: "text-amber-600",
                  SHIPPED: "text-indigo-600",
                  PENDING: "text-sky-600",
                  CANCELLED: "text-rose-600",
                }
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-foreground">{status} ({count})</span>
                      <span className={`font-bold ${textColorMap[status] || "text-muted-foreground"}`}>{pct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colorMap[status] || "bg-muted-foreground"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </BentoCard>

          {/* Best Sellers: 1x2 */}
          <BentoCard
            span="1x2"
            title="Más Vendidos"
            subtitle="Top productos"
            action={<TrendingUp className="h-5 w-5 text-primary" />}
          >
            <div className="space-y-3">
              {data.TopProducts.slice(0, 5).map((prod, idx) => (
                <div key={prod.ProductId} className="p-2.5 rounded-xl bg-muted/40 border border-border/60 text-xs">
                  <p className="font-bold text-foreground truncate">{prod.Name}</p>
                  <div className="flex justify-between text-[11px] text-muted-foreground mt-0.5">
                    <span>#{idx + 1}</span>
                    <span className="font-extrabold text-primary">{prod.TotalSold} un.</span>
                  </div>
                </div>
              ))}
              {data.TopProducts.length === 0 && (
                <p className="text-xs text-muted-foreground">Sin datos aún.</p>
              )}
            </div>
          </BentoCard>

          {/* Out of Stock: 1x1 */}
          <BentoCard span="1x1" interactive>
            <StatTile
              label="Productos Agotados"
              value={String(data.OutOfStockProducts.length)}
              delta={data.OutOfStockProducts.length > 0 ? "Requiere atención" : "Todo en stock"}
              deltaType={data.OutOfStockProducts.length > 0 ? "negative" : "positive"}
              icon={AlertOctagon}
            />
          </BentoCard>

          {/* Top Clients: 2x1 */}
          <BentoCard span="2x1" interactive>
            <StatTile
              label="Top Cliente"
              value={data.TopCustomers[0]?.CustomerId || "Sin datos"}
              delta={data.TopCustomers[0] ? `${data.TopCustomers[0].OrderCount} Pedidos realizados` : ""}
              deltaType="positive"
              icon={Award}
              description="Cliente con más compras"
            />
          </BentoCard>
        </BentoGrid>
      )}
    </div>
  )
}
