import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { Lock, Mail, ArrowRight, AlertCircle, KeyRound } from "lucide-react"

export function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login(email, password)
      navigate("/catalogo")
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  const setSeed = (seedEmail: string, seedPass: string) => {
    setEmail(seedEmail)
    setPassword(seedPass)
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="w-full bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-3">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Iniciar Sesión</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Autenticación con Cognito SDK (Adaptador Mock Fase 1)
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@ejemplo.com"
                className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Contraseña</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></span>
            ) : (
              <>
                Ingresar <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-border text-center text-xs">
          <span className="text-muted-foreground">¿No tienes una cuenta? </span>
          <Link to="/registro" className="font-bold text-primary hover:underline">
            Regístrate gratis
          </Link>
        </div>
      </div>

      {/* Helper Box with Seed Credentials */}
      <div className="bg-muted/60 border border-border rounded-2xl p-4 text-xs space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-foreground">
          <KeyRound className="h-4 w-4 text-primary" /> Cuentas Semilla para Pruebas:
        </div>
        <div className="grid grid-cols-1 gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setSeed("admin@cloudshop.test", "Admin123!")}
            className="text-left p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors flex items-center justify-between"
          >
            <div>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">Administrador: </span>
              <span className="text-muted-foreground">admin@cloudshop.test</span>
            </div>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-700 px-1.5 py-0.5 rounded font-mono">
              Admin123!
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSeed("operador@cloudshop.test", "Operador123!")}
            className="text-left p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors flex items-center justify-between"
          >
            <div>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">Operador: </span>
              <span className="text-muted-foreground">operador@cloudshop.test</span>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-700 px-1.5 py-0.5 rounded font-mono">
              Operador123!
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSeed("cliente@cloudshop.test", "Cliente123!")}
            className="text-left p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors flex items-center justify-between"
          >
            <div>
              <span className="font-bold text-amber-600 dark:text-amber-400">Cliente: </span>
              <span className="text-muted-foreground">cliente@cloudshop.test</span>
            </div>
            <span className="text-[10px] bg-amber-500/10 text-amber-700 px-1.5 py-0.5 rounded font-mono">
              Cliente123!
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
