import React, { useEffect, useState } from "react"
import { PageHeader } from "@/components/common/PageHeader"
import { Search, FileText, RefreshCw, AlertCircle } from "lucide-react"
import { apiClient, ApiError } from "@/services/apiClient"

interface AuditRecord {
  UserId: string
  Timestamp: string
  Action: string
  Result: string
  Details: string
}

export function AuditLogs() {
  const [records, setRecords] = useState<AuditRecord[]>([])
  const [nextToken, setNextToken] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchAudit = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiClient.audit.list({ limit: 50 })
      setRecords(data.records)
      setNextToken(data.next_token)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cargar los registros de auditoría")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadMore = async () => {
    if (!nextToken) return
    setIsLoadingMore(true)
    try {
      const data = await apiClient.audit.list({ limit: 50, nextToken })
      setRecords((prev) => [...prev, ...data.records])
      setNextToken(data.next_token)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cargar más registros")
    } finally {
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchAudit()
  }, [])

  const filtered = records.filter((r) => {
    const term = searchTerm.toLowerCase()
    return (
      r.UserId.toLowerCase().includes(term) ||
      r.Action.toLowerCase().includes(term) ||
      r.Result.toLowerCase().includes(term)
    )
  })

  const formatDate = (timestamp: string) => {
    const datePart = timestamp.split("#")[0]
    try {
      return new Date(datePart).toLocaleString()
    } catch {
      return timestamp
    }
  }

  const getActionColor = (action: string) => {
    if (action.includes("DELETE") || action.includes("CANCEL")) return "bg-rose-500/10 text-rose-600"
    if (action.includes("CREATE") || action.includes("REGISTER")) return "bg-emerald-500/10 text-emerald-600"
    if (action.includes("UPDATE") || action.includes("MODIFY")) return "bg-amber-500/10 text-amber-600"
    return "bg-blue-500/10 text-blue-600"
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registros de Auditoría"
        description="Trazabilidad de acciones relevantes del sistema (EventBridge → DynamoDB)"
        action={
          <button
            onClick={fetchAudit}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Refrescar
          </button>
        }
      />

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bento-cell space-y-4">
        <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-xl border border-border max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por usuario, acción o resultado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-transparent focus:outline-none"
          />
        </div>

        {isLoading ? (
          <p className="text-xs text-muted-foreground">Cargando registros...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-semibold">No se encontraron registros de auditoría</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-3 px-4 font-semibold">Fecha</th>
                  <th className="py-3 px-4 font-semibold">Usuario</th>
                  <th className="py-3 px-4 font-semibold">Acción</th>
                  <th className="py-3 px-4 font-semibold">Resultado</th>
                  <th className="py-3 px-4 font-semibold">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((record, idx) => (
                  <tr key={`${record.UserId}-${record.Timestamp}-${idx}`} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                      {formatDate(record.Timestamp)}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-foreground text-[11px]">
                      {record.UserId.slice(0, 12)}...
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${getActionColor(record.Action)}`}>
                        {record.Action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          record.Result === "SUCCESS" || record.Result === "EXITOSO"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-rose-500/10 text-rose-600"
                        }`}
                      >
                        {record.Result}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-[200px] truncate text-muted-foreground text-[11px]">
                      {record.Details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && nextToken && (
          <div className="flex justify-center pt-2">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="px-5 py-2.5 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {isLoadingMore ? "Cargando..." : "Cargar más registros"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
