import React from "react"
import ReactDOM from "react-dom/client"
import { RouterProvider } from "react-router-dom"
import { router } from "@/routes/router"
import { AuthProvider } from "@/context/AuthContext"
import { CartProvider } from "@/context/CartContext"

import "@fontsource-variable/inter"
import "./styles/index.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>
)
