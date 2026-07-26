import React from "react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { useAuth } from "@/hooks/useAuth"
import { Search, Edit3, AlertTriangle } from "lucide-react"

export function Inventory() {
  const { user } = useAuth()
  const operatorStoreId = user?.storeId || "store-001"

  const inventory = [
    { id: "PROD-001", name: "Laptop Gamer Ultra 16GB", category: "Electrónica", stock: 12, minStock: 5, price: 1299.99 },
    { id: "PROD-002", name: "Audífonos Bluetooth Noise Cancelling", category: "Electrónica", stock: 2, minStock: 10, price: 129.99 },
    { id: "PROD-005", name: "Mouse Inalámbrico Ergonómico", category: "Electrónica", stock: 0, minStock: 15, price: 35.00 },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario de Tienda"
        description={`Gestión exclusiva de productos y stock para la tienda ${operatorStoreId}`}
        badge={
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold">
            Tienda: {operatorStoreId}
          </span>
        }
      />

      <div className="bento-cell space-y-4">
        <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-xl border border-border max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por código o producto..."
            className="w-full text-xs bg-transparent focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-3 px-4 font-semibold">Código</th>
                <th className="py-3 px-4 font-semibold">Producto</th>
                <th className="py-3 px-4 font-semibold">Categoría</th>
                <th className="py-3 px-4 font-semibold">Precio</th>
                <th className="py-3 px-4 font-semibold">Stock Actual</th>
                <th className="py-3 px-4 font-semibold">Mínimo Requerido</th>
                <th className="py-3 px-4 font-semibold text-right">Acción Operador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inventory.map((item) => {
                const isOutOfStock = item.stock === 0
                const isLowStock = item.stock > 0 && item.stock <= item.minStock

                return (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-foreground">{item.id}</td>
                    <td className="py-3 px-4 font-semibold text-foreground">{item.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{item.category}</td>
                    <td className="py-3 px-4 font-bold text-foreground">${item.price.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isOutOfStock
                            ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                            : isLowStock
                            ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                        }`}
                      >
                        {isOutOfStock && <AlertTriangle className="h-3 w-3" />}
                        {isLowStock && <AlertTriangle className="h-3 w-3" />}
                        {item.stock} unidades
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{item.minStock} un.</td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/operacion/inventario/${item.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-500/20 transition-colors"
                      >
                        <Edit3 className="h-3 w-3" /> Ajustar Stock
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
