import React from "react"
import { useParams } from "react-router-dom"
import { PagePlaceholder } from "@/components/common/PagePlaceholder"

export function EditStore() {
  const { storeId } = useParams<{ storeId: string }>()

  return (
    <PagePlaceholder
      title={`Editar Tienda: ${storeId}`}
      module="Tiendas (Módulo 3)"
      status="Sin backend"
      description="Formulario para actualizar datos generales de la tienda."
    />
  )
}
