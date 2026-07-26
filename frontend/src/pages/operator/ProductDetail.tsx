import React, { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { useAuth } from "@/hooks/useAuth"
import { ArrowLeft, Save, Boxes, AlertCircle } from "lucide-react"
import { apiClient, ApiError, type Product } from "@/services/apiClient"

export function ProductDetail() {
  const { productId } = useParams<{ productId: string }>()
  const { user } = useAuth()
  const operatorStoreId = user?.storeId || ""
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [stock, setStock] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!productId || !operatorStoreId) return
    apiClient.products.get(operatorStoreId, productId)
      .then((p) => { setProduct(p); setStock(p.Stock) })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Error al cargar producto"))
      .finally(() => setIsLoading(false))
  }, [productId, operatorStoreId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productId || !operatorStoreId) return
    setError(null)
    setIsSubmitting(true)
    try {
      await apiClient.products.update(operatorStoreId, productId, { Stock: stock })
      navigate("/operacion/inventario")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al actualizar stock")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <p className="text-xs text-muted-foreground p-6">Cargando producto...</p>

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link to="/operacion/inventario"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver al inventario
      </Link>

      <PageHeader
        title={`Ajuste de Stock: ${product?.Name || productId}`}
        description={`Tienda: ${operatorStoreId}`}
      />

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bento-cell space-y-6">
        {product && (
          <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Producto:</span>
              <span className="font-bold text-foreground">{product.Name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Precio:</span>
              <span className="font-semibold text-foreground">${Number(product.Price).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Estado:</span>
              <span className="font-semibold text-foreground">{product.Status}</span>
            </div>
          </div>
        )}

        <div className="space-y-2 pt-2 border-t border-border">
          <label className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
            <Boxes className="h-4 w-4 text-emerald-600" /> Cantidad en Stock
          </label>
          <input type="number" min="0" required value={stock}
            onChange={(e) => setStock(parseInt(e.target.value) || 0)}
            className="w-full text-lg font-extrabold px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
          <p className="text-[11px] text-muted-foreground">
            Modificar el stock actualizará la disponibilidad inmediata en el catálogo.
          </p>
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <button type="submit" disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-md hover:bg-emerald-700 transition-colors disabled:opacity-50">
            <Save className="h-4 w-4" /> {isSubmitting ? "Guardando..." : "Guardar Ajuste de Stock"}
          </button>
        </div>
      </form>
    </div>
  )
}
