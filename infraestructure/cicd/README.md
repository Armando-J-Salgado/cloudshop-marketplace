# infraestructure/cicd — Usuario IAM para GitHub Actions

Root module **independiente** del root principal del proyecto. Crea el usuario IAM `github-actions` que consume el pipeline de CI/CD y sus políticas de mínimo privilegio.

## Por qué es un módulo aparte

El usuario que usa el pipeline no puede crearlo el propio pipeline (problema del huevo y la gallina). Este módulo se aplica **una sola vez, a mano**, por un humano con credenciales de dueño de la cuenta. El pipeline de GitHub Actions solo lo **valida** (`terraform fmt` + `terraform validate`), nunca lo aplica.

Ver el detalle de la decisión en [`docs/gh-actions-iam/spec.md`](../../docs/gh-actions-iam/spec.md).

## Apply manual (una sola vez)

> [!IMPORTANT]
> Requiere credenciales de administrador de la cuenta AWS propia del equipo, configuradas localmente (`aws configure` o variables `AWS_*`).

```bash
cd infraestructure/cicd
terraform init
terraform plan -out=cicd.tfplan
terraform apply cicd.tfplan
```

> [!WARNING]
> **En PowerShell hay que entrecomillar el `-out`:** `terraform plan "-out=cicd.tfplan"`.
> Sin comillas, PowerShell parte el argumento en el `=` y terraform falla con
> `Error: Too many command line arguments`.

**Qué debe mostrar el plan: exactamente 9 recursos a crear, nada más.**

| Recurso | Cantidad |
|---|---|
| `aws_iam_user.github_actions` | 1 |
| `aws_iam_policy` (compute, data_edge, iam, workload_boundary) | 4 |
| `aws_iam_user_policy_attachment` (readonly, compute, data_edge, iam) | 4 |

Si aparece cualquier otro recurso, o algún `destroy`, **detenerse y revisar** antes de aplicar.

## Crear la Access Key (consola, no Terraform)

Un `aws_iam_access_key` dejaría el *secret* en texto plano dentro de `terraform.tfstate`. Se crea a mano, igual que en el Laboratorio 10 (Parte 4.1, Paso 3):

1. AWS Console → **IAM → Users → `github-actions` → Security credentials → Create access key**.
2. Copiar el `Access Key ID` y el `Secret Access Key` (se muestra **una sola vez**) directo a los GitHub Secrets del repositorio — nunca a un archivo del repo:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

## El estado de este módulo

`terraform.tfstate` queda **local y fuera de git** (ver `.gitignore`). Es aceptable: este módulo se toca 2-3 veces en todo el proyecto.

### Si se pierde el estado local

No se recrea nada — se re-importa:

```bash
terraform import aws_iam_user.github_actions github-actions
terraform import aws_iam_policy.compute            "$(aws iam list-policies --path-prefix /cicd/ --query "Policies[?PolicyName=='github-actions-compute'].Arn" --output text)"
terraform import aws_iam_policy.data_edge          "$(aws iam list-policies --path-prefix /cicd/ --query "Policies[?PolicyName=='github-actions-data-edge'].Arn" --output text)"
terraform import aws_iam_policy.iam                "$(aws iam list-policies --path-prefix /cicd/ --query "Policies[?PolicyName=='github-actions-iam'].Arn" --output text)"
terraform import aws_iam_policy.workload_boundary   "$(aws iam list-policies --path-prefix /cicd/ --query "Policies[?PolicyName=='CloudShopWorkloadBoundary'].Arn" --output text)"
```

## Registro de aplicación

| Fecha | Quién | Notas |
|---|---|---|
| _(pendiente)_ | | Completar tras el primer `apply` manual |

## Próximos pasos (fuera de alcance de este módulo)

- Backend remoto S3 + tabla `terraform-lock` (Laboratorio 10, Parte 2) para habilitar `terraform apply` desde el pipeline.
- Roles de ejecución de las Lambdas bajo `role/cloudshop/*`, usando `aws_iam_policy.workload_boundary` como permissions boundary.
