# CloudShop Enterprise

![Terraform CI/CD](https://github.com/Armando-J-Salgado/cloudshop-marketplace/actions/workflows/terraform.yml/badge.svg)

CloudShop Enterprise es una plataforma de comercio electrónico de arquitectura _cloud-native_ basada en servicios de AWS. Aplica principios de escalabilidad, desacoplamiento, seguridad, observabilidad e infraestructura como código (IaC).

El proyecto integra almacenamiento en la nube, distribución de contenido, APIs REST, funciones _serverless_, bases de datos NoSQL, monitoreo, seguridad y despliegue automatizado.

---

## Arquitectura y Servicios de AWS Utilizados

El ecosistema se divide en múltiples módulos y utiliza los siguientes servicios:

- **Frontend**: Amazon S3 + Amazon CloudFront
- **Backend**: Amazon API Gateway + AWS Lambda (Python)
- **Base de Datos**: Amazon DynamoDB
- **Seguridad y Autenticación**: Amazon Cognito, IAM, AWS WAF
- **Eventos y Notificaciones**: Amazon EventBridge, Amazon SES
- **Monitoreo**: Amazon CloudWatch
- **Infraestructura (IaC)**: Terraform

Toda la infraestructura AWS se define en el directorio `infraestructure/`. Para detalles sobre el diseño y validación de la infraestructura, revisa [docs/terraform-infra/spec.md](docs/terraform-infra/spec.md) y [docs/terraform-infra/walkthrough.md](docs/terraform-infra/walkthrough.md).

---

## Instrucciones para Ejecutar el Proyecto

A continuación se detallan los pasos necesarios para levantar el proyecto localmente y desplegar sus servicios en la nube tras clonar el repositorio.

### Requisitos Previos

1. **Node.js y npm**: Necesarios para correr el frontend.
2. **Terraform**: Necesario para desplegar la infraestructura.
3. **AWS CLI**: Configurado localmente con credenciales válidas (Access Key y Secret Key) que posean permisos de despliegue.

### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/Armando-J-Salgado/cloudshop-marketplace.git
cd cloudshop-marketplace
```

### Paso 2: Despliegue de Infraestructura y Backend (AWS)

Dado que el backend es totalmente _serverless_, debe ser desplegado en AWS usando Terraform.

1. Navega a la carpeta principal o al directorio de infraestructura.
2. Inicializa Terraform:
   ```bash
   terraform init
   ```
3. Revisa el plan de despliegue:
   ```bash
   terraform plan
   ```
4. Aplica los cambios para crear los recursos en tu cuenta de AWS:
   ```bash
   terraform apply
   ```
   _(Nota: Asegúrate de tener los valores requeridos en `terraform.tfvars` si es necesario)._

### Paso 3: Configuración y Ejecución del Frontend (Local)

El frontend de la tienda está construido con Vite y React/TypeScript.

1. Navega al directorio del frontend:
   ```bash
   cd frontend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura las variables de entorno. Copia el archivo `.env.example` y renómbralo a `.env`:
   ```bash
   cp .env.example .env
   ```
   _(Actualiza las variables en el `.env` con las credenciales correspondientes a tu despliegue de AWS: Cognito User Pool, API Gateway URL, etc)._
4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. Abre la URL local (generalmente `http://localhost:5173`) en tu navegador para ver la plataforma.

---

## Flujo de Contribución

1. Crear una rama y abrir un **Pull Request** contra `development` (o `main`).
2. El pipeline de **GitHub Actions** corre automáticamente `fmt`, `validate` y `plan` de Terraform, y comenta el resultado del plan directamente en el PR.
3. Se requiere la revisión del equipo antes de hacer _merge_. El `apply` a AWS queda restringido por el _environment_ `aws-prod` y permanece deshabilitado hasta que exista un backend remoto de Terraform (ver [docs/gh-actions-iam/walkthrough.md](docs/gh-actions-iam/walkthrough.md)).

---
