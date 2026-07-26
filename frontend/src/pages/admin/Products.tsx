import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { Plus, Search, Edit, Trash2, AlertCircle, RefreshCw } from "lucide-react"
import { apiClient, ApiError, type Product } from "@/services/apiClient"

export function Products() {
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; storeId: string } | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [nextToken, setNextToken] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await apiClient.products.list({ limit: 50 })
      setProducts(result.products)
      setNextToken(result.next_token)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cargar productos")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadMore = async () => {
    if (!nextToken) return
    setIsLoadingMore(true)
    try {
      const result = await apiClient.products.list({ limit: 50, nextToken })
      setProducts((prev) => [...prev, ...result.products])
      setNextToken(result.next_token)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cargar más productos")
    } finally {
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await apiClient.products.delete(deleteTarget.storeId, deleteTarget.id)
      setProducts(products.filter((p) => !(p.ProductId === deleteTarget.id && p.StoreId === deleteTarget.storeId)))
      setDeleteTarget(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al eliminar el producto")
      setDeleteTarget(null)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogo Global de Productos"
        description="Gestión centralizada de productos registrados por todas las tiendas"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={fetchProducts}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <Link
              to="/admin/productos/nuevo"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" /> Crear Producto
            </Link>
          </div>
        }
      />

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bento-cell space-y-4">
        <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-xl border border-border max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por código, nombre o tienda..."
            className="w-full text-xs bg-transparent focus:outline-none"
          />
        </div>

        {isLoading ? (
          <p className="text-xs text-muted-foreground">Cargando productos...</p>
        ) : (
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
                {products.map((p) => (
                  <tr key={`${p.StoreId}-${p.ProductId}`} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-foreground">{p.ProductId}</td>
                    <td className="py-3 px-4 font-semibold text-foreground">{p.Name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{p.StoreId}</td>
                    <td className="py-3 px-4">{(p as any).Category || "—"}</td>
                    <td className="py-3 px-4 font-bold text-foreground">${Number(p.Price).toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.Stock > 10
                            ? "bg-emerald-500/10 text-emerald-600"
                            : p.Stock > 0
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-rose-500/10 text-rose-600"
                        }`}
                      >
                        {p.Stock} un.
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Link
                        to={`/admin/productos/${p.StoreId}/${p.ProductId}/editar`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors"
                      >
                        <Edit className="h-3 w-3" /> Editar
                      </Link>
                      <button
                        onClick={() => setDeleteTarget({ id: p.ProductId, storeId: p.StoreId })}
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
        )}

        {!isLoading && nextToken && (
          <div className="flex justify-center pt-2">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="px-5 py-2.5 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {isLoadingMore ? "Cargando..." : "Cargar más productos"}
            </button>
          </div>
        )}
      </div>

      {/* AlertDialog Delete Confirmation */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50" onClick={() => setDeleteTarget(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">¿Eliminar producto {deleteTarget.id}?</h3>
            <p className="text-xs text-muted-foreground">
              Esta acción desactivará el producto del catálogo global (soft delete). El producto dejará de ser visible para los clientes.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs shadow-md hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Eliminando..." : "Confirmar eliminación"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
