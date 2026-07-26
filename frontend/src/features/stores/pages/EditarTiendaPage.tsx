import React from "react"
import { useParams } from "react-router-dom"
import { PagePlaceholder } from "@/components/common/PagePlaceholder"

export function EditarTiendaPage() {
  const { storeId } = useParams<{ storeId: string }>()
  return (
    <PagePlaceholder
      title={`Editar Tienda: ${storeId}`}
      module="Tiendas (Módulo 3)"
      status="Sin backend"
      description="Modificación de metadatos y estado operacional de la tienda."
    />
  )
}
