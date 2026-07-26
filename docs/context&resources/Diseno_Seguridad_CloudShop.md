# Diseño de Seguridad - Proyecto CloudShop Enterprise

A continuación se detalla el diseño de seguridad estructurado a partir de los principios arquitectónicos y de acceso para la plataforma CloudShop Enterprise. Este documento servirá como contexto base para el desarrollo e implementación del proyecto.

## 1. Gestión de Identidad y Acceso (IAM y Cognito)
* **Autenticación (¿Quién eres?):** El registro y acceso de clientes y administradores se gestionará mediante **Amazon Cognito**. Al iniciar sesión, el sistema emitirá tokens JWT (JSON Web Tokens). Estos tokens funcionarán como credenciales temporales con tiempo de expiración corto, lo que reduce drásticamente la ventana de riesgo en caso de intercepción.
* **Autorización y Control de Acceso (¿Qué puedes hacer?):** El sistema define roles claros: Administrador, Operador y Cliente. Cada petición al backend validará la autenticación, el rol asociado al token y los permisos específicos requeridos para la acción.
* **Principio de Mínimo Privilegio:** Será la regla de oro para el control de accesos. Los usuarios, roles IAM y servicios tendrán asignados única y exclusivamente los permisos estrictamente necesarios. No se asignarán permisos administrativos globales sin justificación técnica.
* **Roles Temporales en Cómputo:** Las funciones Lambda no utilizarán credenciales de acceso permanente. Para interactuar con otros servicios (como Amazon DynamoDB), las Lambdas asumirán roles IAM temporales con políticas JSON precisas que expirarán automáticamente tras la ejecución de su tarea.

## 2. Protección Perimetral y de Red
* **Defensa de Borde (WAF y CloudFront):** El frontend (alojado en Amazon S3) se distribuirá mediante Amazon CloudFront, y la API estará protegida por **AWS WAF** (Web Application Firewall) para bloquear tráfico malicioso y ataques web antes de que ingresen a la capa de cómputo.
* **API Gateway como Guardia Digital:** Amazon API Gateway interceptará todas las peticiones y actuará como la primera línea de defensa. Se encargará de verificar las credenciales y validar las firmas de los tokens JWT. Las solicitudes inválidas o sin autorización serán rechazadas en la puerta, protegiendo el backend y ahorrando costos de ejecución de Lambdas.
* **Rate Limiting y CORS:** API Gateway configurará reglas CORS para asegurar la comunicación entre dominios permitidos y utilizará Rate Limiting para evitar abusos o ataques de fuerza bruta.
* **Cifrado en Tránsito:** Se requerirá el protocolo HTTPS obligatorio para que todos los datos viajen protegidos por un túnel cifrado (TLS/SSL).

## 3. Seguridad en la Capa de Aplicación y Datos
* **Cero Credenciales en Código:** Nunca se almacenarán claves de API, contraseñas o secretos en el código fuente. En su lugar, se emplearán servicios especializados como **AWS Secrets Manager** o **Parameter Store** para guardar credenciales de forma cifrada y automatizar su rotación.
* **Seguridad de Almacenamiento (Amazon S3):** Para el alojamiento del frontend, el bucket S3 tendrá la función "Block Public Access" activada por defecto. El acceso se definirá explícitamente mediante Bucket Policies para controlar quién puede leer o modificar recursos.
* **Cifrado en Reposo:** Los datos almacenados, tanto en S3 como en las tablas de DynamoDB, estarán protegidos a través de cifrado en reposo (por ejemplo, con SSE-S3 o KMS).
* **Validación de Datos y Manejo de Errores:** Se aplicará validación continua en las Lambdas, nunca asumiendo que los datos del payload del frontend son seguros sin verificar su formato y contenido. Adicionalmente, se ocultarán detalles técnicos y *stack traces* en las respuestas HTTP de error para no brindar pistas a posibles atacantes.

## 4. Auditoría, Trazabilidad y Monitoreo Continuo
* **Registro Transversal de Acciones (Auditoría):** Toda operación crítica (creación/eliminación de usuarios, cambios de inventario, gestión de pedidos) deberá ser rastreable. A través de **Amazon EventBridge**, los eventos del sistema activarán una función Lambda dedicada a la auditoría que registrará el evento en una tabla independiente en DynamoDB.
* **Estructura del Log:** La trazabilidad garantizará la transparencia detallando explícitamente: `{usuario, acción, fecha, resultado}`.
* **Monitoreo con CloudWatch:** Se utilizará Amazon CloudWatch para registrar logs de ejecución, métricas de API Gateway, y rastrear latencias o errores de autenticación. El monitoreo continuo permitirá identificar patrones anómalos o intentos de ataques en tiempo real.
