import React, { useState } from "react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { Plus, Search, Edit, Trash2 } from "lucide-react"

export function Products() {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const sampleProducts = [
    { id: "PROD-001", storeId: "store-001", name: "Laptop Gamer Ultra", price: 1299.99, stock: 12, category: "Electrónica" },
    { id: "PROD-002", storeId: "store-001", name: "Audífonos Pro", price: 129.99, stock: 45, category: "Electrónica" },
    { id: "PROD-003", storeId: "store-002", name: "Silla Ergonómica", price: 249.50, stock: 8, category: "Hogar" },
    { id: "PROD-004", storeId: "store-003", name: "Zapatillas Running", price: 89.90, stock: 0, category: "Deportes" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogo Global de Productos"
        description="Gestión centralizada de productos registrados por todas las tiendas"
        action={
          <Link
            to="/admin/productos/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Crear Producto
          </Link>
        }
      />

      <div className="bento-cell space-y-4">
        <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-xl border border-border max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por código, nombre o tienda..."
            className="w-full text-xs bg-transparent focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-3 px-4 font-semibold">Código</th>
                <th className="py-3 px-4 font-semibold">Producto</th>
                <th className="py-3 px-4 font-semibold">Tienda</th>
                <th className="py-3 px-4 font-semibold">Categoría</th>
                <th className="py-3 px-4 font-semibold">Precio</th>
                <th className="py-3 px-4 font-semibold">Stock</th>
                <th className="py-3 px-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sampleProducts.map((p) => (
                <tr key={`${p.storeId}-${p.id}`} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-foreground">{p.id}</td>
                  <td className="py-3 px-4 font-semibold text-foreground">{p.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{p.storeId}</td>
                  <td className="py-3 px-4">{p.category}</td>
                  <td className="py-3 px-4 font-bold text-foreground">${p.price.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.stock > 10
                          ? "bg-emerald-500/10 text-emerald-600"
                          : p.stock > 0
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-rose-500/10 text-rose-600"
                      }`}
                    >
                      {p.stock} un.
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <Link
                      to={`/admin/productos/${p.storeId}/${p.id}/editar`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors"
                    >
                      <Edit className="h-3 w-3" /> Editar
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(p.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 font-semibold hover:bg-rose-500/20 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" /> Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AlertDialog Delete Confirmation */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50" onClick={() => setDeleteTarget(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">¿Eliminar producto {deleteTarget}?</h3>
            <p className="text-xs text-muted-foreground">
              Esta acción eliminará permanentemente el producto del catálogo global. Esta operación no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs shadow-md hover:bg-rose-700 transition-colors"
              >
                Confirmar eliminación
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
