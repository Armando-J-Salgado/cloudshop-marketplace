# GitHub Actions + IAM de CI/CD (`github-actions`)

Cierra el TODO de `docs/context&resources/CLAUDE.md` sobre "GitHub Actions con un IAM específico para desplegar la versión más reciente del proyecto". Es el **paso 1 del roadmap** acordado: (1) GitHub Actions → (2) infraestructura Terraform completa, incluyendo Lambdas y sus roles de mínimo privilegio → (3) front-end.

## Contexto Arquitectónico

| Aspecto | Detalle |
|---|---|
| **Estado inicial** | `github/workflows/terraform.yml` vacío y en ruta inválida (`github/` sin punto); los 27 `.tf` + `terraform.tfvars` de todo el repo vacíos; cero recursos IAM |
| **Alcance de esta tarea** | Únicamente el usuario/pipeline de CI/CD. Los roles de ejecución de Lambda y los roles de aplicación (Cognito) quedan para el paso 2 del roadmap |
| **Autenticación** | Usuario IAM `github-actions` + Access Keys en GitHub Secrets |
| **Backend de Terraform** | Local, sin cambios. El backend remoto S3 + DynamoDB lock queda **fuera de alcance** |
| **Root module nuevo** | `infraestructure/cicd/` — independiente del root principal, apply manual único |

## Alineación con el Laboratorio 10

Se revisó `LABORATORIO 10.docx` ("CloudBox Enterprise CI/CD — Automatización de Infraestructura mediante GitHub Actions y Terraform") para verificar que el proceso siga lo enseñado en clase.

| Aspecto | Laboratorio 10 | Esta implementación | Estado |
|---|---|---|---|
| Ruta del workflow | `.github/workflows/terraform.yml` | Igual | ✅ |
| Nombre del principal IAM | `github-actions` | Igual | ✅ |
| Autenticación | Usuario IAM + Access Keys en GitHub Secrets | Igual | ✅ |
| Secrets | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Igual | ✅ |
| Pasos del pipeline | init → fmt → validate → plan → apply | Igual, más `fmt` antes de tocar AWS y comentario del plan en el PR | ✅ ampliado |
| Trigger | `push` a `main` | `push` a `main` + `pull_request` + `workflow_dispatch` | ✅ ampliado |
| Permisos del usuario | `AdministratorAccess` ("para efectos académicos") | Políticas de mínimo privilegio | ⚠️ divergencia deliberada |
| Backend remoto S3 + lock | Parte 2, evidencias 4/5/6 | Fuera de alcance | ⚠️ omisión conocida |

### Por qué no se usó `AdministratorAccess`

El propio laboratorio anota, en la Parte 4.1: *"En un ambiente empresarial se recomienda aplicar el principio de mínimo privilegio, otorgando únicamente los permisos estrictamente necesarios para el despliegue."* El documento del proyecto final (§5) va más allá y lo hace obligatorio: *"No se permitirá asignar permisos administrativos globales sin justificación técnica."* `Diseno_Seguridad_CloudShop.md` lo repite como "regla de oro". `AdministratorAccess` habría sido una contradicción directa con la rúbrica de evaluación del proyecto, así que se implementó mínimo privilegio desde el inicio en vez de partir del laboratorio y reducir permisos después.

> [!IMPORTANT]
> **Limitación asumida conscientemente:** el backend remoto quedó fuera de alcance por decisión explícita. Sin estado compartido, cada corrida del runner arranca con estado vacío, así que un `apply` automático intentaría recrear todo o fallaría en cascada con `AlreadyExists`. Por eso el job de `apply` se entrega **deshabilitado por bandera** (`vars.ENABLE_TF_APPLY = false`) y el pipeline es útil desde el día uno para `fmt` / `validate` / `plan`. Quedan pendientes las evidencias 4, 5, 6, 12 y 13 del laboratorio; se registran como próximo paso en el walkthrough.

## Proposed Changes

### Estructura de archivos creados

```
.github/
└── workflows/
    ├── terraform.yml            fmt · validate · plan · apply (gateado)
    └── backend-python.yml       compileall + ruff sobre backend/

infraestructure/
└── cicd/                        root module independiente, apply manual único
    ├── versions.tf
    ├── provider.tf
    ├── main.tf                  usuario IAM github-actions
    ├── policies.tf              políticas de mínimo privilegio + boundary
    ├── variables.tf
    ├── outputs.tf
    └── README.md                procedimiento manual y recuperación por import

docs/gh-actions-iam/
├── spec.md                      este documento
└── walkthrough.md
```

### El problema del huevo y la gallina

El usuario IAM que consume el pipeline no puede crearlo el pipeline. Por eso `infraestructure/cicd/` es un root module **separado** del root principal, que el pipeline solo valida (nunca aplica). Se aplica a mano, una sola vez, y su estado queda local. Si se pierde, se re-importa con `terraform import` (comandos en su `README.md`).

### La Access Key no se crea con Terraform

Un `aws_iam_access_key` dejaría el secreto en texto plano dentro de `terraform.tfstate`. Se crea a mano desde la consola, exactamente como en el Laboratorio 10 (Parte 4.1, Paso 3). Es la única excepción justificada al "no se permitirá la creación manual de recursos AWS" del §9 del documento del proyecto: se crea una **credencial**, no un recurso de infraestructura.

### Matriz de permisos por servicio

Tres políticas gestionadas (el límite de 6144 caracteres por política obliga a partirlas):

| Política | Servicios | Restricción |
|---|---|---|
| `github-actions-compute` | Lambda, API Gateway, EventBridge, CloudWatch Logs/Alarms | Prefijo `cloudshop-*` en los ARN |
| `github-actions-data-edge` | DynamoDB, S3, CloudFront, WAFv2, SES, Cognito | Prefijo `cloudshop-*` donde AWS lo soporta |
| `github-actions-iam` | IAM | Path `/cloudshop/` + permissions boundary obligatorio + `Deny` explícito |

Más `arn:aws:iam::aws:policy/ReadOnlyAccess` para que `terraform plan` pueda hacer el refresh de cualquier recurso, sin poder mutar nada.

**Honestidad sobre las limitaciones de AWS IAM:** CloudFront, WAFv2 y las acciones de creación de API Gateway no soportan restricción por nombre de recurso (`Resource: "*"` es la única opción de AWS para esas acciones). Se acota entonces por lista cerrada de acciones en vez de por recurso.

**La tensión de `iam:CreateRole` + `iam:PassRole`:** el paso 2 del roadmap va a necesitar que este pipeline cree roles de ejecución para las Lambdas, lo cual es escalada de privilegios en potencia (podría crear un rol admin y pasárselo a una Lambda). Mitigado con tres capas combinadas:
1. Solo puede crear/gestionar roles y políticas bajo el path `/cloudshop/`.
2. Cualquier rol que cree debe llevar adjunto el permissions boundary `CloudShopWorkloadBoundary` (sin `iam:*`, sin `sts:AssumeRole`) — impuesto por `condition` en la política, no por convención.
3. `PassRole` restringido además por `iam:PassedToService` a `lambda`, `apigateway` y `events`.
4. `Deny` explícito e incondicional sobre `user/cicd/*`, `role/cicd/*`, `policy/cicd/*` — el pipeline no puede tocarse a sí mismo ni rotarse su propia credencial. Un `Deny` gana sobre cualquier `Allow`, incluido `ReadOnlyAccess`.

## Open Questions

- ¿Cuándo se aborda el backend remoto S3 + DynamoDB lock? Bloquea las evidencias 4/5/6/12/13 del Laboratorio 10 y el `apply` automático real.
- ¿El usuario `github-actions` migra a OIDC (rol asumible, sin Access Keys) más adelante, o se mantiene como está por alineación con el laboratorio hasta el cierre del proyecto?

## Verification Plan

Ver `docs/gh-actions-iam/walkthrough.md`, sección Verificación.
