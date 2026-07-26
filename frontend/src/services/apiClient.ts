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

export interface Store {
  StoreId: string
  Name: string
  Description: string
  OwnerId: string
  Email: string
  Phone: string
  Address: string
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
    delete: (storeId: string, productId: string) =>
      request<{ message: string }>(
        `/products/${encodeURIComponent(productId)}?store_id=${encodeURIComponent(storeId)}`,
        { method: "DELETE" }
      ),
    update: (storeId: string, productId: string, data: Record<string, unknown>) =>
      request<{ message: string; product: Product }>(
        `/products/${encodeURIComponent(productId)}?store_id=${encodeURIComponent(storeId)}`,
        { method: "PATCH", body: JSON.stringify(data) }
      ),
    create: (data: Record<string, unknown>) =>
      request<{ message: string; product: Product }>(
        `/products`,
        { method: "POST", body: JSON.stringify(data) }
      ),
  },

  stores: {
    list: (params?: { limit?: number; nextToken?: string }) => {
      const query = new URLSearchParams()
      if (params?.limit) query.set("limit", String(params.limit))
      if (params?.nextToken) query.set("next_token", params.nextToken)
      const qs = query.toString()
      return request<{ stores: Store[]; count: number; next_token?: string }>(
        `/stores${qs ? `?${qs}` : ""}`
      )
    },
    get: (storeId: string) =>
      request<{ store: Store }>(`/stores/${encodeURIComponent(storeId)}`),
    create: (data: { Name: string; Description: string; OwnerId: string; Email: string; Phone: string; Address: string }) =>
      request<{ message: string; store: Store }>(`/stores`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (storeId: string, data: Record<string, string>) =>
      request<{ message: string; store: Store }>(
        `/stores/${encodeURIComponent(storeId)}`,
        { method: "PATCH", body: JSON.stringify(data) }
      ),
    delete: (storeId: string) =>
      request<{ message: string }>(`/stores/${encodeURIComponent(storeId)}`, {
        method: "DELETE",
      }),
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
    updateStatus: (orderId: string, customerId: string, status: string) =>
      request<Order>(`/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        body: JSON.stringify({ CustomerId: customerId, Status: status }),
      }),
  },

  registrations: {
    register: (email: string, password: string, name: string) =>
      request<{ message: string; data: { user_id: string; email: string; name: string } }>(
        `/registrations`,
        { method: "POST", body: JSON.stringify({ email, password, name }) }
      ),
  },

  users: {
    list: () =>
      request<{ message: string; data: { users: Array<{ id: string; email: string; name: string; role: string; status: string; created_at: string }>; count: number } }>(
        `/users`
      ),
    create: (email: string, password: string, name: string, role: string) =>
      request<{ message: string; data: { user_id: string; email: string; name: string } }>(
        `/registrations`,
        { method: "POST", body: JSON.stringify({ email, password, name, role }) }
      ),
    update: (userId: string, data: { name?: string; password?: string }) =>
      request<{ message: string }>(`/users/${encodeURIComponent(userId)}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (userId: string) =>
      request<{ message: string }>(`/users/${encodeURIComponent(userId)}`, { method: "DELETE" }),
  },

  dashboard: {
    get: () =>
      request<{
        TotalSales: number
        TotalOrders: number
        SalesByStore: Array<{ StoreId: string; TotalSales: number }>
        TopProducts: Array<{ ProductId: string; Name: string; TotalSold: number }>
        OutOfStockProducts: Array<{ ProductId: string; Name: string; StoreId: string }>
        TopCustomers: Array<{ CustomerId: string; OrderCount: number }>
        OrdersByStatus: Record<string, number>
      }>(`/dashboard`),
  },

  audit: {
    list: (params?: { limit?: number; nextToken?: string; userId?: string }) => {
      const query = new URLSearchParams()
      if (params?.limit) query.set("limit", String(params.limit))
      if (params?.nextToken) query.set("next_token", params.nextToken)
      if (params?.userId) query.set("user_id", params.userId)
      const qs = query.toString()
      return request<{
        records: Array<{ UserId: string; Timestamp: string; Action: string; Result: string; Details: string }>
        count: number
        next_token?: string
      }>(`/audit${qs ? `?${qs}` : ""}`)
    },
  },
}
