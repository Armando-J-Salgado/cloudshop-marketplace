import React from "react"
import { useNavigate } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { CheckCircle2, CreditCard, MapPin, Truck } from "lucide-react"

export function CheckoutPage() {
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Demo navigation to customer order page
    navigate("/pedidos/ord-88392")
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Confirmación de Pedido (Checkout)"
        description="Verifica tus datos de envío y confirma la creación del pedido"
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {/* Shipping Address */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Dirección de Envío
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Dirección completa</label>
                <input
                  type="text"
                  required
                  defaultValue="Av. Las Magnolias #123, San Salvador"
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Teléfono de contacto</label>
                  <input
                    type="text"
                    required
                    defaultValue="+503 7890 1234"
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Código Postal</label>
                  <input
                    type="text"
                    defaultValue="CP 1101"
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" /> Método de Pago
            </h3>
            <p className="text-xs text-muted-foreground">
              En este demo de Fase 1, el pedido se registrará directamente con estado <strong>CREADO</strong>.
            </p>
          </div>
        </div>

        {/* Final Order Confirmation Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 h-fit">
          <h3 className="text-base font-bold text-foreground border-b border-border pb-3">Resumen de Pago</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Total Productos:</span>
              <span className="font-semibold text-foreground">$1,559.97</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Envío:</span>
              <span className="font-semibold text-foreground">$15.00</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-foreground pt-3 border-t border-border">
              <span>Total a pagar:</span>
              <span className="text-primary text-lg">$1,574.97</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" /> Procesar Pedido
          </button>
        </div>
      </form>
    </div>
  )
}
