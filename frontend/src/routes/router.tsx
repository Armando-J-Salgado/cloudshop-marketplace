import React from "react"
import { createBrowserRouter, Navigate } from "react-router-dom"
import { AuthLayout } from "@/layouts/AuthLayout"
import { ShopLayout } from "@/layouts/ShopLayout"
import { AdminLayout } from "@/layouts/AdminLayout"
import { ProtectedRoute } from "@/components/guards/ProtectedRoute"

/* Auth Pages */
import { Login } from "@/pages/auth/Login"
import { Register } from "@/pages/auth/Register"

/* Client Pages */
import { Catalog } from "@/pages/client/Catalog"
import { ProductDetail as ClientProductDetail } from "@/pages/client/ProductDetail"
import { Cart } from "@/pages/client/Cart"
import { Checkout } from "@/pages/client/Checkout"
import { Orders } from "@/pages/client/Orders"
import { OrderDetail } from "@/pages/client/OrderDetail"
import { Stores as ClientStores } from "@/pages/client/Stores"
import { StoreDetail as ClientStoreDetail } from "@/pages/client/StoreDetail"

/* Admin Pages */
import { Dashboard } from "@/pages/admin/Dashboard"
import { Reports } from "@/pages/admin/Reports"
import { Users } from "@/pages/admin/Users"
import { UserDetail } from "@/pages/admin/UserDetail"
import { Products as AdminProducts } from "@/pages/admin/Products"
import { CreateProduct } from "@/pages/admin/CreateProduct"
import { EditProduct } from "@/pages/admin/EditProduct"
import { Stores as AdminStores } from "@/pages/admin/Stores"
import { CreateStore } from "@/pages/admin/CreateStore"
import { EditStore } from "@/pages/admin/EditStore"
import { StoreDetail as AdminStoreDetail } from "@/pages/admin/StoreDetail"
import { AdminOrders } from "@/pages/admin/AdminOrders"
import { AdminOrderDetail } from "@/pages/admin/AdminOrderDetail"
import { AuditLogs } from "@/pages/admin/AuditLogs"
import { CreateUser } from "@/pages/admin/CreateUser"

/* Operator Pages */
import { Inventory } from "@/pages/operator/Inventory"
import { ProductDetail as OperatorProductDetail } from "@/pages/operator/ProductDetail"
import { StoreOrders } from "@/pages/operator/StoreOrders"
import { UpdateOrderStatus } from "@/pages/operator/UpdateOrderStatus"

/* Profile Page */
import { Profile } from "@/pages/profile/Profile"

/* Error Pages */
import { AccessDeniedPage } from "@/pages/AccessDeniedPage"
import { NotFoundPage } from "@/pages/NotFoundPage"

export const router = createBrowserRouter([
  /* Auth Shell */
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/registro", element: <Register /> },
    ],
  },

  /* Client Shop Shell */
  {
    element: <ShopLayout />,
    children: [
      { path: "/", element: <Navigate to="/catalogo" replace /> },
      { path: "/catalogo", element: <Catalog /> },
      { path: "/catalogo/:storeId/:productId", element: <ClientProductDetail /> },
      { path: "/carrito", element: <Cart /> },
      { path: "/checkout", element: <Checkout /> },
      { path: "/pedidos", element: <Orders /> },
      { path: "/pedidos/:orderId", element: <OrderDetail /> },
      { path: "/tiendas", element: <ClientStores /> },
      { path: "/tiendas/:storeId", element: <ClientStoreDetail /> },
      { path: "/perfil", element: <Profile /> },
    ],
  },

  /* Admin & Operator Bento Shell */
  {
    element: <AdminLayout />,
    children: [
      /* Admin Routes */
      {
        path: "/admin",
        element: (
          <ProtectedRoute allow={["admin"]}>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/reportes/ventas-por-tienda",
        element: (
          <ProtectedRoute allow={["admin"]}>
            <Reports />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/reportes/mas-vendidos",
        element: (
          <ProtectedRoute allow={["admin"]}>
            <Reports />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/reportes/agotados",
        element: (
          <ProtectedRoute allow={["admin"]}>
            <Reports />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/reportes/top-clientes",
        element: (
          <ProtectedRoute allow={["admin"]}>
            <Reports />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/usuarios",
        element: (
          <ProtectedRoute allow={["admin"]}>
            <Users />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/usuarios/nuevo",
        element: (
          <ProtectedRoute allow={["admin"]}>
            <CreateUser />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/usuarios/:userId",
        element: (
          <ProtectedRoute allow={["admin"]}>
            <UserDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/auditoria",
        element: (
          <ProtectedRoute allow={["admin"]}>
            <AuditLogs />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/productos",
        element: (
          <ProtectedRoute allow={["admin"]}>
            <AdminProducts />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/productos/nuevo",
        element: (
          <ProtectedRoute allow={["admin"]}>
            <CreateProduct />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/productos/:storeId/:productId/editar",
        element: (
          <ProtectedRoute allow={["admin"]}>
            <EditProduct />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/tiendas",
        element: (
          <ProtectedRoute allow={["admin"]}>
            <AdminStores />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/tiendas/nueva",
        element: (
          <ProtectedRoute allow={["admin"]}>
            <CreateStore />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/tiendas/:storeId/editar",
        element: (
          <ProtectedRoute allow={["admin"]}>
            <EditStore />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/tiendas/:storeId",
        element: (
          <ProtectedRoute allow={["admin"]}>
            <AdminStoreDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/pedidos",
        element: (
          <ProtectedRoute allow={["admin"]}>
            <AdminOrders />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/pedidos/:customerId/:orderId",
        element: (
          <ProtectedRoute allow={["admin"]}>
            <AdminOrderDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/perfil",
        element: (
          <ProtectedRoute allow={["admin", "operator"]}>
            <Profile />
          </ProtectedRoute>
        ),
      },

      /* Operator Routes */
      { path: "/operacion", element: <Navigate to="/operacion/inventario" replace /> },
      {
        path: "/operacion/inventario",
        element: (
          <ProtectedRoute allow={["operator"]}>
            <Inventory />
          </ProtectedRoute>
        ),
      },
      {
        path: "/operacion/inventario/:productId",
        element: (
          <ProtectedRoute allow={["operator"]}>
            <OperatorProductDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: "/operacion/pedidos",
        element: (
          <ProtectedRoute allow={["operator"]}>
            <StoreOrders />
          </ProtectedRoute>
        ),
      },
      {
        path: "/operacion/pedidos/:customerId/:orderId",
        element: (
          <ProtectedRoute allow={["operator"]}>
            <UpdateOrderStatus />
          </ProtectedRoute>
        ),
      },
    ],
  },

  /* Error Routes */
  { path: "/403", element: <AccessDeniedPage /> },
  { path: "*", element: <NotFoundPage /> },
])
