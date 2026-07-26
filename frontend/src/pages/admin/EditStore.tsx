import React, { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { ArrowLeft, Save, AlertCircle } from "lucide-react"
import { apiClient, ApiError, type Store } from "@/services/apiClient"

export function EditStore() {
  const { storeId } = useParams<{ storeId: string }>()
  const navigate = useNavigate()
  const [store, setStore] = useState<Store | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({ Name: "", Description: "", Email: "", Phone: "", Address: "" })

  useEffect(() => {
    if (!storeId) return
    apiClient.stores.get(storeId)
      .then((res) => {
        setStore(res.store)
        setForm({
          Name: res.store.Name || "",
          Description: res.store.Description || "",
          Email: res.store.Email || "",
          Phone: res.store.Phone || "",
          Address: res.store.Address || "",
        })
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Error al cargar tienda"))
      .finally(() => setIsLoading(false))
  }, [storeId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!storeId) return
    setError(null)
    setIsSubmitting(true)
    try {
      await apiClient.stores.update(storeId, form)
      navigate(`/admin/tiendas/${storeId}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al actualizar tienda")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <p className="text-xs text-muted-foreground p-6">Cargando tienda...</p>

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title={`Editar Tienda: ${store?.Name || storeId}`}
        description="Actualizar datos generales de la tienda"
        action={
          <Link to={`/admin/tiendas/${storeId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
        }
      />

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bento-cell space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="sm:col-span-2">
            <label className="font-semibold text-foreground">Nombre</label>
            <input type="text" name="Name" value={form.Name} onChange={handleChange} required
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="sm:col-span-2">
            <label className="font-semibold text-foreground">Descripción</label>
            <textarea name="Description" value={form.Description} onChange={handleChange} required rows={3}
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="font-semibold text-foreground">Email</label>
            <input type="email" name="Email" value={form.Email} onChange={handleChange} required
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="font-semibold text-foreground">Teléfono</label>
            <input type="text" name="Phone" value={form.Phone} onChange={handleChange} required
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="sm:col-span-2">
            <label className="font-semibold text-foreground">Dirección</label>
            <input type="text" name="Address" value={form.Address} onChange={handleChange} required
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
        <div className="pt-4 border-t border-border flex justify-end">
          <button type="submit" disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:opacity-90 transition-opacity disabled:opacity-50">
            <Save className="h-4 w-4" /> {isSubmitting ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  )
}
