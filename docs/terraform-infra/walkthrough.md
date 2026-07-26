# Walkthrough: Infraestructura Terraform de CloudShop Marketplace

Cierra el paso 2 del roadmap. Ver `docs/terraform-infra/spec.md` para el detalle de diseño y decisiones; este documento es el paso a paso para que valides que todo está correcto.

## Qué cambió

- **`infraestructure/cicd/policies.tf`**: se amplió el permissions boundary y las políticas del pipeline (SSM, Cognito Admin*, `ses:SendTemplatedEmail`, `ses:CreateTemplate`) para que alcancen a cubrir lo que las Lambdas ya escritas necesitan. **No se aplicó** — sigue como estaba en AWS hasta que lo autorices.
- **Root** (`providers.tf`, `variables.tf`, `terraform.tfvars`, `main.tf`, `outputs.tf`): antes vacíos, ahora despliegan la plataforma completa mediante 10 módulos.
- **11 módulos** en `infraestructure/modules/`: `dynamodb`, `cognito`, `ses`, `iam` (nuevo), `lambdas`, `api-gateway`, `eventbridge`, `s3`, `cloudfront`, `waf`, `cloudwatch`. Todos estaban a 0 bytes; ahora tienen contenido real.
- **`.terraform.lock.hcl`** (root): generado con hashes para `linux_amd64` y `windows_amd64`, para que el job `plan` de GitHub Actions no falle en el runner Linux.
- **`PENDIENTE.md`** (raíz): 9 puntos que quedaron fuera de esta tarea, cada uno con dueño.

Ningún archivo dentro de `backend/` se tocó.

## Cómo validar

### 1. Formato y sintaxis (sin AWS)

```bash
terraform fmt -check -recursive -diff
terraform init -backend=false
terraform validate
```

```bash
cd infraestructure/cicd
terraform init -backend=false
terraform validate
```

Ambos deben terminar en `Success! The configuration is valid.` — ya se corrió y pasó limpio.

### 2. Plan contra AWS (solo lectura, no toca nada)

```bash
terraform plan
```

Debe mostrar **235 recursos a crear, 0 a cambiar, 0 a destruir**, sin errores. Cosas puntuales a revisar en la salida:

- Exactamente **20 `aws_lambda_function`** (no 26): las 5 de `stores/`, la de `dashboard/` y `carts_get` no aparecen porque su código todavía no existe en `backend/`. Verificable con:
  ```bash
  terraform show -json tfplan | grep -o 'aws_lambda_function.this\["[a-z_]*"\]' | sort -u
  ```
- **5 tablas DynamoDB**: `cloudshop-carts`, `cloudshop-products`, `cloudshop-orders` (con GSI `StoreIdIndex`), `cloudshop-stores`, `cloudshop-audit`.
- **8 roles IAM**, todos con `permissions_boundary` no vacío y `path = "/cloudshop/"`.
- **1 REST API** con authorizer Cognito, api key, usage plan (burst 20 / rate 10) y stage `dev`.
- **1 event bus** (`cloudshop-events`) + 3 reglas + targets a `cloudshop-events-audit` y `cloudshop-notifications-send-order`.
- **1 bucket S3** (Block Public Access activo) + **1 distribución CloudFront** (OAC) + **2 Web ACL de WAFv2** (REGIONAL y CLOUDFRONT).

### 3. Lo que NO se hizo (y por qué)

- **No se corrió `terraform apply`.** Ningún agente de IA tiene permiso de aplicar cambios en AWS sin tu autorización explícita (`docs/context&resources/CLAUDE.md`). Cuando decidas aplicar:
  1. Primero `infraestructure/cicd/` (Fase 0, las políticas ampliadas) — sin esto, el `apply` del root fallará con `AccessDenied` en cuanto intente tocar SSM/Cognito/SES template.
  2. Antes de aplicar el root: reemplazar `ses_source_email` en `terraform.tfvars` (hoy es un placeholder, `notifications@cloudshop.example`) por un remitente real y verificado en SES.
  3. Luego `terraform apply` en el root.
- **No se tocó nada en `backend/`.** Los 4 bloqueos de código que el plan de infraestructura dejó al descubierto (PK del carrito, `Items` faltante en el evento, `GET /carts/{id}` sin handler, Stores/Dashboard sin código) están en `PENDIENTE.md` con su dueño — no se resuelven aquí.
- **El correo del Caso de Prueba 2 no funcionará** hasta que se arreglen los bloqueos #3 y #4 de `PENDIENTE.md`, aunque todo el cableado (bus, reglas, permisos, `input_transformer`) ya está.

## Después del `apply`

Con las credenciales AWS de tu sesión (no las del pipeline):

```bash
terraform output
```

Debe mostrar `api_url`, `user_pool_id`, `app_client_id`, `frontend_url`, `cloudfront_domain`, `frontend_bucket_name`, `event_bus_name`, `dynamodb_tables`, `dashboard_name`.

Para los 4 casos de prueba obligatorios del documento del proyecto, ver la sección "Plan de verificación" de `docs/terraform-infra/spec.md`.
