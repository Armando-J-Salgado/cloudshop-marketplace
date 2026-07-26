# Pendientes

Puntos que quedaron fuera del alcance de la infraestructura Terraform (`docs/terraform-infra/`) pero que hay que resolver antes del cierre del proyecto. Cada uno indica de quién es.

## 1. Alinear la versión de Terraform entre el repo y GitHub Actions

**Dueño:** quien mantenga `infraestructure/cicd/` y `.github/workflows/terraform.yml`.

`infraestructure/cicd/terraform.tfstate` lo escribió Terraform **1.15.2** (versión instalada localmente), mientras que:
- `infraestructure/cicd/versions.tf` declara `required_version = "~> 1.9"`
- `main.tf` (root) declara lo mismo, `"~> 1.9"`
- `.github/workflows/terraform.yml` fija `TF_VERSION: '1.9.8'`

Tres versiones distintas conviviendo. Hoy no revienta porque el pipeline nunca aplica `infraestructure/cicd/` (solo lo valida), pero:

- Decidir la versión única del proyecto y ponerla en `TF_VERSION` del workflow, en `required_version` de ambos root modules, y usarla también en cualquier `apply` manual.
- Terraform **rechaza un estado escrito por una versión mayor** a la que se está usando. Si `infraestructure/cicd/` se vuelve a aplicar con `terraform apply`, debe hacerse con Terraform ≥ 1.15.2 (o migrar el state primero), o el comando fallará.

## 2. Restringir CORS al dominio del frontend

**Dueño:** equipo de backend (dueños de `backend/lambdas/`).

Las 20 Lambdas devuelven `Access-Control-Allow-Origin: "*"` vía un helper `_response()` duplicado en cada `lambda_function.py`/`handler.py`. Cuando exista el dominio de CloudFront (`module.cloudfront.domain_name`, disponible como output `cloudfront_domain` tras el primer `apply`), sustituir ese `"*"` por el origen real.

Aprovechar el cambio para deduplicar `_response()` y `DecimalEncoder`, que hoy están copiados en cada uno de los 20 archivos, en vez de tocar solo la constante de CORS.

## 3. `create_order` no incluye `Items` en el evento `OrderCreated`

**Dueño:** equipo de Orders.

`backend/lambdas/orders/create_order/lambda_function.py` emite `put_events` con `Detail = {OrderId, CustomerId, Email, StoreId, Total, Status}` — sin `Items`. `notifications/send-order-notification/handler.py` exige `items` como array no vacío y devuelve 400 si falta. El `input_transformer` de `infraestructure/modules/eventbridge/main.tf` (target `notifications_order_created`) no puede inventar un campo que no viaja en el evento; hoy manda `"items": []` como placeholder.

Arreglo: añadir `"Items": order_items` al diccionario que se pasa a `json.dumps(...)` en el `Detail` (línea ~109-116 del archivo).

## 4. PK del carrito: `ClientId` vs `UserId`

**Dueño:** equipo de Carts + equipo de Orders (coordinar).

Las 4 Lambdas de `backend/lambdas/carts/` (`add_product`, `modify_quantity`, `remove_product`, `clear_cart`) leen/escriben con `Key={"ClientId": ...}`. `backend/lambdas/orders/create_order/lambda_function.py` lee y vacía el mismo carrito con `Key={"UserId": ...}` (líneas 42 y 104). Una tabla DynamoDB tiene una única hash key: `infraestructure/modules/dynamodb/main.tf` creó `cloudshop-carts` con PK `ClientId` (mayoría de las Lambdas + el diagrama de BD), así que **`create_order` fallará con `ValidationException`** al intentar leer/vaciar el carrito.

Arreglo: cambiar las dos ocurrencias de `"UserId"` por `"ClientId"` en `create_order/lambda_function.py`.

## 5. `GET /carts/{id}` sin implementar

**Dueño:** equipo de Carts.

El diagrama actualizado (`docs/context&resources/Diagrama-APIs-Cloudshop-actualizado.json`) incluye "Lambda Ver Detalles del carrito" en `GET /carts/{id}`, pero no existe código en `backend/lambdas/carts/`. Terraform ya tiene el hueco reservado (clave lógica `carts_get`, directorio esperado `backend/lambdas/carts/get_cart/lambda_function.py`, handler `lambda_function.lambda_handler`, rol IAM y ruta de API Gateway ya definidos con guard `fileexists()`) — en cuanto el código se suba, aparece solo en el siguiente `terraform plan`.

## 6. Módulos sin código todavía: Stores y Dashboard

**Dueño:** equipo de Stores / sin dueño asignado para Dashboard.

`backend/lambdas/stores/` (5 handlers: create/update/delete/get_stores/get_store_by_id) y el Dashboard Ejecutivo (Módulo 6 del documento del proyecto) no existen. Terraform ya tiene reservados: tabla `cloudshop-stores`, rol IAM `cloudshop-lambda-stores` / `cloudshop-lambda-dashboard`, rutas de API Gateway y las entradas guardadas por `fileexists()` en `infraestructure/modules/lambdas/main.tf`. El Dashboard además no tiene diseño de agregación (qué tablas lee, qué calcula) — eso es una decisión pendiente, no solo código.

## 7. SES en sandbox

**Dueño:** quien tenga acceso a la consola AWS del proyecto.

Una cuenta AWS nueva con SES en modo sandbox solo puede enviar correos a direcciones verificadas. Para evidenciar el envío del Caso de Prueba 2 hace falta verificar el correo de prueba del destinatario en la consola SES, o solicitar la salida del sandbox. Es un trámite de consola, no de Terraform.

## 8. Remitente SES real en `terraform.tfvars`

**Dueño:** quien aplique la infraestructura por primera vez.

`ses_source_email` está hoy en `terraform.tfvars` con el placeholder `notifications@cloudshop.example`, solo para que `validate`/`plan` corran sin credenciales de correo reales. Reemplazarlo por un remitente real y verificado en SES **antes** del primer `terraform apply`.

## 9. Backend remoto de Terraform (S3 + DynamoDB lock)

**Dueño:** sin asignar (Open Question heredada del paso 1, `docs/gh-actions-iam/spec.md`).

Sigue bloqueando el `apply` automático desde el pipeline (`vars.ENABLE_TF_APPLY = false`). Sin estado compartido, cada corrida del runner arrancaría con estado vacío e intentaría recrear todo. El primer `apply` real de este módulo sigue siendo manual y con autorización explícita del usuario.
