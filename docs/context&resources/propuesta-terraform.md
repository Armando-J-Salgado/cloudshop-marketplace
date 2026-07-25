# PROPUESTA DE ESTRUCTURA DE CARPETAS

Esto **no** es un diseño definitivo. Solo es una guía de como puede verse la estructura de la infraestructura terraform

📂 infrastructure/
└── 📂 modules/
    ├── 📂 api-gateway/
    │   ├── api_gateway.tf           # Declaración principal del API Gateway (REST API)
    │   ├── roles.tf                 # Roles IAM y políticas para integraciones
    │   ├── deployment.tf            # Declaración del deployment del API Gateway
    │   ├── stage.tf                 # Configuración de stages (dev, staging, prod)
    │   ├── users.tf                 # Rutas e integraciones del módulo Users
    │   ├── cart.tf                  # Rutas e integraciones del módulo Cart
    │   ├── products.tf              # Rutas e integraciones del módulo Products
    │   ├── stores.tf                # Rutas e integraciones del módulo Stores
    │   ├── orders.tf                # Rutas e integraciones del módulo Orders
    │   ├── dashboard.tf             # Rutas e integraciones del módulo Dashboard
    │   ├── audit.tf                 # Rutas e integraciones del módulo Audit
    │   └── notifications.tf         # Rutas e integraciones del módulo Notifications

    ├── 📂 lambdas/
    │   ├── users.tf                 # Definición de Lambdas del módulo Users
    │   ├── cart.tf                  # Definición de Lambdas del módulo Cart
    │   ├── products.tf              # Definición de Lambdas del módulo Products
    │   ├── stores.tf                # Definición de Lambdas del módulo Stores
    │   ├── orders.tf                # Definición de Lambdas del módulo Orders
    │   ├── dashboard.tf             # Definición de Lambdas del módulo Dashboard
    │   ├── audit.tf                 # Definición de Lambda de Auditoría
    │   └── notifications.tf         # Definición de Lambda de Notificaciones

    ├── 📂 dynamodb/
    │   ├── users.tf                 # Tabla Users
    │   ├── cart.tf                  # Tabla Cart
    │   ├── products.tf              # Tabla Products
    │   ├── stores.tf                # Tabla Stores
    │   ├── orders.tf                # Tabla Orders
    │   └── audit.tf                 # Tabla Audit

    ├── 📂 s3/
    │   └── frontend.tf              # Bucket para hosting del frontend

    ├── 📂 cloudfront/
    │   └── cdn.tf                   # Distribución CDN

    ├── 📂 cognito/
    │   ├── user_pool.tf             # User Pool
    │   ├── identity_pool.tf         # Identity Pool
    │   └── roles.tf                 # Roles y grupos de usuarios

    ├── 📂 eventbridge/
    │   ├── rules.tf                 # Reglas de eventos (OrderCreated, etc.)
    │   └── targets.tf               # Targets (Lambdas de inventario, auditoría, notificaciones)

    ├── 📂 ses/
    │   └── email.tf                 # Configuración de SES

    ├── 📂 waf/
    │   └── waf.tf                   # Configuración de WAF

    └── 📂 cloudwatch/
        └── logs.tf                  # Logs y métricas
