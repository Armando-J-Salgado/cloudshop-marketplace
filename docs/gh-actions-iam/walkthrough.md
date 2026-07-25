# Walkthrough — GitHub Actions + IAM de CI/CD

## Resumen

Se creó el pipeline de CI/CD en GitHub Actions y el usuario IAM `github-actions` que lo autentica contra AWS, cerrando el TODO de `docs/context&resources/CLAUDE.md`. La carpeta `github/workflows/` (vacía, sin punto, no detectada por GitHub) se eliminó en favor de `.github/workflows/`. El pipeline hoy cubre `fmt` + `validate` + `plan` en cada PR; el job de `apply` existe pero está deshabilitado por bandera hasta que exista un backend remoto de Terraform.

## Archivos Creados

| Archivo | Propósito |
|---|---|
| [.github/workflows/terraform.yml](file:///c:/ESEN/2026/Ciclo%20II/Nube/Proyecto%20nube/cloudshop-marketplace/.github/workflows/terraform.yml) | Pipeline: fmt → validate → plan (comenta en el PR) → apply (gateado) |
| [.github/workflows/backend-python.yml](file:///c:/ESEN/2026/Ciclo%20II/Nube/Proyecto%20nube/cloudshop-marketplace/.github/workflows/backend-python.yml) | Sintaxis + lint de errores reales sobre `backend/**` |
| [infraestructure/cicd/main.tf](file:///c:/ESEN/2026/Ciclo%20II/Nube/Proyecto%20nube/cloudshop-marketplace/infraestructure/cicd/main.tf) | Usuario IAM `github-actions` + adjuntos de política |
| [infraestructure/cicd/policies.tf](file:///c:/ESEN/2026/Ciclo%20II/Nube/Proyecto%20nube/cloudshop-marketplace/infraestructure/cicd/policies.tf) | Las 3 políticas de mínimo privilegio + el permissions boundary |
| [infraestructure/cicd/README.md](file:///c:/ESEN/2026/Ciclo%20II/Nube/Proyecto%20nube/cloudshop-marketplace/infraestructure/cicd/README.md) | Procedimiento de apply manual, creación de Access Key, recuperación por import |
| [docs/gh-actions-iam/spec.md](file:///c:/ESEN/2026/Ciclo%20II/Nube/Proyecto%20nube/cloudshop-marketplace/docs/gh-actions-iam/spec.md) | Spec plan de esta tarea |

## Patrones Implementados

- **Root module aparte para el IAM de CI/CD** (`infraestructure/cicd/`), con apply manual único, para resolver el problema del huevo y la gallina (el pipeline no puede crear el usuario que él mismo necesita).
- **Mínimo privilegio por prefijo de nombre** (`cloudshop-*`) en Lambda, API Gateway, EventBridge, CloudWatch, DynamoDB y S3.
- **Permissions boundary obligatorio por `condition`** (`CloudShopWorkloadBoundary`) sobre cualquier rol que el pipeline cree en el futuro, para evitar escalada de privilegios vía `iam:CreateRole` + `iam:PassRole`.
- **`Deny` explícito de auto-escalada**: el usuario `github-actions` no puede modificarse a sí mismo ni a las políticas de `/cicd/`.
- **`validate` sin credenciales AWS**: el primer job del pipeline corre sin ningún secret, así que un PR no confiable no llega a tocar AWS en esa etapa.
- **Comentario de plan idempotente en el PR**: busca un marcador HTML y actualiza el comentario existente en vez de acumular uno por push.
- **Apply gateado por triple candado**: variable de repo `ENABLE_TF_APPLY`, rama `main`, y GitHub Environment `aws-prod` con revisores obligatorios.

## Secrets y Variables de GitHub Requeridos

| Nombre | Tipo | Valor | Dónde se configura |
|---|---|---|---|
| `AWS_ACCESS_KEY_ID` | Secret | Access Key del usuario `github-actions` | Settings → Secrets and variables → Actions → Secrets |
| `AWS_SECRET_ACCESS_KEY` | Secret | Secret Key del usuario `github-actions` | Igual |
| `AWS_REGION` | Variable | `us-east-1` | Settings → Secrets and variables → Actions → Variables |
| `ENABLE_TF_APPLY` | Variable | `false` (hasta que exista backend remoto) | Igual |

Además, un GitHub Environment `aws-prod` con *required reviewers* y *deployment branches* restringido a `main`.

## Verificación

Pendiente de ejecutar en GitHub (requiere que el usuario complete el apply manual de `infraestructure/cicd/` y configure los Secrets/Variables — ver su README):

1. `terraform fmt -diff -recursive` → sin salida (ya verificado localmente).
2. `terraform validate` en `infraestructure/cicd/` → `Success! The configuration is valid.` (ya verificado localmente).
3. YAML de ambos workflows parseado con `python -c "import yaml; yaml.safe_load(...)"` → OK (ya verificado localmente).
4. Abrir un PR de prueba hacia `development`: el job `validate` debe pasar en verde sin tocar AWS.
5. En el log del job `plan`, `aws sts get-caller-identity` debe devolver `arn:aws:iam::<acct>:user/cicd/github-actions`.
6. El comentario del plan debe aparecer en el PR (dirá `No changes` mientras los `.tf` de la raíz sigan vacíos — es correcto).
7. Un segundo push al PR debe actualizar el comentario existente, no crear uno nuevo.
8. **Prueba negativa de mínimo privilegio:** en una rama descartable, añadir al job `plan` un step `run: aws iam create-user --user-name prueba`. Debe fallar con `AccessDenied`.
9. El job `apply` debe salir como *skipped* (`ENABLE_TF_APPLY == 'false'`).

## Próximos pasos

1. **Backend remoto de Terraform** (Laboratorio 10, Parte 2): bucket S3 versionado + cifrado y tabla DynamoDB `terraform-lock`, luego activar `ENABLE_TF_APPLY = true`. Desbloquea las evidencias 4, 5, 6, 12 y 13 del laboratorio y hace que el `apply` automático sea reproducible.
2. **Llenar los `.tf` de la raíz** (`providers.tf`, `variables.tf`, `terraform.tfvars`) con `required_version`, `required_providers` y `provider "aws"` — se dejaron vacíos a propósito en esta tarea, es trabajo del paso 2 del roadmap (infraestructura completa + Lambdas).
3. **Roles de ejecución de las Lambdas** bajo `role/cloudshop/*`, usando el permissions boundary `CloudShopWorkloadBoundary` ya creado en `infraestructure/cicd/policies.tf`.
4. **Rotar o migrar la Access Key** del usuario `github-actions` al cerrar el proyecto, o migrar a OIDC (rol asumible sin credenciales de larga vida) si se decide ir más allá de lo enseñado en el laboratorio.
