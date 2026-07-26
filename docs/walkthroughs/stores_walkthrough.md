# Walkthrough — Módulo de Tiendas

## Resumen

Se documenta la implementación planificada de las 5 funciones Lambda en Python para el módulo de tiendas de CloudShop Marketplace, siguiendo los mismos patrones del módulo de pedidos y del módulo de carrito.

## Archivos Creados

| Archivo | Endpoint | Observación |
|---|---|---|
| [create_store/lambda_function.py](../../backend/lambdas/stores/create_store/lambda_function.py) | `POST /stores` | Solo admin |
| [get_stores/lambda_function.py](../../backend/lambdas/stores/get_stores/lambda_function.py) | `GET /stores` | Admin ve todas, operador ve solo las suyas |
| [get_store_by_id/lambda_function.py](../../backend/lambdas/stores/get_store_by_id/lambda_function.py) | `GET /stores/{id}` | Admin o dueño |
| [update_store/lambda_function.py](../../backend/lambdas/stores/update_store/lambda_function.py) | `PATCH /stores/{id}` | Admin o dueño |
| [delete_store/lambda_function.py](../../backend/lambdas/stores/delete_store/lambda_function.py) | `DELETE /stores/{id}` | Soft delete, solo admin |

## Patrones Implementados

- **`_response()` helper** con CORS headers en todas las Lambdas
- **`DecimalEncoder`** para serializar valores `Decimal` de DynamoDB a JSON
- **`boto3.resource("dynamodb")`** inicializado fuera del handler para reutilización de conexiones
- **Variable de entorno** `STORES_TABLE_NAME` para el nombre de la tabla DynamoDB
- **Try/except global** para ocultar errores internos al cliente
- **Validación estricta** del body JSON y de los permisos del usuario
- **Timestamps** `CreatedAt` y `UpdatedAt` en formato ISO 8601 UTC
- **Soft delete** mediante actualización de `Status = "INACTIVE"`

## Esquema de la Tabla DynamoDB

```
Tabla: Stores
PK: StoreId (String)

Atributos:
  - Name        (String)
  - Description (String)
  - OwnerId     (String)
  - Email       (String)
  - Phone       (String)
  - Address     (String)
  - Status      (String) → ACTIVE | INACTIVE
  - CreatedAt   (String) → ISO 8601 UTC
  - UpdatedAt   (String) → ISO 8601 UTC
```

> **Nota importante:** `OwnerId` corresponde al `sub` del JWT de Cognito del operador dueño. El módulo no usa una clave compuesta; por eso la consulta por `StoreId` es directa con `GetItem`.

## Flujo de Cada Lambda

### create_store (POST /stores)

```
Request Body: {
  "Name": "Tienda Central",
  "Description": "Sucursal principal",
  "OwnerId": "operator-sub",
  "Email": "store@example.com",
  "Phone": "2222-2222",
  "Address": "Centro comercial ABC"
}

1. Extraer claims del JWT: `sub` y `cognito:groups`
2. Verificar que el usuario pertenezca al grupo `admin`
3. Validar que el body sea JSON válido y que incluya todos los campos requeridos
4. Generar `StoreId` con UUID v4
5. Agregar `Status = "ACTIVE"`
6. Agregar `CreatedAt` y `UpdatedAt` con timestamp ISO 8601 UTC
7. Guardar la tienda en DynamoDB con `PutItem`
8. Retornar la tienda creada con `201`
```

### get_stores (GET /stores)

```
Query params opcionales: limit, next_token

1. Extraer claims del JWT
2. Verificar si el usuario es `admin` o `operator`
3. Si es `admin`:
   - Ejecutar `Scan` sobre la tabla completa
4. Si es `operator`:
   - Ejecutar `Scan` con filtro `OwnerId = caller_id`
5. Aplicar paginación básica con `Limit` y `LastEvaluatedKey`
6. Retornar la lista de tiendas y `next_token` si existe más data
```

### get_store_by_id (GET /stores/{id})

```
Path param: id = StoreId

1. Extraer claims del JWT
2. Obtener la tienda con `GetItem` usando `StoreId`
3. Si no existe, retornar 404
4. Si el usuario es `admin`, devolver el detalle
5. Si el usuario es `operator`, verificar que `OwnerId` coincida con `sub`
6. Si no coincide, retornar 403
7. Retornar el detalle de la tienda con 200
```

### update_store (PATCH /stores/{id})

```
Request Body: puede incluir Name, Description, Email, Phone, Address

1. Extraer claims del JWT
2. Obtener la tienda con `GetItem`
3. Validar que exista
4. Verificar permisos:
   - `admin`: permitido siempre
   - `operator`: permitido solo si es dueño
5. Validar que el body tenga al menos un campo editable
6. Construir un `UpdateExpression` dinámico con los campos enviados
7. Actualizar `UpdatedAt`
8. Ejecutar `UpdateItem`
9. Retornar la tienda actualizada con 200
```

### delete_store (DELETE /stores/{id})

```
Path param: id = StoreId

1. Extraer claims del JWT
2. Verificar que el usuario sea `admin`
3. Obtener la tienda con `GetItem`
4. Validar que exista
5. Actualizar `Status` a `INACTIVE`
6. Actualizar `UpdatedAt`
7. Guardar el cambio con `UpdateItem`
8. Retornar confirmación de desactivación con 200
```

## Variables de Entorno Requeridas

| Variable | Descripción | Usada en |
|---|---|---|
| `STORES_TABLE_NAME` | Nombre de la tabla DynamoDB de tiendas | Todas las Lambdas |

## Relación con el Resto del Proyecto

Este módulo encaja con el flujo actual del proyecto de la siguiente forma:

1. `create_store` genera la entidad base de negocio para el resto de módulos.
2. `products` usa `StoreId` como referencia para ubicar productos dentro de una tienda.
3. `orders` consume `StoreId` para asociar pedidos a una tienda específica.
4. `delete_store` no borra registros; solo desactiva la tienda para preservar integridad histórica.

## Verificación

Cuando la implementación exista, se recomienda validar lo siguiente:

```
create_store: OK
get_stores: OK
get_store_by_id: OK
update_store: OK
delete_store: OK
```

## Pendientes para Terraform

Cuando se configure la infraestructura, se necesitará:

1. Tabla DynamoDB `Stores` con PK=`StoreId` (String)
2. API Gateway con Cognito Authorizer y las 5 rutas `/stores`
3. IAM Role para las Lambdas con permisos de DynamoDB y CloudWatch Logs
4. Variables de entorno configuradas en cada Lambda
5. Reglas de autorización coherentes con los roles `admin`, `operator` y `cliente`
