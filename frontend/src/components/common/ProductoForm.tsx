import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Save, ArrowLeft } from "lucide-react"
import { apiClient } from "@/services/apiClient"

interface ProductoFormProps {
  mode: "create" | "edit"
  initialData?: {
    code?: string
    name?: string
    description?: string
    category?: string
    price?: number
    stock?: number
    storeId?: string
  }
}

export function ProductoForm({ mode, initialData }: ProductoFormProps) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    code: initialData?.code || "",
    name: initialData?.name || "",
    description: initialData?.description || "",
    category: initialData?.category || "Electrónica",
    price: initialData?.price || 0,
    stock: initialData?.stock || 0,
    storeId: initialData?.storeId || "store-001",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (mode === "create") {
        await apiClient.products.create({
          ProductId: formData.code,
          StoreId: formData.storeId,
          Name: formData.name,
          Price: formData.price,
          Stock: formData.stock,
          Category: formData.category,
          Description: formData.description
        })
      } else {
        await apiClient.products.update(formData.storeId, formData.code, {
          Name: formData.name,
          Price: formData.price,
          Stock: formData.stock,
          Category: formData.category,
          Description: formData.description
        })
      }
      navigate("/admin/productos")
    } catch (error) {
      console.error("Error saving product:", error)
      alert("Hubo un error al guardar el producto.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bento-cell space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Code */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Código del Producto (Code)</label>
          <input
            type="text"
            required
            disabled={mode === "edit"}
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="PROD-001"
            className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          />
        </div>

        {/* Name */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Nombre del Producto (Name)</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Laptop Gamer Ultra"
            className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* StoreId */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">ID de la Tienda (StoreId)</label>
          <input
            type="text"
            required
            value={formData.storeId}
            onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
            placeholder="store-001"
            className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Category */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Categoría (Category)</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="Electrónica">Electrónica</option>
            <option value="Ropa">Ropa</option>
            <option value="Hogar">Hogar</option>
            <option value="Deportes">Deportes</option>
            <option value="Alimentos">Alimentos</option>
          </select>
        </div>

        {/* Price */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Precio ($USD)</label>
          <input
            type="number"
            step="0.01"
            required
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            placeholder="999.99"
            className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Stock */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Stock Disponible</label>
          <input
            type="number"
            required
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
            placeholder="50"
            className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Description Textarea */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-foreground">Descripción Completa</label>
        <textarea
          rows={4}
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Escribe las especificaciones y características del producto..."
          className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="pt-4 border-t border-border flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/admin/productos")}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" /> Cancelar
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:opacity-90 transition-opacity"
        >
          <Save className="h-4 w-4" /> {mode === "create" ? "Crear Producto" : "Guardar Cambios"}
        </button>
      </div>
    </form>
  )
}
