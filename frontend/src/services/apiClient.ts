import { cognitoAuth } from "@/services/cognitoAuth"

const API_URL = import.meta.env.VITE_API_URL

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(status: number, message: string, body: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_URL) {
    throw new Error("VITE_API_URL no está configurada en frontend/.env")
  }

  const session = cognitoAuth.getSession()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  }
  if (session?.idToken) {
    headers["Authorization"] = `Bearer ${session.idToken}`
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })

  const rawBody = await response.text()
  const body = rawBody ? JSON.parse(rawBody) : null

  if (!response.ok) {
    const message = (body && (body.message || body.error)) || `Error HTTP ${response.status}`
    throw new ApiError(response.status, message, body)
  }

  return body as T
}

export interface Product {
  StoreId: string
  ProductId: string
  Name: string
  Price: number
  Stock: number
  Status: string
  [key: string]: unknown
}

export interface CartItem {
  ProductId: string
  Quantity: number
}

export interface Cart {
  ClientId: string
  Items: CartItem[]
}

export interface Order {
  OrderId: string
  CustomerId: string
  StoreId: string
  Items: Array<{ ProductId: string; Name: string; Price: number; Quantity: number }>
  Total: number
  Status: string
  CreatedAt: string
  UpdatedAt: string
}

export const apiClient = {
  products: {
    list: (params?: { storeId?: string; limit?: number; nextToken?: string }) => {
      const query = new URLSearchParams()
      if (params?.storeId) query.set("store_id", params.storeId)
      if (params?.limit) query.set("limit", String(params.limit))
      if (params?.nextToken) query.set("next_token", params.nextToken)
      const qs = query.toString()
      return request<{ products: Product[]; next_token?: string }>(
        `/products${qs ? `?${qs}` : ""}`
      )
    },
    get: (storeId: string, productId: string) =>
      request<Product>(`/products/${encodeURIComponent(productId)}?store_id=${encodeURIComponent(storeId)}`),
  },

  carts: {
    addProduct: (cartId: string, productId: string, quantity: number) =>
      request<{ message: string; cart: Cart }>(
        `/carts/${encodeURIComponent(cartId)}/products/${encodeURIComponent(productId)}`,
        { method: "POST", body: JSON.stringify({ Quantity: quantity }) }
      ),
    modifyQuantity: (cartId: string, productId: string, quantity: number) =>
      request<{ message: string; cart: Cart }>(
        `/carts/${encodeURIComponent(cartId)}/products/${encodeURIComponent(productId)}`,
        { method: "PATCH", body: JSON.stringify({ Quantity: quantity }) }
      ),
    removeProduct: (cartId: string, productId: string) =>
      request<{ message: string; cart: Cart }>(
        `/carts/${encodeURIComponent(cartId)}/products/${encodeURIComponent(productId)}`,
        { method: "DELETE" }
      ),
    clear: (cartId: string) =>
      request<{ message: string; cart: Cart }>(`/carts/${encodeURIComponent(cartId)}`, {
        method: "DELETE",
      }),
  },

  orders: {
    create: (storeId: string) =>
      request<Order>(`/orders`, { method: "POST", body: JSON.stringify({ StoreId: storeId }) }),
    list: (params?: { limit?: number; nextToken?: string }) => {
      const query = new URLSearchParams()
      if (params?.limit) query.set("limit", String(params.limit))
      if (params?.nextToken) query.set("next_token", params.nextToken)
      const qs = query.toString()
      return request<{ orders: Order[]; next_token?: string }>(`/orders${qs ? `?${qs}` : ""}`)
    },
    get: (orderId: string) => request<Order>(`/orders/${encodeURIComponent(orderId)}`),
    cancel: (orderId: string) =>
      request<{ message: string; order: Order }>(`/orders/${encodeURIComponent(orderId)}`, {
        method: "DELETE",
      }),
  },

  registrations: {
    register: (email: string, password: string, name: string) =>
      request<{ message: string; data: { user_id: string; email: string; name: string } }>(
        `/registrations`,
        { method: "POST", body: JSON.stringify({ email, password, name }) }
      ),
  },
}
