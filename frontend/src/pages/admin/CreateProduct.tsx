import React from "react"
import { PageHeader } from "@/components/common/PageHeader"
import { ProductoForm } from "@/components/common/ProductoForm"

export function CreateProduct() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Crear Nuevo Producto"
        description="Registrar un producto en el catálogo global de CloudShop"
      />
      <ProductoForm mode="create" />
    </div>
  )
}
