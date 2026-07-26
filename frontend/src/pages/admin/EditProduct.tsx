import React from "react"
import { useParams } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { ProductoForm } from "@/components/common/ProductoForm"

export function EditProduct() {
  const { storeId, productId } = useParams<{ storeId: string; productId: string }>()

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={`Actualizar Producto: ${productId}`}
        description={`Tienda asociadada: ${storeId}`}
      />
      <ProductoForm
        mode="edit"
        initialData={{
          code: productId,
          storeId: storeId,
          name: "Laptop Gamer Ultra 16GB",
          price: 1299.99,
          stock: 12,
          category: "Electrónica",
          description: "Especificaciones avanzadas de prueba en desarrollo.",
        }}
      />
    </div>
  )
}
