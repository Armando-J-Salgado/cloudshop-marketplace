# Walkthrough — Módulo de Carrito

## Resumen

Se implementaron las 4 funciones Lambda en Python para el módulo de carrito de CloudShop Marketplace, siguiendo los mismos patrones del módulo de pedidos.

## Archivos Creados

| Archivo | Endpoint | Líneas |
|---|---|---|
| [add_product/lambda_function.py](../../backend/lambdas/carts/add_product/lambda_function.py) | `POST /carts/items` | ~85 |
| [modify_quantity/lambda_function.py](../../backend/lambdas/carts/modify_quantity/lambda_function.py) | `PATCH /carts/items` | ~80 |
| [remove_product/lambda_function.py](../../backend/lambdas/carts/remove_product/lambda_function.py) | `DELETE /carts/items` | ~75 |
| [clear_cart/lambda_function.py](../../backend/lambdas/carts/clear_cart/lambda_function.py) | `DELETE /carts` | ~55 |

## Patrones Implementados

- **`_response()` helper** con CORS headers en todas las Lambdas
- **`DecimalEncoder`** para serializar valores Decimal de DynamoDB a JSON
- **`boto3.resource("dynamodb")`** inicializado fuera del handler (reutilización de conexiones)
- **Variable de entorno** `CARTS_TABLE_NAME` para nombre de tabla
- **Try/except global** que oculta errores internos al cliente
- **Validación estricta** de body JSON y parámetros requeridos
- **Timestamps** `CreatedAt` y `UpdatedAt` en formato ISO 8601

## Esquema de la Tabla DynamoDB

```
Tabla: Carts
PK: CustomerId (String) → sub del JWT de Cognito

Atributos:
  - Items     (List)   → [{ ProductId: String, Quantity: Number }]
  - CreatedAt (String) → ISO 8601, se establece al crear el carrito
  - UpdatedAt (String) → ISO 8601, se actualiza en cada operación
```

> **Nota importante:** El carrito solo almacena IDs de producto y cantidades. El frontend cachea los nombres/detalles de productos localmente. Antes de crear un pedido, el frontend debe reconfirmar la disponibilidad de productos llamando primero al endpoint de productos.

## Flujo de Cada Lambda

### add_product (POST /carts/items)

```
Request Body: { "ProductId": "abc123", "Quantity": 2 }

1. Extraer CustomerId del JWT (claims.sub)
2. Obtener carrito actual (GetItem con CustomerId)
3. Si carrito existe:
   - Producto ya en lista → sumar cantidad
   - Producto no en lista → agregar item
   - Actualizar UpdatedAt
4. Si carrito no existe → crear registro nuevo (PutItem con CreatedAt y UpdatedAt)
5. Retornar carrito actualizado
```

### modify_quantity (PATCH /carts/items)

```
Request Body: { "ProductId": "abc123", "Quantity": 5 }

1. Extraer CustomerId del JWT
2. Obtener carrito actual (GetItem)
3. Buscar producto en Items
4. Si no existe → 404
5. Reemplazar Quantity con nuevo valor
6. Guardar (UpdateItem) y actualizar UpdatedAt
7. Retornar carrito actualizado
```

### remove_product (DELETE /carts/items)

```
Request Body: { "ProductId": "abc123" }

1. Extraer CustomerId del JWT
2. Obtener carrito actual (GetItem)
3. Filtrar Items removiendo el ProductId indicado
4. Si no se removió nada → 404
5. Guardar lista filtrada (UpdateItem) y actualizar UpdatedAt
6. Retornar carrito actualizado
```

### clear_cart (DELETE /carts)

```
No body requerido

1. Extraer CustomerId del JWT
2. Verificar que carrito existe (GetItem)
3. Si no existe → 404
4. Establecer Items = [] y actualizar UpdatedAt (UpdateItem)
5. Retornar confirmación
```

## Variables de Entorno Requeridas

| Variable | Descripción | Usada en |
|---|---|---|
| `CARTS_TABLE_NAME` | Nombre de la tabla DynamoDB de carritos | Todas |

## Verificación

Todos los archivos pasaron la verificación de sintaxis con `py_compile`:

```
add_product: OK
modify_quantity: OK
remove_product: OK
clear_cart: OK
```

## Relación con el Módulo de Pedidos

El carrito es consumido por la Lambda `create_order` del módulo de pedidos:

1. `create_order` lee el carrito del usuario (`GetItem` con `CustomerId`).
2. Valida stock y precios contra la tabla de productos.
3. Crea el pedido con los items del carrito.
4. Vacía el carrito (establece `Items = []`).

Este flujo garantiza que:
- El carrito es la fuente de verdad para los items del pedido.
- La validación de disponibilidad se hace al momento del pedido (no al agregar al carrito).
- El carrito queda vacío después de un pedido exitoso.

## Pendientes para Terraform

Cuando se configure la infraestructura, se necesitará:
1. Tabla DynamoDB `Carts` con PK=`CustomerId` (String)
2. API Gateway con Cognito Authorizer y las 4 rutas de `/carts`
3. IAM Role para las Lambdas con permisos de DynamoDB (GetItem, PutItem, UpdateItem) y CloudWatch Logs
4. Variables de entorno configuradas en cada Lambda
