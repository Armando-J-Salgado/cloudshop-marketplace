# Módulo de Tiendas — 5 Lambdas en Python

Plan de implementación para las 5 funciones Lambda del módulo de gestión de tiendas del proyecto CloudShop Marketplace.

## Contexto Arquitectónico

Tras revisar la documentación del proyecto, el documento ASD y los módulos ya implementados, se identifican los siguientes patrones y reglas para Stores:

| Aspecto | Detalle |
|---|---|
| **Runtime** | Python 3.x |
| **Base de datos** | DynamoDB — tabla `Stores` |
| **Autenticación** | Amazon Cognito (JWT via API Gateway Authorizer) |
| **Patrón de respuesta** | Función auxiliar `_response(status_code, body)` con headers CORS |
| **Serialización** | `DecimalEncoder` para convertir `Decimal` de DynamoDB a JSON |
| **Variables de entorno** | `STORES_TABLE_NAME` |

### Alcance Funcional del Módulo Stores

El documento ASD define el módulo de gestión de tiendas con las siguientes capacidades:

- Crear tienda
- Actualizar tienda
- Consultar tienda
- Desactivar tienda

Una tienda puede tener múltiples productos.

### Esquema de la Tabla Stores (DynamoDB)

```
PK:  StoreId   (String)  → UUID v4 generado al crear la tienda

Atributos:
  - Name        (String)
  - Description (String)
  - OwnerId     (String)  → sub del JWT del operador dueño
  - Email       (String)
  - Phone       (String)
  - Address     (String)
  - Status      (String)  → ACTIVE | INACTIVE
  - CreatedAt   (String)  → ISO 8601 UTC
  - UpdatedAt   (String)  → ISO 8601 UTC
```

> [!NOTE]
> El diseño asume una tabla DynamoDB simple con `StoreId` como clave primaria. No se requiere una clave compuesta para esta primera versión, por lo que obtener una tienda por ID es un `GetItem` directo. Para listar tiendas por dueño, el plan usa `Scan` con filtro por `OwnerId` porque no se ha definido un índice secundario en la documentación actual.

### Endpoints del API Gateway

| Método | Ruta | Lambda | Descripción |
|---|---|---|---|
| `POST` | `/stores` | `create_store` | Crear tienda |
| `GET` | `/stores` | `get_stores` | Listar tiendas (admin ve todas, operador solo las suyas) |
| `GET` | `/stores/{id}` | `get_store_by_id` | Obtener tienda por ID |
| `PATCH` | `/stores/{id}` | `update_store` | Actualizar tienda |
| `DELETE` | `/stores/{id}` | `delete_store` | Desactivar tienda (soft delete) |

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
caller_id = claims["sub"]                    # ID único del usuario en Cognito
user_groups = claims.get("cognito:groups", "")
```

**Roles considerados por el módulo:**

| Rol | Permisos sobre Stores |
|---|---|
| `admin` | Puede crear, listar todas, ver cualquier tienda, actualizar cualquier tienda y desactivar tiendas |
| `operator` | Puede listar solo sus tiendas, ver solo sus tiendas y actualizar solo las tiendas donde `OwnerId = caller_id` |
| `cliente` | No tiene acceso funcional al módulo Stores |

**Regla de autorización por Lambda:**

| Lambda | `admin` | `operator` | `cliente` |
|---|---|---|---|
| `create_store` | ✅ | ❌ | ❌ |
| `get_stores` | ✅ ve todas | ✅ ve solo las suyas | ❌ |
| `get_store_by_id` | ✅ | ✅ solo si es dueña | ❌ |
| `update_store` | ✅ | ✅ solo si es dueña | ❌ |
| `delete_store` | ✅ | ❌ | ❌ |

---

## Proposed Changes

### Estructura de archivos a crear

```
backend/lambdas/stores/
├── create_store/
│   └── lambda_function.py
├── get_stores/
│   └── lambda_function.py
├── get_store_by_id/
│   └── lambda_function.py
├── update_store/
│   └── lambda_function.py
└── delete_store/
    └── lambda_function.py
```

---

### Lambda 1 — `create_store` (POST /stores)

#### [NEW] [lambda_function.py](../../backend/lambdas/stores/create_store/lambda_function.py)

**Lógica de negocio:**
1. Extraer usuario y roles desde `event.requestContext.authorizer.claims`.
2. Validar que el usuario pertenezca al grupo `admin`.
3. Parsear el body JSON.
4. Validar que el payload incluya `Name`, `Description`, `OwnerId`, `Email`, `Phone` y `Address`.
5. Generar `StoreId` con UUID v4.
6. Establecer `Status = "ACTIVE"`.
7. Establecer `CreatedAt` y `UpdatedAt` con timestamp ISO 8601 UTC.
8. Guardar el registro en DynamoDB con `PutItem`.
9. Retornar `201` con la tienda creada.

**Validaciones:**
- El body debe ser JSON válido.
- `Name`, `Description`, `OwnerId`, `Email`, `Phone` y `Address` son obligatorios.
- `OwnerId` debe ser una cadena no vacía.
- Solo `admin` puede ejecutar esta operación.

**Casos de error a manejar:**
- `400`: body inválido o campos faltantes.
- `403`: caller sin rol `admin`.
- `500`: error de DynamoDB o serialización.

---

### Lambda 2 — `get_stores` (GET /stores)

#### [NEW] [lambda_function.py](../../backend/lambdas/stores/get_stores/lambda_function.py)

**Lógica de negocio:**
1. Extraer usuario y roles desde Cognito claims.
2. Leer parámetros de paginación (`limit` y `next_token`) desde query params.
3. Si el usuario es `admin`, listar todas las tiendas.
4. Si el usuario es `operator`, filtrar por `OwnerId = caller_id`.
5. Aplicar paginación básica con `LastEvaluatedKey`.
6. Retornar `200` con la lista de tiendas y el token de siguiente página si existe.

**Validaciones:**
- `limit` debe ser un entero positivo si se envía.
- `next_token` debe poder traducirse a una `ExclusiveStartKey` válida si se usa.
- `cliente` no debe obtener acceso al listado.

**Operación DynamoDB:**
- `Scan` para `admin`.
- `Scan` con `FilterExpression=Attr("OwnerId").eq(caller_id)` para `operator`.
- Uso de `ExclusiveStartKey` y `LastEvaluatedKey` para paginación.

**Respuesta esperada:**
```json
{
  "stores": [...],
  "count": 10,
  "next_token": "..."
}
```

**Casos de error a manejar:**
- `400`: parámetros de paginación inválidos.
- `403`: caller sin rol válido.
- `500`: error al consultar DynamoDB.

---

### Lambda 3 — `get_store_by_id` (GET /stores/{id})

#### [NEW] [lambda_function.py](../../backend/lambdas/stores/get_store_by_id/lambda_function.py)

**Lógica de negocio:**
1. Extraer `StoreId` desde `event.pathParameters.id`.
2. Extraer usuario y roles desde Cognito claims.
3. Ejecutar `GetItem` por `StoreId`.
4. Verificar que la tienda existe.
5. Si el usuario es `admin`, devolver el registro.
6. Si el usuario es `operator`, devolver solo si `OwnerId = caller_id`.
7. Si no tiene permiso, retornar `403`.

**Validaciones:**
- `StoreId` es obligatorio en path params.
- La tienda debe existir.

**Operación DynamoDB:**
- `GetItem` con key `{StoreId}`.

**Casos de error a manejar:**
- `400`: falta `id` en la ruta.
- `403`: operador intentando acceder a una tienda ajena.
- `404`: tienda inexistente.
- `500`: error interno.

---

### Lambda 4 — `update_store` (PATCH /stores/{id})

#### [NEW] [lambda_function.py](../../backend/lambdas/stores/update_store/lambda_function.py)

**Lógica de negocio:**
1. Extraer `StoreId` desde path params.
2. Extraer usuario y roles desde Cognito claims.
3. Obtener la tienda con `GetItem`.
4. Validar que exista.
5. Verificar permisos: `admin` siempre, `operator` solo si es dueño (`OwnerId = caller_id`).
6. Parsear body JSON con los campos editables: `Name`, `Description`, `Email`, `Phone`, `Address`.
7. Construir dinámicamente el `UpdateExpression` solo con los campos enviados.
8. Actualizar `UpdatedAt`.
9. Ejecutar `UpdateItem`.
10. Retornar `200` con la tienda actualizada.

**Validaciones:**
- El body debe ser JSON válido.
- Debe enviarse al menos un campo editable.
- Solo se permiten `Name`, `Description`, `Email`, `Phone` y `Address`.
- `cliente` no puede actualizar tiendas.

**Operación DynamoDB:**
- `GetItem` para verificar existencia y ownership.
- `UpdateItem` con expresión dinámica.

**Casos de error a manejar:**
- `400`: body inválido o sin campos editables.
- `403`: caller sin permisos o operador no dueño.
- `404`: tienda inexistente.
- `500`: error de DynamoDB.

---

### Lambda 5 — `delete_store` (DELETE /stores/{id})

#### [NEW] [lambda_function.py](../../backend/lambdas/stores/delete_store/lambda_function.py)

**Lógica de negocio:**
1. Extraer `StoreId` desde path params.
2. Extraer usuario y roles desde Cognito claims.
3. Validar que el caller pertenezca al rol `admin`.
4. Verificar que la tienda exista con `GetItem`.
5. Realizar soft delete cambiando `Status` a `INACTIVE`.
6. Actualizar `UpdatedAt`.
7. Ejecutar `UpdateItem`.
8. Retornar `200` con mensaje de desactivación.

**Validaciones:**
- `StoreId` obligatorio.
- La tienda debe existir.
- Solo `admin` puede desactivar tiendas.

**Operación DynamoDB:**
- `GetItem` para validar existencia.
- `UpdateItem` para cambiar `Status` a `INACTIVE`.

**Casos de error a manejar:**
- `400`: falta `id`.
- `403`: caller sin rol `admin`.
- `404`: tienda inexistente.
- `500`: error interno.

---

## Patrones de Diseño Aplicados

Basado en el código existente del módulo de pedidos y carrito:

- **Función helper `_response()`** para respuestas estandarizadas con CORS headers.
- **`DecimalEncoder`** para serializar valores `Decimal` de DynamoDB a JSON.
- **`boto3.resource("dynamodb")`** inicializado fuera del handler para reutilización de conexiones.
- **Variables de entorno** para nombres de tablas (`os.environ`).
- **Try/except global** para manejar errores no controlados y ocultar stack traces.
- **Validación estricta** del body antes de operar.
- **UUID v4** para la creación de `StoreId`.
- **ISO 8601 UTC** para timestamps (`CreatedAt`, `UpdatedAt`).

---

## Variables de Entorno Requeridas

| Variable | Descripción | Usada en |
|---|---|---|
| `STORES_TABLE_NAME` | Nombre de la tabla DynamoDB de tiendas | Todas las Lambdas |

---

## Verification Plan

### Manual Verification
- Verificar que cada archivo Python tenga sintaxis válida.
- Verificar que la estructura de carpetas coincida con lo propuesto.
- Revisar que los headers CORS estén presentes en todas las respuestas.
- Confirmar que `STORES_TABLE_NAME` sea consistente entre las 5 Lambdas.
- Confirmar que `get_stores` aplique filtro por `OwnerId` cuando el usuario sea `operator`.
- Confirmar que `delete_store` no elimine el registro, solo actualice `Status = "INACTIVE"`.

### Test Scenarios

| Lambda | Caso | Resultado esperado |
|---|---|---|
| `create_store` | Body sin `OwnerId` | 400 |
| `create_store` | Caller no es admin | 403 |
| `get_stores` | Caller admin | 200, lista completa |
| `get_stores` | Caller operator | 200, solo tiendas propias |
| `get_store_by_id` | Tienda ajena para operator | 403 |
| `get_store_by_id` | Tienda inexistente | 404 |
| `update_store` | Sin campos editables | 400 |
| `update_store` | Operator actualiza tienda propia | 200 |
| `update_store` | Operator actualiza tienda ajena | 403 |
| `delete_store` | Caller no es admin | 403 |
| `delete_store` | Tienda existente | 200, `Status = INACTIVE` |
