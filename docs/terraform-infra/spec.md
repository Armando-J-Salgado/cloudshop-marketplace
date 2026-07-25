# Infraestructura Terraform de CloudShop Marketplace

Cierra el **paso 2 del roadmap** acordado en `docs/gh-actions-iam/spec.md`: (1) GitHub Actions ✅ → (2) infraestructura Terraform completa, incluyendo Lambdas y roles de mínimo privilegio ← esta tarea → (3) front-end.

## Contexto

Antes de esta tarea, los 5 `.tf` del root y los 27 de `infraestructure/modules/` estaban todos a 0 bytes. El único Terraform real del repo era `infraestructure/cicd/` (usuario IAM `github-actions` del pipeline), que no despliega la aplicación. El §9 del documento del proyecto (*"toda la infraestructura deberá desplegarse utilizando Terraform… no se permitirá la creación manual de recursos AWS"*) estaba incumplido, y las 20 Lambdas ya escritas por el equipo no tenían dónde desplegarse.

## Decisiones tomadas con el usuario

| Decisión | Resolución |
|---|---|
| Servicio de notificaciones | **SES**, no SNS. Los servicios nuevos respecto a los laboratorios 7–10 son SES + EventBridge |
| Alcance de módulos | Todos, incluidos Stores y Dashboard, aunque aún no tienen código Python |
| `backend/` | Intocable por esta tarea — los compañeros suben su propio Python |
| Frontend / edge | Se crea ya (S3 + CloudFront + WAF), vacío, listo para recibir el build de React |

## Restricción que gobierna todo el diseño

`infraestructure/cicd/policies.tf` ya estaba aplicado en AWS (cuenta `636017850255`) y define lo que el usuario `github-actions` puede crear: recursos acotados al prefijo `cloudshop-*`, roles IAM solo bajo el path `/cloudshop/` con el permissions boundary `CloudShopWorkloadBoundary` obligatorio (impuesto por `condition`, no por convención), políticas gestionadas solo bajo `policy/cloudshop/*`.

**Todo recurso nuevo lleva el prefijo `cloudshop-`. Todo rol y política de aplicación lleva `path = "/cloudshop/"` y `permissions_boundary`.**

### Cambios en `infraestructure/cicd/policies.tf` (Fase 0)

El boundary original solo permitía `dynamodb:*Item`, `events:PutEvents`, `ses:SendEmail`/`SendRawEmail`, `logs:CreateLogStream`/`PutLogEvents` — insuficiente para las Lambdas ya escritas. Se amplió:

- **`workload_boundary`**: + `ssm:GetParameter(s)` sobre `parameter/app/*` (las Lambdas de `users/` y `notifications/` leen configuración en runtime), + `cognito-idp:Admin*`/`ListUsers` sobre `userpool/*`, + `ses:SendTemplatedEmail` (acción distinta de `SendEmail`, la usa `send-order-notification`), + `logs:CreateLogGroup`.
- **`compute`**: + gestión de `aws_ssm_parameter` (`PutParameter`/`GetParameter`/`DeleteParameter`/tagging) sobre `parameter/app/*`.
- **`data_edge`**: + `ses:CreateTemplate`/`UpdateTemplate`/`DeleteTemplate`/`GetTemplate` para `aws_ses_template`.

Los `Deny` de auto-escalada no se tocaron. Este cambio requiere un `terraform apply` manual en `infraestructure/cicd/`, con autorización explícita del usuario — no se aplicó automáticamente desde esta tarea.

## Modelo de datos: se siguió el código, no el diagrama de BD

`docs/context&resources/Diseño-BD-CloudShop.json` dice Orders PK=`StoreId` y Carts PK=`ClientId`, pero `orders/create_order` (código ya mergeado) usa `Key={"UserId": ...}` sobre Carts y `Key={"CustomerId": ..., "OrderId": ...}` sobre Orders. Las 4 Lambdas de `carts/` usan `ClientId`. Se creó `cloudshop-carts` con PK `ClientId` (mayoría + diagrama) y `cloudshop-orders` con PK `CustomerId`/SK `OrderId` (código real de `orders/`), lo que **deja `create_order` rompiendo contra la tabla de carritos** — documentado como bloqueo #4 en `PENDIENTE.md`, con el arreglo de dos líneas que le corresponde a backend.

Se añadió un GSI `StoreIdIndex` (HASH `StoreId`) a `cloudshop-orders`: `get_orders` filtra hoy por tienda con `scan` + `FilterExpression`; el GSI deja el camino para migrar a `query` sin urgencia.

## Estructura

Root: `providers.tf`, `variables.tf`, `terraform.tfvars`, `main.tf` (wiring de 10 módulos), `outputs.tf`.

Módulos en `infraestructure/modules/`: `dynamodb`, `cognito`, `ses`, `iam` (nuevo), `lambdas`, `api-gateway`, `eventbridge`, `s3`, `cloudfront`, `waf`, `cloudwatch`.

`docs/propuesta-terraform.md` es explícitamente no vinculante. Se adoptó su idea de un `.tf` por dominio dentro de `api-gateway/` (`resources.tf`, `routes.tf`), pero no en `lambdas/`, donde 24 entradas casi idénticas se colapsan en un `for_each` sobre un `locals.functions` — añadir una Lambda es una entrada nueva en el mapa, no un archivo nuevo.

## Lambdas sin código todavía: `fileexists()` como guard

Las funciones de Stores (5), Dashboard (1) y `carts_get` (1, "Ver Detalles del carrito" del diagrama, sin handler en `backend/lambdas/carts/`) no tienen código Python. Cada entrada de `locals.functions` en `infraestructure/modules/lambdas/main.tf` se filtra con:

```hcl
enabled_functions = {
  for key, fn in local.functions : key => fn
  if fileexists("${fn.source_dir}/${fn.entry_file}")
}
```

Verificado con `terraform console` que `fileexists()` devuelve `false` (no error) cuando falta el directorio completo, no solo el archivo — el guard es seguro hoy y en cuanto los compañeros hagan push del código, la Lambda aparece sola en el siguiente `plan`, sin que Terraform tenga que escribir una línea de Python. Los módulos `api-gateway` (rutas) y `eventbridge` (targets) heredan el mismo filtro indirectamente: solo referencian claves presentes en `module.lambdas.invoke_arns`/`function_arns`, que ya excluyen lo no habilitado.

## Roles IAM: uno por dominio

`infraestructure/modules/iam/` (módulo nuevo) crea 8 roles (`cloudshop-lambda-{orders,carts,products,stores,users,audit,notifications,dashboard}`), todos con `path = "/cloudshop/"`, `permissions_boundary` obligatorio, y una política inline acotada al mínimo necesario por dominio (tablas concretas, `events:PutEvents` solo en `orders`, `cognito-idp:Admin*` solo en `users`, `ses:SendTemplatedEmail` solo en `notifications`).

## Flujo del Caso de Prueba 2 (pedido → inventario → evento → auditoría → correo)

```
POST /orders → cloudshop-orders-create
  ├─ update_item ADD Stock (-qty) en cloudshop-products   [inventario]
  ├─ put_item en cloudshop-orders                          [pedido]
  └─ put_events → bus cloudshop-events                     [evento]
                    ├─ regla cloudshop-order-created → cloudshop-events-audit
                    │                                   └─ put_item en cloudshop-audit   [auditoría]
                    └─ regla cloudshop-order-created → cloudshop-notifications-send-order
                                                         └─ ses:SendTemplatedEmail        [correo]
```

El tramo del correo está cableado (bus, regla, `input_transformer`, permisos) pero **no funciona end-to-end** hasta que se resuelvan los bloqueos #3 y #4 de `PENDIENTE.md` (el evento `OrderCreated` no lleva `Items`, y la PK del carrito no coincide entre `carts/` y `orders/create_order`). `send-order-notification/handler.py` tiene forma de integración HTTP (`json.loads(event["body"])`), no de consumidor nativo de EventBridge; el `input_transformer` del target en `infraestructure/modules/eventbridge/main.tf` traduce el `Detail` PascalCase a `{"body": "<json snake_case>"}` para no tener que tocar `backend/`.

## Frontend y edge

Bucket S3 con **Block Public Access activo** (los 4 flags en `true`), versioning y SSE — se siguió `docs/Diseno_Seguridad_CloudShop.md` §3, no el Lab 8 (que usaba bucket público con website hosting). El acceso lo da CloudFront vía Origin Access Control; la bucket policy vive en el módulo `cloudfront/` (no en `s3/`) para evitar una dependencia circular entre ambos módulos — necesita el ARN de la distribución, que solo existe una vez creada.

Dos Web ACL de WAFv2 porque AWS exige scope distinto para cada superficie: `cloudshop-api-waf` (REGIONAL, asociada al stage de API Gateway) y `cloudshop-cdn-waf` (CLOUDFRONT, referenciada desde `web_acl_id` de la distribución). Ambas en `us-east-1`, que ya es la región del proyecto — no hizo falta un provider aliased.

## Dependencias circulares evitadas

Dos strings de convención (nunca outputs de módulo) rompen ciclos reales del grafo de módulos:

- **`event_bus_name`/`event_bus_arn`**: calculados en el root (`local.event_bus_name = "${var.project_name}-events"`, ARN construido a mano con `data.aws_caller_identity`), no leídos de `module.eventbridge`. El módulo `iam` los necesita (rol de `orders`) y `eventbridge` a su vez necesita los ARNs de las Lambdas ya creadas — depender del output real habría cerrado `iam → eventbridge → lambdas → iam`.
- **`api_gateway_name`**: la dimensión `ApiName` de CloudWatch es el *nombre* de la REST API, no su ID — se calculó como `"${var.project_name}-api"` en el root en vez de exponerlo como output de `api-gateway/`.

Un tercer problema, más sutil, apareció en `terraform plan`: los `.id` de `aws_api_gateway_resource` no se conocen hasta el `apply`, así que no pueden vivir dentro de un valor usado como clave de `for_each` (Terraform exige claves conocidas en plan). `infraestructure/modules/api-gateway/routes.tf` guarda solo `resource_key` (string estático) en cada ruta y resuelve el `.id` real contra un `local.resource_map` en el momento de usarlo dentro del recurso, no en la clave del `for_each`.

## Verificación realizada

- `terraform fmt -check -recursive` en todo el repo: limpio.
- `terraform validate` en el root y en `infraestructure/cicd/`: éxito en ambos.
- `terraform plan` contra AWS real (cuenta `636017850255`, sin `apply`): **235 recursos a crear, 0 a cambiar, 0 a destruir, 0 errores.**
- Confirmado que el guard `fileexists()` excluye correctamente `stores_*`, `dashboard_get` y `carts_get`: el plan solo lista las 20 Lambdas cuyo código existe hoy.

Ver `docs/terraform-infra/walkthrough.md` para el paso a paso de validación y qué falta para un `apply` real, y `PENDIENTE.md` para los bloqueos de backend con dueño.

## Open Questions heredadas (sin resolver aquí)

- Backend remoto S3 + DynamoDB lock (bloquea el `apply` automático).
- Migración de `github-actions` a OIDC.

Ambas siguen abiertas desde `docs/gh-actions-iam/spec.md`.
