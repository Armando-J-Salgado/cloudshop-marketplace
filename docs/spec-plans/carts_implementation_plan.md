# Módulo de Carrito — 4 Lambdas en Python

Plan de implementación para las 4 funciones Lambda del módulo de carrito del proyecto CloudShop Marketplace.

## Contexto Arquitectónico

Tras revisar la documentación y el código existente del módulo de pedidos, se identificaron los siguientes patrones clave aplicados al carrito:

| Aspecto | Detalle |
|---|---|
| **Runtime** | Python 3.x |
| **Base de datos** | DynamoDB — tabla `Carts` |
| **Autenticación** | Amazon Cognito (JWT via API Gateway Authorizer) |
| **Patrón de respuesta** | Función auxiliar `_response(status_code, body)` con headers CORS |
| **Variables de entorno** | `CARTS_TABLE_NAME` |

### Esquema de la Tabla Carts (DynamoDB)

```
PK:  ClientId  (String)  → sub del JWT de Cognito (ID único del usuario)

Atributos:
  - Items       (List)    → [{ProductId (String), Quantity (Number)}]
  - CreatedAt   (String)  → ISO 8601
  - UpdatedAt   (String)  → ISO 8601
```

> [!NOTE]
> El carrito **solo almacena IDs de producto y cantidades**. El frontend cachea los nombres/detalles de los productos localmente. Antes de proceder a realizar un pedido, el frontend debe reconfirmar la disponibilidad de productos (front llama primero a productos, luego a pedidos).

### Endpoints del API Gateway

| Método | Ruta | Lambda | Descripción |
|---|---|---|---|
| `POST` | `/carts/items` | `add_product` | Agregar producto al carrito |
| `PATCH` | `/carts/items` | `modify_quantity` | Modificar cantidad de un producto |
| `DELETE` | `/carts/items` | `remove_product` | Eliminar un producto del carrito |
| `DELETE` | `/carts` | `clear_cart` | Vaciar el carrito completo |

---

## Supuestos de Autenticación y Autorización (JWT / Cognito)

> [!IMPORTANT]
> **Las Lambdas NO validan el JWT directamente.** Se asume que API Gateway tendrá configurado un **Cognito User Pool Authorizer** que valida el token antes de invocar la Lambda.

**Flujo esperado:**
1. El cliente envía `Authorization: Bearer <token>` en el header.
2. API Gateway valida el JWT contra el Cognito User Pool.
3. Si es inválido → API Gateway retorna `401` sin invocar la Lambda.
4. Si es válido → API Gateway inyecta los claims decodificados en el evento.

**Estructura de claims que las Lambdas esperan en `event`:**

```python
claims = event["requestContext"]["authorizer"]["claims"]
client_id = claims["sub"]  # ID único del usuario (UUID de Cognito)
```

**Control de acceso:**

El carrito es inherentemente personal — cada usuario solo puede operar sobre su propio carrito (identificado por su `sub` del JWT como `ClientId`). No hay roles de admin/operator para operaciones de carrito.

---

## Proposed Changes

### Estructura de archivos a crear

```
backend/lambdas/carts/
├── add_product/
│   └── lambda_function.py
├── modify_quantity/
│   └── lambda_function.py
├── remove_product/
│   └── lambda_function.py
└── clear_cart/
    └── lambda_function.py
```

---

### Lambda 1 — `add_product` (POST /carts/items)

**Lógica de negocio:**
1. Extraer `ClientId` del JWT Cognito (`event.requestContext.authorizer.claims.sub`).
2. Parsear body: `{ "ProductId": "...", "Quantity": N }` (Quantity default = 1).
3. Validar que `ProductId` no esté vacío y `Quantity` sea entero > 0.
4. Consultar la tabla `Carts` con `GetItem` usando `ClientId`.
5. Si el carrito existe:
   - Si el producto ya está en el carrito → sumar la cantidad.
   - Si el producto no está → agregarlo a la lista.
   - Actualizar `UpdatedAt`.
6. Si el carrito no existe → crear nuevo registro con `ClientId`, `Items`, `CreatedAt` y `UpdatedAt`.
7. Retornar 200 con el carrito actualizado.

**Validaciones:**
- `ProductId` requerido y no vacío.
- `Quantity` debe ser entero >= 1 (default: 1).

---

### Lambda 2 — `modify_quantity` (PATCH /carts/items)

**Lógica de negocio:**
1. Extraer `ClientId` del JWT.
2. Parsear body: `{ "ProductId": "...", "Quantity": N }`.
3. Validar que `ProductId` no esté vacío y `Quantity` sea entero > 0.
4. Consultar la tabla `Carts` con `GetItem`.
5. Verificar que el carrito existe y no está vacío.
6. Buscar el producto en la lista de items.
7. Si no existe → retornar 404.
8. Actualizar la cantidad del producto con el nuevo valor.
9. Guardar la lista actualizada con `UpdateItem` y actualizar `UpdatedAt`.
10. Retornar 200 con el carrito actualizado.

**Validaciones:**
- `ProductId` requerido.
- `Quantity` requerido, entero >= 1.
- El producto debe existir en el carrito.

---

### Lambda 3 — `remove_product` (DELETE /carts/items)

**Lógica de negocio:**
1. Extraer `ClientId` del JWT.
2. Parsear body: `{ "ProductId": "..." }`.
3. Validar que `ProductId` no esté vacío.
4. Consultar la tabla `Carts` con `GetItem`.
5. Verificar que el carrito existe y no está vacío.
6. Filtrar la lista de items para remover el producto indicado.
7. Si el producto no estaba en el carrito → retornar 404.
8. Guardar la lista filtrada con `UpdateItem` y actualizar `UpdatedAt`.
9. Retornar 200 con el carrito actualizado.

**Validaciones:**
- `ProductId` requerido.
- El producto debe existir en el carrito.

---

### Lambda 4 — `clear_cart` (DELETE /carts)

**Lógica de negocio:**
1. Extraer `ClientId` del JWT.
2. Consultar la tabla `Carts` con `GetItem`.
3. Verificar que el carrito existe.
4. Actualizar `Items` a lista vacía `[]` y `UpdatedAt` con `UpdateItem`.
5. Retornar 200 con mensaje de confirmación.

**Nota:** Se utiliza `UpdateItem` en lugar de `DeleteItem` para mantener el registro del usuario en la tabla (permite consultas futuras sin crear nuevo item).

---

## Decisiones de Diseño

| Decisión | Justificación |
|---|---|
| No validar existencia del producto en tabla Products | El front cachea nombres. La validación se hace al crear el pedido. Reduce latencia y acoplamiento. |
| `add_product` suma cantidad si el producto ya existe | UX natural: agregar el mismo producto incrementa la cantidad |
| `modify_quantity` reemplaza la cantidad (no suma) | Permite al usuario establecer una cantidad exacta |
| `clear_cart` no elimina el registro, solo vacía Items | Evita crear/eliminar registros constantemente |
| Sin EventBridge para operaciones de carrito | El carrito es transitorio; no requiere auditoría ni notificaciones |
| `CreatedAt` se establece solo al crear el carrito | Inmutable una vez creado |
| `UpdatedAt` se actualiza en cada operación | Permite tracking de actividad del carrito |

---

## Patrones de Diseño Aplicados

Basado en el código existente del módulo de pedidos:

- **Función helper `_response()`** para respuestas estandarizadas con CORS headers.
- **`DecimalEncoder`** para serializar valores Decimal de DynamoDB a JSON.
- **`boto3.resource("dynamodb")`** inicializado fuera del handler (reutilización de conexiones).
- **Variables de entorno** para nombres de tablas (`os.environ`).
- **Try/except global** para manejar errores no controlados y ocultar stack traces.
- **Validación estricta** del body antes de operar.
- **ISO 8601** para timestamps (`CreatedAt`, `UpdatedAt`).

---

## Variables de Entorno Requeridas

| Variable | Descripción | Usada en |
|---|---|---|
| `CARTS_TABLE_NAME` | Nombre de la tabla DynamoDB de carritos | Todas las Lambdas |

---

## Verification Plan

### Manual Verification
- Verificar que cada archivo Python tenga sintaxis válida (`python -c "import py_compile; py_compile.compile('file.py')"`)
- Verificar que la estructura de carpetas coincida con lo propuesto.
- Revisar que los CORS headers estén presentes en todas las respuestas.
- Confirmar que la variable de entorno `CARTS_TABLE_NAME` sea consistente entre las 4 Lambdas.
- Confirmar que la PK utilizada sea `ClientId` (no `UserId`).

### Test Scenarios

| Lambda | Caso | Resultado esperado |
|---|---|---|
| `add_product` | Body sin ProductId | 400 |
| `add_product` | Producto nuevo en carrito vacío | 200, crea carrito con CreatedAt |
| `add_product` | Producto ya existente | 200, suma cantidad, actualiza UpdatedAt |
| `modify_quantity` | Producto no en carrito | 404 |
| `modify_quantity` | Quantity = 0 | 400 |
| `modify_quantity` | Producto existente, Quantity = 5 | 200, actualiza |
| `remove_product` | Producto no en carrito | 404 |
| `remove_product` | Producto existente | 200, elimina item |
| `clear_cart` | Carrito no existe | 404 |
| `clear_cart` | Carrito con items | 200, Items = [] |
