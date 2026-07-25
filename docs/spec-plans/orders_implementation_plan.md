# Módulo de Pedidos — 5 Lambdas en Python

Plan de implementación para las 5 funciones Lambda del módulo de pedidos del proyecto CloudShop Marketplace.

## Contexto Arquitectónico

Tras revisar toda la documentación y el código existente, se identificaron los siguientes patrones clave:

| Aspecto | Detalle |
|---|---|
| **Runtime** | Python 3.x (como se pide en la solicitud) |
| **Base de datos** | DynamoDB — tabla `Orders` |
| **Autenticación** | Amazon Cognito (JWT via API Gateway Authorizer) |
| **Eventos** | EventBridge para `OrderStatusChanged` → auditoría y notificaciones SES |
| **Patrón de respuesta** | Función auxiliar `_response(status_code, body)` con headers CORS |
| **Variables de entorno** | `ORDERS_TABLE_NAME`, `PRODUCTS_TABLE_NAME`, `CARTS_TABLE_NAME`, `EVENT_BUS_NAME` |

### Esquema de la Tabla Orders (DynamoDB)

```
PK:  CustomerId  (String)  → sub del JWT de Cognito
SK:  OrderId     (String)  → UUID v4 generado al crear el pedido

Atributos:
  - StoreId       (String)
  - Items         (List)    → [{ProductId, Name, Price, Quantity}]
  - Total         (Number)  → Decimal, suma de Price × Quantity
  - Status        (String)  → PENDING | CONFIRMED | SHIPPED | DELIVERED | CANCELLED
  - CreatedAt     (String)  → ISO 8601
  - UpdatedAt     (String)  → ISO 8601
```

> [!NOTE]
> Con `CustomerId` como PK y `OrderId` como SK, las consultas de pedidos por cliente usan `Query` (eficiente) en lugar de `Scan`. Para obtener un pedido por ID se necesitan ambas keys (PK + SK). Los admins que necesiten ver todos los pedidos usarán `Scan`.

### Endpoints del API Gateway (del diagrama de APIs)

| Método | Ruta | Lambda | Descripción |
|---|---|---|---|
| `POST` | `/orders` | `create_order` | Crear pedido desde el carrito |
| `GET` | `/orders` | `get_orders` | Obtener pedidos (del usuario o todos si admin) |
| `GET` | `/orders/{id}` | `get_order_by_id` | Obtener pedido por ID |
| `PATCH` | `/orders/{id}` | `update_order_status` | Actualizar estado del pedido |
| `DELETE` | `/orders/{id}` | `cancel_order` | Cancelar pedido |

---

## Supuestos de Autenticación y Autorización (JWT / Cognito)

> [!IMPORTANT]
> **Las Lambdas NO validan el JWT directamente.** Se asume que API Gateway tendrá configurado un **Cognito User Pool Authorizer** que valida el token antes de invocar la Lambda. Este es el mismo patrón usado en [lab7](file:///c:/Users/tatod/OneDrive/Documentos/ESEN/Ciclo 8/Nube/cloudbox-enterprise/lab7/lambda/getFiles/index.js) y [cloudbox-enterprise](file:///c:/Users/tatod/OneDrive/Documentos/ESEN/Ciclo 8/Nube/Segunda_parte/cloudbox-enterprise/backend/producer/index.js).

**Flujo esperado:**
1. El cliente envía `Authorization: Bearer <token>` en el header.
2. API Gateway valida el JWT contra el Cognito User Pool (firma, expiración, audience).
3. Si es inválido → API Gateway retorna `401` sin invocar la Lambda.
4. Si es válido → API Gateway inyecta los claims decodificados en el evento.

**Estructura de claims que las Lambdas esperan en `event`:**

```python
claims = event["requestContext"]["authorizer"]["claims"]

# Claims utilizados:
customer_id = claims["sub"]                        # ID único del usuario (UUID de Cognito)
email = claims.get("email", "")                    # Email del usuario
user_groups = claims.get("cognito:groups", "")     # Grupos/roles: "admin", "operator", "cliente"
```

**Requisitos para la configuración de API Gateway (a implementar en Terraform):**

| Requisito | Detalle |
|---|---|
| Authorizer Type | `COGNITO_USER_POOLS` |
| Token Source | Header `Authorization` |
| User Pool | El User Pool de CloudShop |
| Grupos de Cognito necesarios | `admin`, `operator`, `cliente` |
| Endpoints protegidos | Todos los endpoints de `/orders` |

**Control de acceso por rol dentro de las Lambdas:**

| Lambda | `cliente` | `operator` / `admin` |
|---|---|---|
| `create_order` | ✅ Crea pedidos propios | ✅ Puede crear pedidos |
| `get_orders` | Solo sus pedidos | Todos los pedidos (con filtros) |
| `get_order_by_id` | Solo sus pedidos | Cualquier pedido |
| `update_order_status` | ❌ No permitido | ✅ Puede cambiar estado |
| `cancel_order` | Solo sus pedidos en PENDING/CONFIRMED | Cualquier pedido cancelable |

---

## Proposed Changes

### Estructura de archivos a crear

```
final/cloudshop-marketplace/backend/orders/
├── create_order/
│   └── lambda_function.py
├── get_orders/
│   └── lambda_function.py
├── get_order_by_id/
│   └── lambda_function.py
├── update_order_status/
│   └── lambda_function.py
└── cancel_order/
    └── lambda_function.py
```

---

### Lambda 1 — `create_order` (POST /orders)

#### [NEW] [lambda_function.py](file:///c:/Users/tatod/OneDrive/Documentos/ESEN/Ciclo 8/Nube/final/cloudshop-marketplace/backend/orders/create_order/lambda_function.py)

**Lógica de negocio:**
1. Extraer `CustomerId` del JWT Cognito (`event.requestContext.authorizer.claims.sub`).
2. Parsear body: se espera `{ "StoreId": "..." }` (los items vienen del carrito del usuario).
3. Consultar la tabla `Carts` con el `CustomerId` para obtener los items del carrito.
4. Validar que el carrito no esté vacío.
5. Para cada item del carrito, consultar la tabla `Products` para obtener precio actual y verificar stock disponible.
6. Calcular el `Total` sumando `Price × Quantity` de cada item.
7. Descontar inventario de cada producto en la tabla `Products` (update atómico con `ADD Inventory -:qty`).
8. Crear el pedido en la tabla `Orders` con status `PENDING`.
9. Vaciar el carrito del usuario en la tabla `Carts`.
10. Emitir evento `OrderCreated` a EventBridge para auditoría y notificaciones.
11. Retornar 201 con el pedido creado.

**Validaciones:**
- Body debe ser JSON válido con `StoreId`.
- Carrito no vacío.
- Cada producto debe existir, estar activo y tener inventario suficiente.

---

### Lambda 2 — `get_orders` (GET /orders)

#### [NEW] [lambda_function.py](file:///c:/Users/tatod/OneDrive/Documentos/ESEN/Ciclo 8/Nube/final/cloudshop-marketplace/backend/orders/get_orders/lambda_function.py)

**Lógica de negocio:**
1. Extraer `CustomerId` del JWT y el grupo/rol del usuario.
2. Si el usuario es `admin` u `operator`, permitir filtrar por `CustomerId` o `StoreId` desde query params.
3. Si el usuario es `cliente`, usar `Query` con `KeyConditionExpression` sobre `CustomerId` (PK) para obtener solo sus pedidos de forma eficiente.
4. Si el usuario es `admin`/`operator`, usar `Scan` con filtros opcionales por `CustomerId` o `StoreId` desde query params.
5. Soportar paginación con `Limit` y `LastEvaluatedKey` vía query params (`limit`, `next_token`).
6. Retornar 200 con la lista de pedidos y token para la siguiente página.

---

### Lambda 3 — `get_order_by_id` (GET /orders/{id})

#### [NEW] [lambda_function.py](file:///c:/Users/tatod/OneDrive/Documentos/ESEN/Ciclo 8/Nube/final/cloudshop-marketplace/backend/orders/get_order_by_id/lambda_function.py)

**Lógica de negocio:**
1. Extraer `CustomerId` del JWT.
2. Obtener `OrderId` de `event.pathParameters.id`.
3. Si el usuario es `cliente`: `GetItem` con key compuesta `{CustomerId (del JWT), OrderId}` — esto garantiza que solo accede a sus pedidos.
4. Si el usuario es `admin`/`operator`: `Scan` con `FilterExpression` sobre `OrderId` para encontrar el pedido de cualquier cliente.
5. Verificar que el pedido existe.
6. Retornar 200 con el detalle del pedido.

---

### Lambda 4 — `update_order_status` (PATCH /orders/{id})

#### [NEW] [lambda_function.py](file:///c:/Users/tatod/OneDrive/Documentos/ESEN/Ciclo 8/Nube/final/cloudshop-marketplace/backend/orders/update_order_status/lambda_function.py)

**Lógica de negocio:**
1. Extraer usuario del JWT (solo admin u operator pueden actualizar estados).
2. Obtener `OrderId` de path params.
3. Parsear body: `{ "CustomerId": "...", "Status": "CONFIRMED" | "SHIPPED" | "DELIVERED" }`.
4. Validar que `CustomerId` y `Status` estén presentes en el body.
5. Validar que el nuevo estado sea uno de los valores permitidos.
6. Obtener el pedido con `GetItem` usando key compuesta `{CustomerId, OrderId}`.
7. Validar la transición de estado (no se permite saltar estados ni retroceder):
   - `PENDING → CONFIRMED → SHIPPED → DELIVERED`
   - No se permite cambiar estado de pedidos `CANCELLED`.
8. `UpdateItem` en DynamoDB con key `{CustomerId, OrderId}`: `SET #s = :status, UpdatedAt = :now`.
9. Emitir evento `OrderStatusChanged` a EventBridge (esto activará la Lambda de notificaciones SES).
10. Retornar 200 con el pedido actualizado.

**Máquina de estados válida:**
```
PENDING → CONFIRMED
CONFIRMED → SHIPPED
SHIPPED → DELIVERED
```

---

### Lambda 5 — `cancel_order` (DELETE /orders/{id})

#### [NEW] [lambda_function.py](file:///c:/Users/tatod/OneDrive/Documentos/ESEN/Ciclo 8/Nube/final/cloudshop-marketplace/backend/orders/cancel_order/lambda_function.py)

**Lógica de negocio:**
1. Extraer `CustomerId` del JWT.
2. Obtener `OrderId` de path params.
3. Si el usuario es `cliente`: `GetItem` con key compuesta `{CustomerId (del JWT), OrderId}` — acceso solo a sus pedidos.
4. Si el usuario es `admin`: Parsear `CustomerId` del body y usar `GetItem` con `{CustomerId, OrderId}`.
5. Verificar que el pedido existe.
6. Validar que el estado actual permita cancelación (solo `PENDING` o `CONFIRMED`).
7. Restaurar inventario de cada producto del pedido (update atómico `ADD Inventory :qty`).
8. `UpdateItem` con key `{CustomerId, OrderId}`: `SET #s = :cancelled, UpdatedAt = :now`.
9. Emitir evento `OrderCancelled` a EventBridge.
10. Retornar 200 con mensaje de confirmación.

---

## Open Questions

> [!IMPORTANT]
> **Variable de entorno `EVENT_BUS_NAME`:**
> Se asume que EventBridge ya está configurado o se configurará en el módulo de infraestructura. Las Lambdas de `create_order`, `update_order_status` y `cancel_order` emitirán eventos. Si no se desea implementar la integración con EventBridge en esta fase, puedo omitir esas llamadas.

---

## Patrones de Diseño Aplicados

Basado en el código existente de [crear_cliente/main.py](file:///c:/Users/tatod/OneDrive/Documentos/ESEN/Ciclo 8/Nube/Primera_parte/lab-api-rest-dynamodb/lambdas/crear_cliente/main.py) y [consumer/lambda_function.py](file:///c:/Users/tatod/OneDrive/Documentos/ESEN/Ciclo 8/Nube/Segunda_parte/cloudbox-enterprise/backend/consumer/lambda_function.py):

- **Función helper `_response()`** para respuestas estandarizadas con CORS headers.
- **`boto3.resource("dynamodb")`** fuera del handler (reutilización de conexiones).
- **Variables de entorno** para nombres de tablas (`os.environ`).
- **Try/except global** para manejar errores no controlados y ocultar stack traces.
- **Validación estricta** del body y de los permisos del usuario.
- **UUID v4** para generación de IDs de pedidos.
- **ISO 8601** para timestamps.
- Sin comentarios innecesarios — código legible y autoexplicativo.

---

## Verification Plan

### Manual Verification
- Verificar que cada archivo Python tenga sintaxis válida (`python -c "import py_compile; py_compile.compile('file.py')"`)
- Verificar que la estructura de carpetas coincida con lo propuesto.
- Revisar que los CORS headers estén presentes en todas las respuestas.
- Confirmar que las variables de entorno referenciadas sean consistentes entre las 5 Lambdas.
