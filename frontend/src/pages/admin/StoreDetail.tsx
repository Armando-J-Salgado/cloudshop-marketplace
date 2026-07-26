import React, { useState } from "react"
import { useParams } from "react-router-dom"
import { PagePlaceholder } from "@/components/common/PagePlaceholder"
import { UserCheck, Search } from "lucide-react"

export function StoreDetail() {
  const { storeId } = useParams<{ storeId: string }>()
  const [operatorSearch, setOperatorSearch] = useState("")
  const [assignedOperator, setAssignedOperator] = useState({
    id: "usr-op-001",
    name: "Operador Tienda Tech",
    email: "operador@cloudshop.test",
  })

  const availableOperators = [
    { id: "usr-op-001", name: "Operador Tienda Tech", email: "operador@cloudshop.test" },
    { id: "usr-006", name: "Elena Gómez (Operadora)", email: "elena@sportgoods.com" },
    { id: "usr-007", name: "Jorge Ramírez (Operador)", email: "jorge@hogarconfort.com" },
  ]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PagePlaceholder
        title={`Detalle de Tienda: ${storeId}`}
        module="Tiendas (Módulo 3)"
        status="Sin backend"
        description="Esta pantalla permite consultar la información de la tienda, cambiar su estado de activación y asignar un usuario Operador."
      />

      {/* Operator Assignment Section */}
      <div className="bento-cell space-y-4 border-2 border-primary/20">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">Operador Asignado (`Store.OwnerId`)</h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
            FK Vinculada
          </span>
        </div>

        {/* Current Operator Card */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              {assignedOperator.name.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">{assignedOperator.name}</p>
              <p className="text-[11px] text-muted-foreground">{assignedOperator.email}</p>
              <span className="text-[10px] font-mono text-muted-foreground">ID: {assignedOperator.id}</span>
            </div>
          </div>
        </div>

        {/* Command Search to Reassign Operator */}
        <div className="space-y-2 pt-2 border-t border-border">
          <label className="text-xs font-semibold text-foreground">Reasignar Operador (Filtro por rol = "operator")</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={operatorSearch}
              onChange={(e) => setOperatorSearch(e.target.value)}
              placeholder="Buscar operador por nombre o correo..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none"
            />
          </div>

          {operatorSearch && (
            <div className="p-2 bg-card border border-border rounded-xl space-y-1 max-h-40 overflow-y-auto">
              {availableOperators
                .filter(
                  (op) =>
                    op.name.toLowerCase().includes(operatorSearch.toLowerCase()) ||
                    op.email.toLowerCase().includes(operatorSearch.toLowerCase())
                )
                .map((op) => (
                  <button
                    key={op.id}
                    onClick={() => {
                      setAssignedOperator(op)
                      setOperatorSearch("")
                    }}
                    className="w-full p-2 text-left text-xs rounded-lg hover:bg-muted flex items-center justify-between"
                  >
                    <span>
                      <strong>{op.name}</strong> ({op.email})
                    </span>
                    <span className="text-[10px] text-primary font-bold">Asignar</span>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
