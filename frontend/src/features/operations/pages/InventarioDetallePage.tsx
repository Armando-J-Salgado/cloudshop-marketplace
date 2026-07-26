import React, { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { useRole } from "@/context/RoleContext"
import { ArrowLeft, Save, Boxes } from "lucide-react"

export function InventarioDetallePage() {
  const { productId } = useParams<{ productId: string }>()
  const { operatorStoreId } = useRole()
  const navigate = useNavigate()
  const [stock, setStock] = useState(12)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Demo save and return
    navigate("/operacion/inventario")
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link
        to="/operacion/inventario"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al inventario
      </Link>

      <PageHeader
        title={`Ajuste de Stock: ${productId}`}
        description={`Único campo editable por el Operador de la tienda ${operatorStoreId}`}
      />

      <form onSubmit={handleSubmit} className="bento-cell space-y-6">
        <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground font-medium">Producto:</span>
            <span className="font-bold text-foreground">Laptop Gamer Ultra 16GB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground font-medium">Categoría:</span>
            <span className="font-semibold text-foreground">Electrónica</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground font-medium">Precio Venta:</span>
            <span className="font-semibold text-foreground">$1,299.99</span>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <label className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
            <Boxes className="h-4 w-4 text-emerald-600" /> Cantidad en Stock (Unidades Disponibles)
          </label>
          <input
            type="number"
            min="0"
            required
            value={stock}
            onChange={(e) => setStock(parseInt(e.target.value) || 0)}
            className="w-full text-lg font-extrabold px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <p className="text-[11px] text-muted-foreground">
            Nota: Modificar el stock actualizará la disponibilidad inmediata en el catálogo público para los clientes.
          </p>
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-md hover:bg-emerald-700 transition-colors"
          >
            <Save className="h-4 w-4" /> Guardar Ajuste de Stock
          </button>
        </div>
      </form>
    </div>
  )
}
