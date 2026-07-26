export type UserRole = "admin" | "operator" | "client"

export interface AuthUser {
  id: string
  email: string
  name: string
  roles: UserRole[]
  storeId?: string
}

export interface AuthSession {
  user: AuthUser
  roles: UserRole[]
  idToken: string
}

export interface AuthAdapter {
  login(email: string, password: string): Promise<AuthSession>
  logout(): Promise<void>
  getSession(): AuthSession | null
}

const SEED_USERS: Record<string, { password: string; user: AuthUser }> = {
  "admin@cloudshop.test": {
    password: "Admin123!",
    user: {
      id: "usr-admin-001",
      email: "admin@cloudshop.test",
      name: "Administrador Global",
      roles: ["admin"],
    },
  },
  "operador@cloudshop.test": {
    password: "Operador123!",
    user: {
      id: "usr-op-001",
      email: "operador@cloudshop.test",
      name: "Operador Tienda Tech",
      roles: ["operator"],
      storeId: "store-001",
    },
  },
  "cliente@cloudshop.test": {
    password: "Cliente123!",
    user: {
      id: "usr-cli-001",
      email: "cliente@cloudshop.test",
      name: "Cliente Demo",
      roles: ["client"],
    },
  },
}

const STORAGE_KEY = "cloudshop.session"

export const mockAuth: AuthAdapter = {
  async login(email: string, password: string): Promise<AuthSession> {
    // Simulate network delay
    await new Promise((res) => setTimeout(res, 400))

    const entry = SEED_USERS[email.trim().toLowerCase()]
    if (!entry || entry.password !== password) {
      throw new Error("Credenciales invalidas. Por favor verifica tu correo y contraseña.")
    }

    const session: AuthSession = {
      user: entry.user,
      roles: entry.user.roles,
      idToken: `mock-jwt-token-${Date.now()}`,
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    return session
  },

  async logout(): Promise<void> {
    await new Promise((res) => setTimeout(res, 200))
    localStorage.removeItem(STORAGE_KEY)
  },

  getSession(): AuthSession | null {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as AuthSession
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
  },
}
