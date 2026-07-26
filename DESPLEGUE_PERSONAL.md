# Guía de Despliegue Personal Aislado

Esta guía te ayudará a desplegar la infraestructura en **tu propia cuenta de AWS** sin afectar a otros compañeros.

## 🎯 Objetivo

Desplegar todos los recursos de CloudShop en tu cuenta personal de AWS, con nombres únicos que no colisionen con los de otros desarrolladores.

## 📋 Prerrequisitos

1. **Tener una cuenta de AWS** con permisos suficientes para crear recursos
2. **Credenciales de AWS configuradas** en tu entorno (via `~/.aws/credentials` o variables de entorno)
3. **Terraform instalado** (versión 1.9.x)
4. **Haber ejecutado el setup inicial de IAM** desde `infraestructure/cicd/` (ver abajo)

## 🚀 Pasos para el Despliegue Aislado

### Paso 1: Configurar la Política de Límite de Permisos (Permissions Boundary)

Antes de desplegar la infraestructura principal, necesitas crear la política `CloudShopWorkloadBoundary` en tu cuenta:

```bash
cd /workspace/infraestructure/cicd
```

Edita `variables.tf` si es necesario para usar tu configuración personal, luego ejecuta:

```bash
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

**Importante:** Anota el output `workload_boundary_arn` que se mostrará al finalizar. Lo necesitarás en el siguiente paso.

### Paso 2: Configurar Tus Variables Personales

1. **Copia el archivo de variables personales:**
   ```bash
   # El archivo terraform.tfvars.personal ya está creado en el root del proyecto
   ```

2. **Edita `terraform.tfvars.personal`** y modifica:
   - `project_name`: Cambia `"cloudshop-armando"` por un prefijo único (ej: `"cloudshop-tunombre"`)
   - `workload_boundary_arn`: Reemplaza `TU_NUMERO_DE_CUENTA` con tu número de cuenta de AWS real (12 dígitos)
   - `ses_source_email`: Tu email verificado en AWS SES (o usa el mismo si está en sandbox)

### Paso 3: Inicializar Terraform con Configuración Personal

Desde el directorio raíz del proyecto:

```bash
cd /workspace

# Inicializa Terraform
terraform init

# Ejecuta plan usando las variables personales
terraform plan -var-file="terraform.tfvars.personal" -out=tfplan.personal
```

### Paso 4: Revisar y Aplicar el Plan

Revisa cuidadosamente el plan generado. Deberías ver que todos los recursos tendrán el prefijo que configuraste (ej: `cloudshop-armando-*`).

```bash
# Aplica la infraestructura
terraform apply -var-file="terraform.tfvars.personal" tfplan.personal
```

### Paso 5: Verificar el Despliegue

Una vez completado:

1. Ve a la consola de AWS
2. Busca recursos con el prefijo que configuraste
3. Verifica que todos estén en tu cuenta

## 🔒 Aislamiento Garantizado

Con esta configuración:

- ✅ **Todos los recursos tienen nombres únicos** gracias al `project_name` personalizado
- ✅ **Los recursos están en TU cuenta** - no hay forma de afectar cuentas de otros
- ✅ **No hay colisiones** con despliegues de otros compañeros
- ✅ **Puedes destruir todo** sin afectar a nadie: `terraform destroy -var-file="terraform.tfvars.personal"`

## 🧹 Limpieza

Cuando termines de trabajar, para eliminar todos los recursos y evitar costos:

```bash
cd /workspace
terraform destroy -var-file="terraform.tfvars.personal"
```

## ⚠️ Advertencias Importantes

1. **NUNCA hagas merge** de cambios que incluyan `terraform.tfvars.personal` a la rama `main`
2. **Siempre verifica** que estás usando `-var-file="terraform.tfvars.personal"` en tus comandos
3. **Destruye los recursos** cuando no los necesites para evitar cargos en tu cuenta
4. **El permissions boundary** debe existir en TU cuenta antes de aplicar la infraestructura principal

## 📁 Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `terraform.tfvars.personal` | Variables con valores únicos para tu despliegue |
| `terraform.tfvars` | Variables por defecto (NO usar para despliegue personal) |
| `infraestructure/cicd/` | Setup inicial de IAM (permissions boundary) |

## 🆘 Solución de Problemas

### Error: "Permissions boundary not found"
Asegúrate de haber ejecutado primero el setup de `infraestructure/cicd/` y de haber copiado correctamente el ARN del output.

### Error: "Resource already exists"
Verifica que tu `project_name` sea único. Si otro compañero usó el mismo prefijo, cambia el tuyo.

### Error: "SES email not verified"
El email en `ses_source_email` debe estar verificado en AWS SES. En sandbox, solo puedes enviar a emails verificados.
