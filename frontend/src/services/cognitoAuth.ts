import {
  CognitoUser,
  CognitoUserPool,
  AuthenticationDetails,
} from "amazon-cognito-identity-js"
import type { AuthAdapter, AuthSession, AuthUser, UserRole } from "@/services/mockAuth"

const USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID

const STORAGE_KEY = "cloudshop.session"

// El grupo Cognito real es "cliente" (infraestructure/modules/cognito/main.tf);
// el frontend usa "client" como UserRole. Los demás nombres coinciden 1:1.
const GROUP_TO_ROLE: Record<string, UserRole> = {
  admin: "admin",
  operator: "operator",
  cliente: "client",
}

function getUserPool(): CognitoUserPool {
  if (!USER_POOL_ID || !CLIENT_ID) {
    throw new Error(
      "Cognito no está configurado: define VITE_COGNITO_USER_POOL_ID y VITE_COGNITO_CLIENT_ID en frontend/.env"
    )
  }
  return new CognitoUserPool({ UserPoolId: USER_POOL_ID, ClientId: CLIENT_ID })
}

function decodeIdTokenPayload(idToken: string): Record<string, unknown> {
  const payload = idToken.split(".")[1]
  const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
  return JSON.parse(decodeURIComponent(escape(json)))
}

function rolesFromClaims(claims: Record<string, unknown>): UserRole[] {
  const groupsClaim = claims["cognito:groups"]
  const groups = Array.isArray(groupsClaim)
    ? groupsClaim
    : typeof groupsClaim === "string"
      ? [groupsClaim]
      : []

  const roles = groups
    .map((g) => GROUP_TO_ROLE[g as string])
    .filter((r): r is UserRole => Boolean(r))

  return roles.length > 0 ? roles : ["client"]
}

function sessionFromClaims(idToken: string, claims: Record<string, unknown>): AuthSession {
  const roles = rolesFromClaims(claims)
  const user: AuthUser = {
    id: String(claims["sub"]),
    email: String(claims["email"] ?? ""),
    name: String(claims["name"] ?? claims["email"] ?? ""),
    roles,
    ...(claims["custom:storeId"] ? { storeId: String(claims["custom:storeId"]) } : {}),
  }

  return { user, roles, idToken }
}

export const cognitoAuth: AuthAdapter = {
  login(email: string, password: string): Promise<AuthSession> {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({ Username: email.trim(), Pool: getUserPool() })
      const authDetails = new AuthenticationDetails({
        Username: email.trim(),
        Password: password,
      })

      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (result) => {
          const idToken = result.getIdToken().getJwtToken()
          const claims = decodeIdTokenPayload(idToken)
          const session = sessionFromClaims(idToken, claims)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
          resolve(session)
        },
        onFailure: (err) => {
          reject(new Error(err.message || "Credenciales inválidas. Por favor verifica tu correo y contraseña."))
        },
      })
    })
  },

  async logout(): Promise<void> {
    const pool = getUserPool()
    const currentUser = pool.getCurrentUser()
    if (currentUser) {
      currentUser.signOut()
    }
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
