import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { useAuth } from "@/hooks/useAuth"
import { Search, Edit3, AlertTriangle, RefreshCw, AlertCircle } from "lucide-react"
import { apiClient, ApiError, type Product } from "@/services/apiClient"

export function Inventory() {
  const { user } = useAuth()
  const operatorStoreId = user?.storeId || ""
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInventory = async () => {
    if (!operatorStoreId) return
    setIsLoading(true)
    setError(null)
    try {
      const result = await apiClient.products.list({ storeId: operatorStoreId, limit: 100 })
      setProducts(result.products)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cargar inventario")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchInventory() }, [operatorStoreId])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario de Tienda"
        description={`Gestión de productos y stock para la tienda ${operatorStoreId || "(sin asignar)"}`}
        badge={operatorStoreId ? (
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold">
            Tienda: {operatorStoreId.slice(0, 8)}...
          </span>
        ) : undefined}
        action={
          <button onClick={fetchInventory} disabled={isLoading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        }
      />

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span>
        </div>
      )}

      <div className="bento-cell space-y-4">
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Cargando inventario...</p>
        ) : products.length === 0 ? (
          <p className="text-xs text-muted-foreground">No hay productos en esta tienda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-3 px-4 font-semibold">Código</th>
                  <th className="py-3 px-4 font-semibold">Producto</th>
                  <th className="py-3 px-4 font-semibold">Precio</th>
                  <th className="py-3 px-4 font-semibold">Stock Actual</th>
                  <th className="py-3 px-4 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((item) => {
                  const isOutOfStock = item.Stock === 0
                  const isLowStock = item.Stock > 0 && item.Stock <= 5
                  return (
                    <tr key={item.ProductId} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-foreground text-[11px]">{item.ProductId.slice(0, 8)}...</td>
                      <td className="py-3 px-4 font-semibold text-foreground">{item.Name}</td>
                      <td className="py-3 px-4 font-bold text-foreground">${Number(item.Price).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isOutOfStock ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                          : isLowStock ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                        }`}>
                          {(isOutOfStock || isLowStock) && <AlertTriangle className="h-3 w-3" />}
                          {item.Stock} unidades
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link to={`/operacion/inventario/${item.ProductId}`}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-500/20 transition-colors">
                          <Edit3 className="h-3 w-3" /> Ajustar Stock
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
