import React from "react"
import { useParams } from "react-router-dom"
import { PagePlaceholder } from "@/components/common/PagePlaceholder"

export function DetalleTiendaPage() {
  const { storeId } = useParams<{ storeId: string }>()
  return (
    <PagePlaceholder
      title={`Perfil de Tienda: ${storeId}`}
      module="Tiendas (Módulo 3)"
      status="Sin backend"
      description="Vista pública con catálogo de productos comercializados exclusivamente por esta tienda."
    />
  )
}
