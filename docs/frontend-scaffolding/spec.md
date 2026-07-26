# Especificación Técnica — Frontend CloudShop (Fase 1: Scaffolding, Design System y Mapa de Rutas)

## Resumen Ejecutivo

Esta especificación materializa la estructura inicial y esqueleto navegable del Frontend para la plataforma **CloudShop Marketplace**, dando cumplimiento al roadmap definido y la arquitectura expuesta en el documento ASD (`Cloudshop - ASD.docx`).

Dado que la infraestructura backend (API Gateway, Cognito, DynamoDB) aún no cuenta con URLs públicas desplegadas, la Fase 1 garantiza una SPA totalmente autónoma, navegable e interactiva que permite validar la experiencia de usuario (UX), los tres layouts principales y la identidad visual previa a la integración de servicios HTTP.

---

## 1. Stack Tecnológico

| Área | Tecnología Seleccionada | Justificación Técnica |
|---|---|---|
| **Build & Environment** | Vite 6 + React 19 + TypeScript | Compilación ultrarrápida, soporte nativo HMR y tipado estricto para evitar errores de casing en modelos DynamoDB PascalCase (`Price`, `StoreId`). |
| **Estilos & Diseño** | Tailwind CSS v4 (`@tailwindcss/vite`) | Configuración CSS-first mediante `@theme inline`, `@utility` y custom variables OKLCH sin necesidad de `tailwind.config.js`. |
| **Componentes UI** | shadcn/ui (`new-york`, `zinc`) | Código fuente integrado en el repositorio para fácil personalización de celdas Bento y componentes. |
| **Enrutamiento** | React Router v7 (`createBrowserRouter`) | Soporte nativo para rutas anidadas, derivación de layouts y compatibilidad con SPA fallback en CloudFront. |
| **Iconografía & Feedback** | `lucide-react`, `sonner` | Librerías de iconos vectoriales y notificaciones ligeras. |
| **Tipografía** | Inter Variable (`@fontsource-variable/inter`) | Autohospedada para evitar llamadas a CDNs externas que puedan ser bloqueadas por políticas CSP de CloudFront. |

---

## 2. Sistema de Diseño (Dual Skin Architecture)

El sistema de diseño implementa dos pieles visuales conmutables automáticamente mediante el atributo `data-skin` en el elemento raíz `<html>`:

1. **Cliente Skin (`[data-skin="client"]`)**:
   - **Estética**: Comercial, limpia y aireada.
   - **Lienzo**: Fondo blanco con bordes visibles (`--border: oklch(0.92 0.005 265)`), radio de curvatura tenue (`--radius: 0.625rem / 10px`) y azul primario CloudShop.

2. **Administrador Skin (`[data-skin="admin"]` - Bentomorphism)**:
   - **Estética**: Panel ejecutivo basado en elevaciones, capas y celdas redondeadas flotantes.
   - **Lienzo**: Gris frío de fondo (`--background: oklch(0.965 0.005 265)`) con celdas blancas flotantes (`--card: oklch(1 0 0)`), bordes invisibles/hairline (`--border: oklch(0 0 0 / .045)`), sombra profunda difusa y radio pronunciado (`--radius-bento: 1.75rem / 28px`).
   - **Cifras**: Todas las métricas numéricas emplean la propiedad CSS `tabular-nums` para alineación vertical perfecta.

---

## 3. Mapa Completo de Rutas (32 Rutas)

### 3.1. Shell `AuthLayout` (Skin Cliente, centrado)
- `/login` — Inicio de sesión (SDK Cognito directo)
- `/registro` — Registro de cuenta (`POST /registrations`)

### 3.2. Shell `ShopLayout` (Skin Cliente, Header + Carrito)
- `/` → Redirección a `/catalogo`
- `/catalogo` — Catálogo de productos
- `/catalogo/:storeId/:productId` — Ficha de detalle de producto
- `/carrito` — Carrito de compras
- `/checkout` — Confirmación de pedido
- `/pedidos` — Consulta de pedidos cliente
- `/pedidos/:orderId` — Detalle y cancelación de pedido
- `/tiendas` & `/tiendas/:storeId` — Vistas placeholder de tiendas (Sin Backend)
- `/perfil` — Gestión de perfil de usuario

### 3.3. Shell `AdminLayout` (Skin Admin / Bentomorphism)
- `/admin` — Dashboard Ejecutivo Principal (Parrilla Bento 6 widgets)
- `/admin/reportes/ventas-por-tienda` — Reporte Ventas por Tienda (Placeholder)
- `/admin/reportes/mas-vendidos` — Reporte Productos Más Vendidos (Placeholder)
- `/admin/reportes/agotados` — Reporte Productos Agotados (Placeholder)
- `/admin/reportes/top-clientes` — Reporte Top Clientes (Placeholder)
- `/admin/usuarios` — Listado y búsqueda de usuarios
- `/admin/usuarios/:userId` — Edición de rol y estado de usuario
- `/admin/productos` — Catálogo global de productos con eliminación mediante `AlertDialog`
- `/admin/productos/nuevo` — Creación de producto (**Página dedicada**)
- `/admin/productos/:storeId/:productId/editar` — Edición de producto (**Página dedicada**)
- `/admin/tiendas`, `/admin/tiendas/nueva`, `/admin/tiendas/:storeId/editar` — Vistas de administración de tiendas (Sin Backend)
- `/admin/tiendas/:storeId` — Detalle de tienda y componente de asignación de Operador (`Store.OwnerId`)
- `/admin/pedidos` — Consulta de pedidos globales
- `/admin/pedidos/:customerId/:orderId` — Gestión y cambio de estado de pedido
- `/admin/perfil` — Vista de perfil administrador

### 3.4. Shell de Operador (Skin Admin / Bentomorphism)
- `/operacion` → Redirección a `/operacion/inventario`
- `/operacion/inventario` — Inventario de su tienda (Stock, alertas de stock bajo y agotados)
- `/operacion/inventario/:productId` — Ficha y **Ajuste de Stock** (único campo editable por operador)
- `/operacion/pedidos` — Pedidos dirigidos a su tienda
- `/operacion/pedidos/:customerId/:orderId` — Atención, aceptación/rechazo y despacho de pedido
