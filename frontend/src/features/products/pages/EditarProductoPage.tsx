import React from "react"
import { useParams } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { ProductoForm } from "../components/ProductoForm"

export function EditarProductoPage() {
  const { storeId, productId } = useParams<{ storeId: string; productId: string }>()

  const sampleData = {
    code: productId || "PROD-101",
    name: "Audífonos Bluetooth Pro",
    description: "Audífonos de alta fidelidad con cancelación de ruido activa.",
    category: "Electrónica",
    price: 129.99,
    stock: 25,
    storeId: storeId || "store-001",
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={`Editar Producto: ${productId}`}
        description={`Actualización de catálogo para la tienda ${storeId}`}
      />
      <ProductoForm mode="edit" initialData={sampleData} />
    </div>
  )
}
