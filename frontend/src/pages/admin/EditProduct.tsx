import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { ProductoForm } from "@/components/common/ProductoForm"
import { apiClient, type Product } from "@/services/apiClient"

export function EditProduct() {
  const { storeId, productId } = useParams<{ storeId: string; productId: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProduct() {
      if (!storeId || !productId) return
      try {
        const data = await apiClient.products.get(storeId, productId)
        setProduct(data)
      } catch (error) {
        console.error("Error fetching product:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [storeId, productId])

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground text-sm">Cargando producto...</div>
  }

  if (!product) {
    return <div className="p-8 text-center text-muted-foreground text-sm">Producto no encontrado</div>
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={`Actualizar Producto: ${productId}`}
        description={`Tienda asociada: ${storeId}`}
      />
      <ProductoForm
        mode="edit"
        initialData={{
          code: product.ProductId,
          storeId: product.StoreId,
          name: product.Name,
          price: product.Price,
          stock: product.Stock,
          category: (product.Category as string) || "Electrónica",
          description: (product.Description as string) || "",
        }}
      />
    </div>
  )
}
