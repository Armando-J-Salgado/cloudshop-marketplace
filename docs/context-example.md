# 📌 Plan de Controles de Vinculación entre Servicios

## 1. Usuarios ↔ Cognito
- **Momento de prueba**: después de terminar Lambdas de usuarios y módulo Cognito en Terraform.  
- **Pruebas**:
  - Registro y login con Cognito.  
  - Validación de roles (cliente, operador, administrador).  
  - Que las Lambdas de usuarios solo se ejecuten si el token Cognito es válido.  
- **Objetivo**: confirmar autenticación/autorización y aplicación correcta de roles.

---

## 2. Carrito ↔ Productos
- **Momento de prueba**: después de terminar Lambdas de carrito y productos, y tablas DynamoDB.  
- **Pruebas**:
  - Agregar productos al carrito usando IDs válidos.  
  - Modificar cantidades y validar contra inventario.  
  - Vaciar carrito y confirmar cambios en DynamoDB.  
- **Objetivo**: verificar que el carrito se vincula con productos y no admite IDs inexistentes.

---

## 3. Pedidos ↔ Carrito ↔ Productos
- **Momento de prueba**: después de terminar Lambdas de pedidos y tener carrito/productos funcionando.  
- **Pruebas**:
  - Crear pedido desde el carrito y validar disponibilidad de inventario.  
  - Guardar pedido en DynamoDB.  
  - Confirmar que el pedido refleja productos y cantidades correctas.  
- **Objetivo**: asegurar que el flujo de compra conecta carrito → productos → pedidos sin inconsistencias.

---

## 4. EventBridge ↔ Pedidos
- **Momento de prueba**: después de terminar Lambda de creación de pedidos y configurar EventBridge.  
- **Pruebas**:
  - Publicación del evento `OrderCreated`.  
  - Que los consumidores (inventario, auditoría, notificaciones) se disparen automáticamente.  
- **Objetivo**: validar que los eventos se publican y consumen correctamente, manteniendo el sistema desacoplado.

---

## 5. Inventario ↔ Auditoría ↔ Notificaciones (SES)
- **Momento de prueba**: después de terminar Lambdas suscritas a EventBridge.  
- **Pruebas**:
  - Inventario se actualiza al recibir `OrderCreated`.  
  - Auditoría registra la acción en DynamoDB.  
  - SES envía correo de confirmación al cliente.  
- **Objetivo**: confirmar que los tres consumidores reaccionan al evento sin bloquearse entre sí.

---

## 6. Dashboard Ejecutivo ↔ Pedidos/Productos/Usuarios
- **Momento de prueba**: después de terminar Lambdas de dashboard y tener pedidos/productos/usuarios funcionando.  
- **Pruebas**:
  - Consultas de métricas (ventas, pedidos por estado, productos más vendidos, etc.).  
  - Validar que solo rol administrador accede.  
  - Paginación y límites para evitar scans completos en DynamoDB.  
- **Objetivo**: verificar que el dashboard consolida datos de múltiples tablas sin sobrecargar el sistema.

---

## 7. API Gateway ↔ WAF ↔ CloudWatch
- **Momento de prueba**: después de terminar configuración de API Gateway y WAF.  
- **Pruebas**:
  - Que cada endpoint invoca su Lambda correcta.  
  - Validación de cuerpo de petición y CORS.  
  - Rate limiting y bloqueo de ataques básicos (SQLi, XSS).  
  - Logs en CloudWatch para cada invocación.  
- **Objetivo**: confirmar seguridad, trazabilidad y correcto enrutamiento de todas las APIs.

---

## 📌 Orden de pruebas
1. Usuarios ↔ Cognito  
2. Carrito ↔ Productos  
3. Pedidos ↔ Carrito ↔ Productos  
4. EventBridge ↔ Pedidos  
5. Inventario ↔ Auditoría ↔ SES  
6. Dashboard ↔ Pedidos/Productos/Usuarios  
7. API Gateway ↔ WAF ↔ CloudWatch  
