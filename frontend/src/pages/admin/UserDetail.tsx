import React, { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { ArrowLeft, Save, AlertCircle, Trash2 } from "lucide-react"
import { apiClient, ApiError } from "@/services/apiClient"

export function UserDetail() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [newName, setNewName] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    if (!newName && !newPassword) {
      setError("Debe proporcionar al menos un campo para actualizar")
      return
    }
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)
    try {
      const data: { name?: string; password?: string } = {}
      if (newName.trim()) data.name = newName.trim()
      if (newPassword) data.password = newPassword
      await apiClient.users.update(userId, data)
      setSuccess("Usuario actualizado exitosamente")
      setNewName("")
      setNewPassword("")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al actualizar")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!userId) return
    setIsDeleting(true)
    try {
      await apiClient.users.delete(userId)
      navigate("/admin/usuarios")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al desactivar usuario")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title={`Administración de Usuario`}
        description={`ID: ${userId}`}
        action={
          <Link to="/admin/usuarios"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted">
            <ArrowLeft className="h-4 w-4" /> Volver al listado
          </Link>
        }
      />

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bento-cell space-y-6">
        <div className="space-y-4">
          <h3 className="text-base font-bold text-foreground">Detalles de la cuenta</h3>
          <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs">
            <span className="text-muted-foreground font-medium">ID del Usuario: </span>
            <span className="font-mono font-bold text-foreground">{userId}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-border space-y-4">
          <h3 className="text-base font-bold text-foreground">Actualizar Datos</h3>
          <div className="grid grid-cols-1 gap-4 text-xs">
            <div>
              <label className="font-semibold text-foreground">Nuevo Nombre (opcional)</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                placeholder="Dejar vacío para no cambiar"
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="font-semibold text-foreground">Nueva Contraseña (opcional)</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mín 8 chars, mayúscula, minúscula, número, símbolo"
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between">
          <button type="button" onClick={handleDelete} disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-600 font-semibold text-xs hover:bg-rose-500/20 transition-colors disabled:opacity-50">
            <Trash2 className="h-4 w-4" /> {isDeleting ? "Desactivando..." : "Desactivar Usuario"}
          </button>
          <button type="submit" disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:opacity-90 transition-opacity disabled:opacity-50">
            <Save className="h-4 w-4" /> {isSubmitting ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  )
}
