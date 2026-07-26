export class ApiError extends Error {
  status: number
  body: unknown
  constructor(status: number, message: string, body: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

export interface Product { StoreId: string; ProductId: string; Name: string; Price: number; Stock: number; Status: string; [key: string]: unknown }
export interface CartItem { ProductId: string; Quantity: number }
export interface Cart { ClientId: string; Items: CartItem[] }
export interface Order { OrderId: string; CustomerId: string; StoreId: string; Items: Array<{ ProductId: string; Name: string; Price: number; Quantity: number }>; Total: number; Status: string; CreatedAt: string; UpdatedAt: string }
export interface Store { StoreId: string; Name: string; Description: string; OwnerId: string; Email: string; Phone: string; Address: string; Status: string; CreatedAt: string; UpdatedAt: string }

// Fake Data Stores (In Memory)
let mockStores: Store[] = [
  { StoreId: "store-001", Name: "Cloudshop XY Mall", Description: "Tienda principal de hardware en XY Mall", OwnerId: "usr-op-001", Email: "xy@cloudshop.test", Phone: "555-0101", Address: "XY Mall, L-12", Status: "ACTIVE", CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString() },
  { StoreId: "store-002", Name: "Cloud Shop Mexico City", Description: "Hardware premium en CDMX", OwnerId: "usr-op-002", Email: "cdmx@cloudshop.test", Phone: "555-0202", Address: "Reforma 222", Status: "ACTIVE", CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString() }
];

let mockProducts: Product[] = [
  { StoreId: "store-001", ProductId: "prod-101", Name: "NVIDIA GeForce RTX 4090", Price: 1599.00, Stock: 5, Status: "ACTIVE" },
  { StoreId: "store-001", ProductId: "prod-102", Name: "AMD Ryzen 9 7950X", Price: 599.00, Stock: 12, Status: "ACTIVE" },
  { StoreId: "store-001", ProductId: "prod-103", Name: "Samsung 990 PRO 2TB NVMe SSD", Price: 189.99, Stock: 25, Status: "ACTIVE" },
  { StoreId: "store-001", ProductId: "prod-104", Name: "Corsair Vengeance RGB 32GB DDR5", Price: 114.99, Stock: 40, Status: "ACTIVE" },
  { StoreId: "store-002", ProductId: "prod-201", Name: "ASUS ROG Maximus Z790 Hero", Price: 629.99, Stock: 8, Status: "ACTIVE" }
];

let mockOrders: Order[] = [];
let mockCarts: Record<string, Cart> = {}; // CartId (usually clientId) -> Cart

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const apiClient = {
  products: {
    list: async (params?: { storeId?: string; limit?: number; nextToken?: string }) => {
      await delay(300);
      let res = mockProducts;
      if (params?.storeId) res = res.filter(p => p.StoreId === params.storeId);
      return { products: res };
    },
    get: async (storeId: string, productId: string) => {
      await delay(200);
      const p = mockProducts.find(p => p.StoreId === storeId && p.ProductId === productId);
      if (!p) throw new ApiError(404, "Product not found", {});
      return p;
    },
    delete: async (storeId: string, productId: string) => {
      await delay(300);
      mockProducts = mockProducts.filter(p => !(p.StoreId === storeId && p.ProductId === productId));
      return { message: "Deleted" };
    },
    update: async (storeId: string, productId: string, data: Record<string, unknown>) => {
      await delay(300);
      const idx = mockProducts.findIndex(p => p.StoreId === storeId && p.ProductId === productId);
      if (idx === -1) throw new ApiError(404, "Product not found", {});
      mockProducts[idx] = { ...mockProducts[idx], ...data } as Product;
      return { message: "Updated", product: mockProducts[idx] };
    },
    create: async (data: Record<string, unknown>) => {
      await delay(400);
      const newProduct: Product = {
        StoreId: data.StoreId as string || "store-001",
        ProductId: `prod-${Math.random().toString(36).substring(7)}`,
        Name: data.Name as string || "New Product",
        Price: Number(data.Price) || 0,
        Stock: Number(data.Stock) || 0,
        Status: data.Status as string || "ACTIVE",
        ...data
      };
      mockProducts.push(newProduct);
      return { message: "Created", product: newProduct };
    }
  },

  stores: {
    list: async (params?: { limit?: number; nextToken?: string }) => {
      await delay(300);
      return { stores: mockStores, count: mockStores.length };
    },
    get: async (storeId: string) => {
      await delay(200);
      const s = mockStores.find(s => s.StoreId === storeId);
      if (!s) throw new ApiError(404, "Store not found", {});
      return { store: s };
    },
    create: async (data: any) => {
      await delay(400);
      const s: Store = { StoreId: `store-${Date.now()}`, Status: "ACTIVE", CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString(), ...data };
      mockStores.push(s);
      return { message: "Created", store: s };
    },
    update: async (storeId: string, data: any) => {
      await delay(300);
      const idx = mockStores.findIndex(s => s.StoreId === storeId);
      if (idx === -1) throw new ApiError(404, "Not found", {});
      mockStores[idx] = { ...mockStores[idx], ...data, UpdatedAt: new Date().toISOString() };
      return { message: "Updated", store: mockStores[idx] };
    },
    delete: async (storeId: string) => {
      await delay(300);
      mockStores = mockStores.filter(s => s.StoreId !== storeId);
      return { message: "Deleted" };
    }
  },

  carts: {
    addProduct: async (cartId: string, productId: string, quantity: number) => {
      await delay(200);
      if (!mockCarts[cartId]) mockCarts[cartId] = { ClientId: cartId, Items: [] };
      const cart = mockCarts[cartId];
      const item = cart.Items.find(i => i.ProductId === productId);
      if (item) item.Quantity += quantity;
      else cart.Items.push({ ProductId: productId, Quantity: quantity });
      return { message: "Added", cart };
    },
    modifyQuantity: async (cartId: string, productId: string, quantity: number) => {
      await delay(200);
      const cart = mockCarts[cartId];
      if (!cart) throw new ApiError(404, "Cart not found", {});
      const item = cart.Items.find(i => i.ProductId === productId);
      if (item) item.Quantity = quantity;
      return { message: "Modified", cart };
    },
    removeProduct: async (cartId: string, productId: string) => {
      await delay(200);
      const cart = mockCarts[cartId];
      if (cart) {
        cart.Items = cart.Items.filter(i => i.ProductId !== productId);
      }
      return { message: "Removed", cart: cart || { ClientId: cartId, Items: [] } };
    },
    clear: async (cartId: string) => {
      await delay(200);
      mockCarts[cartId] = { ClientId: cartId, Items: [] };
      return { message: "Cleared", cart: mockCarts[cartId] };
    }
  },

  orders: {
    create: async (storeId: string) => {
      await delay(500);
      const cartId = Object.keys(mockCarts)[0] || "usr-cli-001";
      const cart = mockCarts[cartId] || { ClientId: cartId, Items: [] };
      
      const items = cart.Items.map(i => {
        const prod = mockProducts.find(p => p.ProductId === i.ProductId);
        if (prod) prod.Stock = Math.max(0, prod.Stock - i.Quantity);
        return {
          ProductId: i.ProductId,
          Name: prod ? prod.Name : "Unknown",
          Price: prod ? prod.Price : 0,
          Quantity: i.Quantity
        };
      });

      const total = items.reduce((acc, curr) => acc + (curr.Price * curr.Quantity), 0);

      const order: Order = {
        OrderId: `ORD-${Date.now()}`,
        CustomerId: cart.ClientId,
        StoreId: storeId,
        Items: items,
        Total: total,
        Status: "CONFIRMED",
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString()
      };
      mockOrders.push(order);
      mockCarts[cartId] = { ClientId: cartId, Items: [] };
      return order;
    },
    list: async () => {
      await delay(300);
      return { orders: mockOrders };
    },
    get: async (orderId: string) => {
      await delay(200);
      const o = mockOrders.find(o => o.OrderId === orderId);
      if (!o) throw new ApiError(404, "Not found", {});
      return o;
    },
    cancel: async (orderId: string) => {
      await delay(300);
      const o = mockOrders.find(o => o.OrderId === orderId);
      if (!o) throw new ApiError(404, "Not found", {});
      o.Status = "CANCELLED";
      return { message: "Cancelled", order: o };
    },
    updateStatus: async (orderId: string, customerId: string, status: string) => {
      await delay(300);
      const o = mockOrders.find(o => o.OrderId === orderId);
      if (!o) throw new ApiError(404, "Not found", {});
      o.Status = status;
      return o;
    }
  },

  registrations: {
    register: async () => ({ message: "Mock register", data: { user_id: "mock", email: "", name: "" } })
  },
  users: {
    list: async () => ({ message: "ok", data: { users: [], count: 0 } }),
    create: async () => ({ message: "ok", data: { user_id: "u", email: "", name: "" } }),
    update: async () => ({ message: "ok" }),
    delete: async () => ({ message: "ok" })
  },
  dashboard: {
    get: async () => {
      await delay(400);
      return {
        TotalSales: mockOrders.reduce((acc, curr) => acc + curr.Total, 0),
        TotalOrders: mockOrders.length,
        SalesByStore: mockStores.map(s => ({ StoreId: s.StoreId, TotalSales: 0 })),
        TopProducts: mockProducts.slice(0, 3).map(p => ({ ProductId: p.ProductId, Name: p.Name, TotalSold: Math.floor(Math.random() * 10) })),
        OutOfStockProducts: mockProducts.filter(p => p.Stock === 0).map(p => ({ ProductId: p.ProductId, Name: p.Name, StoreId: p.StoreId })),
        TopCustomers: [{ CustomerId: "usr-cli-001", OrderCount: mockOrders.length }],
        OrdersByStatus: { "CONFIRMED": mockOrders.length }
      };
    }
  },
  audit: {
    list: async () => {
      await delay(300);
      return {
        records: mockOrders.map(o => ({
          UserId: o.CustomerId,
          Timestamp: o.CreatedAt,
          Action: "CREATE_ORDER",
          Result: "SUCCESS",
          Details: `Created order ${o.OrderId}`
        }))
      };
    }
  }
}
