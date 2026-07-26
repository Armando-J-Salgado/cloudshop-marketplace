# Pendientes y Bloqueadores de Integración (CloudShop)

Este documento registra los hallazgos técnicos y desacoples detectados durante la construcción de la Fase 1 del Frontend. Estos puntos deberán atenderse en las iteraciones de backend e infraestructura.

---

### 1. Clave inconsistente en `create_order`
- **Ubicación:** `backend/lambdas/orders/create_order/lambda_function.py` (Líneas 42 y 104)
- **Detalle:** `create_order` lee el carrito utilizando `Key={"UserId": customer_id}`, mientras que todas las lambdas del módulo de carritos (`backend/lambdas/carts/`) escriben en DynamoDB usando la clave `ClientId`.
- **Efecto:** `POST /orders` siempre responde `"El carrito está vacío"` y la transacción de compra falla.
- **Acción requerida:** Unificar la clave de partición en las lambdas a `ClientId` o `UserId`.

---

### 2. `register-user` no produce cuentas usables en Cognito
- **Ubicación:** `backend/lambdas/users/register-user/handler.py`
- **Detalles:**
  1. Utiliza `MessageAction='SUPPRESS_DETAIL_MESSAGE'`, que es un valor sintácticamente inválido para la API de Cognito (`ValidationException` / 500).
  2. Invoca `admin_create_user` sin realizar posteriormente `admin_set_user_password(Permanent=True)`, dejando al usuario en estado `FORCE_CHANGE_PASSWORD`.
  3. No asigna el usuario a su grupo de Cognito (`admin_add_user_to_group`).
- **Efecto:** El flujo de registro desde la API no genera usuarios que puedan autenticarse.

---

### 3. Inconsistencia de atributos y grupos de Rol
- **Detalle:** Las lambdas de `orders/` verifican autorización examinando `cognito:groups` (`admin`, `operator`, `cliente`), mientras que `users/` escribe el rol en `custom:role = "client"`.
- **Acción requerida:** Definir los grupos de Cognito como la fuente única de verdad para el control de acceso basado en roles (RBAC).

---

### 4. Formato de respuesta e integración Proxy en `users/` y `notifications/`
- **Detalle:** Las lambdas de los módulos `users/` y `notifications/` retornan el diccionario de respuesta directamente (`return {"statusCode": 200, "body": ...}`), en lugar de serializar `body` como `json.dumps(...)` y sin los encabezados `Access-Control-Allow-Origin`.
- **Efecto:** API Gateway con integración PROXY falla con error 502 Bad Gateway y los navegadores bloquean la petición por política CORS.

---

### 5. Ausencia total de Backend para Tiendas y Dashboard Ejecutivo
- **Detalle:** Los módulos 3 (*Tiendas*) y 6 (*Dashboard Ejecutivo*) del ASD cuentan con 0 Lambdas implementadas en `backend/lambdas/`.
- **Efecto:** Las pantallas de estos módulos funcionan únicamente como vistas de previsualización (placeholders) en el frontend.

---

### 6. Sin mecanismo para vincular Operador a Tienda (`Store.OwnerId`)
- **Detalle:** El ASD establece `Store.OwnerId` como la clave foránea (FK) hacia un usuario con rol `Operador`. Sin backend de Tiendas, no existe `PATCH /stores/{id}` para escribir esa relación ni un endpoint que filtre la tienda perteneciente al operador autenticado.
- **Efecto:** Las pantallas `/operacion/*` dependen completamente de esta relación para filtrar su alcance. Además, en el backend actual `is_admin = "admin" in groups or "operator" in groups` le da a un operador visibilidad global sobre todas las tiendas.

---

### 7. Modelo de persistencia de Carrito incompleto
- **Detalle:** No existe un endpoint `GET /carts`, y la tabla DynamoDB de carritos no persiste `StoreId`, a pesar de que la tabla `Products` utiliza una clave compuesta `StoreId + ProductId`.
- **Efecto:** El estado del carrito en servidor es insuficiente para reconstruir la orden. El frontend debe mantener localmente la estructura completa `{ProductId, StoreId, Name, Price, Quantity}`.

---

### 8. Divergencia en las rutas REST del Carrito
- **Detalle:** El diagrama ASD especifica el endpoint `DELETE /carts/:id/products/:productId`, pero la implementación en backend responde en `/carts/items`.
- **Acción requerida:** Actualizar la documentación OpenAPI/diagrama ASD o ajustar el handler de la Lambda.

---

### 9. Estado "EN_PREPARACION" no contemplado en validación de pedidos
- **Detalle:** El ASD y el flujo operativo exigen el estado `"EN_PREPARACION"`, pero la función `update_order_status` en backend no lo incluye dentro de su lista `VALID_STATUSES`.
