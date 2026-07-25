# Walkthrough — Módulo de Pedidos

## Resumen

Se implementaron las 5 funciones Lambda en Python para el módulo de pedidos de CloudShop Marketplace, siguiendo los patrones del código existente en `Primera_parte` y `cloudbox-enterprise`.

## Archivos Creados

| Archivo | Endpoint | Líneas |
|---|---|---|
| [create_order/lambda_function.py](file:///c:/Users/tatod/OneDrive/Documentos/ESEN/Ciclo 8/Nube/final/cloudshop-marketplace/backend/orders/create_order/lambda_function.py) | `POST /orders` | ~140 |
| [get_orders/lambda_function.py](file:///c:/Users/tatod/OneDrive/Documentos/ESEN/Ciclo 8/Nube/final/cloudshop-marketplace/backend/orders/get_orders/lambda_function.py) | `GET /orders` | ~100 |
| [get_order_by_id/lambda_function.py](file:///c:/Users/tatod/OneDrive/Documentos/ESEN/Ciclo 8/Nube/final/cloudshop-marketplace/backend/orders/get_order_by_id/lambda_function.py) | `GET /orders/{id}` | ~70 |
| [update_order_status/lambda_function.py](file:///c:/Users/tatod/OneDrive/Documentos/ESEN/Ciclo 8/Nube/final/cloudshop-marketplace/backend/orders/update_order_status/lambda_function.py) | `PATCH /orders/{id}` | ~130 |
| [cancel_order/lambda_function.py](file:///c:/Users/tatod/OneDrive/Documentos/ESEN/Ciclo 8/Nube/final/cloudshop-marketplace/backend/orders/cancel_order/lambda_function.py) | `DELETE /orders/{id}` | ~130 |

## Patrones Implementados

- **`_response()` helper** con CORS headers en todas las Lambdas
- **`DecimalEncoder`** para serializar valores Decimal de DynamoDB a JSON
- **`boto3.resource("dynamodb")`** inicializado fuera del handler (reutilización de conexiones)
- **Variables de entorno** para nombres de tablas y EventBridge bus
- **Try/except global** que oculta errores internos al cliente
- **Key compuesta** PK=`CustomerId` + SK=`OrderId` en todas las operaciones DynamoDB
- **Control de acceso por roles** vía `cognito:groups` (admin/operator vs cliente)
- **EventBridge events** emitidos en create, update status y cancel (con try/except silencioso para no bloquear la operación principal)

## Variables de Entorno Requeridas

| Variable | Descripción | Usada en |
|---|---|---|
| `ORDERS_TABLE_NAME` | Nombre de la tabla DynamoDB de pedidos | Todas |
| `PRODUCTS_TABLE_NAME` | Nombre de la tabla de productos | create_order, cancel_order |
| `CARTS_TABLE_NAME` | Nombre de la tabla de carritos | create_order |
| `EVENT_BUS_NAME` | Nombre del bus de EventBridge | create_order, update_order_status, cancel_order |

## Verificación

Todos los archivos pasaron la verificación de sintaxis con `py_compile`:

```
create_order: OK
get_orders: OK
get_order_by_id: OK
update_order_status: OK
cancel_order: OK
```

## Pendientes para Terraform

Cuando se configure la infraestructura, se necesitará:
1. Tabla DynamoDB `Orders` con PK=`CustomerId` (String) y SK=`OrderId` (String)
2. API Gateway con Cognito Authorizer y las 5 rutas `/orders`
3. IAM Role para las Lambdas con permisos de DynamoDB, EventBridge y CloudWatch Logs
4. EventBridge rules para `OrderCreated`, `OrderStatusChanged` y `OrderCancelled`
5. Variables de entorno configuradas en cada Lambda
