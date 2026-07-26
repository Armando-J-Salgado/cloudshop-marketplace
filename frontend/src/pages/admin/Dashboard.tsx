import React from "react"
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
} from "lucide-react"

export function Dashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Ejecutivo"
        description="Módulo 6 del ASD · Demostración visual Bentomorphism (Skin Admin)"
        badge={
          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-bold">
            Sin backend (Hardcoded demo)
          </span>
        }
      />

      <BentoGrid>
        {/* Total Sales: 2x1 */}
        <BentoCard span="2x1" interactive>
          <StatTile
            label="Total de Ventas Globales"
            value="$128,450.00"
            delta="+14.2% vs mes anterior"
            deltaType="positive"
            icon={DollarSign}
            description="Acumulado año 2026"
          />
        </BentoCard>

        {/* Store Sales: 2x1 */}
        <BentoCard span="2x1" interactive>
          <StatTile
            label="Ventas por Tienda Destacada"
            value="$42,890.50"
            delta="Tienda Tech Central"
            deltaType="neutral"
            icon={Store}
            description="33.4% del volumen total"
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
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-foreground">Completados (1,240)</span>
                <span className="text-emerald-600 font-bold">78%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "78%" }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-foreground">En Preparación (180)</span>
                <span className="text-amber-600 font-bold">11%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "11%" }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-foreground">Creados / Pendientes (95)</span>
                <span className="text-blue-600 font-bold">6%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "6%" }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-foreground">Cancelados (75)</span>
                <span className="text-rose-600 font-bold">5%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: "5%" }} />
              </div>
            </div>
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
            {[
              { name: "Laptop Gamer Ultra", qty: "340 un.", store: "store-001" },
              { name: "Audífonos Bluetooth", qty: "280 un.", store: "store-001" },
              { name: "Silla Ergonómica", qty: "190 un.", store: "store-002" },
              { name: "Zapatillas Run", qty: "150 un.", store: "store-003" },
            ].map((prod, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-muted/40 border border-border/60 text-xs">
                <p className="font-bold text-foreground truncate">{prod.name}</p>
                <div className="flex justify-between text-[11px] text-muted-foreground mt-0.5">
                  <span>{prod.store}</span>
                  <span className="font-extrabold text-primary">{prod.qty}</span>
                </div>
              </div>
            ))}
          </div>
        </BentoCard>

        {/* Out of Stock: 1x1 */}
        <BentoCard span="1x1" interactive>
          <StatTile
            label="Productos Agotados"
            value="14"
            delta="Requiere atención"
            deltaType="negative"
            icon={AlertOctagon}
          />
        </BentoCard>

        {/* Top Clients: 2x1 */}
        <BentoCard span="2x1" interactive>
          <StatTile
            label="Top Cliente del Mes"
            value="María López"
            delta="18 Pedidos • $4,250.00"
            deltaType="positive"
            icon={Award}
            description="Cliente categoría Platinum"
          />
        </BentoCard>
      </BentoGrid>
    </div>
  )
}
