<div align="center">

# Proyecto Final - CloudShop Enterprise

Plataforma de Comercio Electrónico.

</div>

## 1. Objetivo General

Diseñar, desarrollar, desplegar y documentar una plataforma de comercio electrónico empresarial utilizando una arquitectura cloud-native basada en servicios AWS, aplicando principios de escalabilidad, desacoplamiento, seguridad, observabilidad e infraestructura como código.

El proyecto deberá integrar los conocimientos adquiridos durante todo el ciclo, incluyendo almacenamiento en la nube, distribución de contenido, APIs REST, funciones serverless, bases de datos NoSQL, monitoreo, seguridad e infraestructura automatizada.

## 2. Arquitectura General

<div style='text-align: center;'><img src='https://maas-watermark-prod-new.cn-wlcb.ufileos.com/ocr%2Fcrop%2F20260722004028655760fc00f2435b%2Fcrop_1_1784652059895.png?UCloudPublicKey=TOKEN_6df395df-5d8c-4f69-90f8-a4fe46088958&Signature=E9B6Lg9Juhi6UzuHErFb2ScMrkE%3D&Expires=1785256859' alt='OCR图片'/></div>

## 3.Servicios AWS Obligatorios

## Frontend

- Amazon S3

- Amazon CloudFront

## Seguridad

IAM

- IAM Roles

- IAM Policies

- AWS WAF

## Backend

- Amazon API Gateway

- AWS Lambda

Datos

- Amazon DynamoDB

Eventos

- Amazon EventBridge

Monitoreo

- Amazon CloudWatch

Notificaciones

- Amazon SES

Infraestructura

- Terraform

## 4. Requerimientos Funcionales

## Módulo 1 - Gestión de Usuarios

Permitir:

- Registro de usuarios

- Consulta de usuarios

- Actualización de usuarios

- Desactivación de usuarios

Roles:

- Administrador

- Operador

- Cliente

## Módulo 2 - Gestión de Productos

Permitir:

- Crear productos

- Actualizar productos

- Eliminar productos

- Consultar productos

Cada producto deberá contener:

- Código

- Nombre

- Descripción

- Categoría

- Precio

- Inventario disponible

- Tienda propietaria

## Módulo 3 - Gestión de Tiendas

Permitir:

- Crear tienda

- Actualizar tienda

- Consultar tienda

- Desactivar tienda

Una tienda puede tener múltiples productos.

## Módulo 4 - Carrito de Compras

Permitir:

- Agregar productos

- Modificar cantidades

- Eliminar productos

- Vaciar carrito

## Módulo 5 - Gestión de Pedidos

Permitir:

- Crear pedido

- Consultar pedido

- Actualizar estado

- Cancelar pedido

Estados mínimos:

- Pendiente

- Confirmado

- En preparación

- Enviado

- Entregado

- Cancelado

## Módulo 6 - Dashboard Ejecutivo

Mostrar:

- Total de ventas

- Ventas por tienda

- Productos más vendidos

- Productos agotados

- Clientes con más compras

- Pedidos por estado

<div align="center">

# 5.Seguridad

</div>

## Gestión de Roles

## Administrador

Puede:

- Gestionar usuarios

- Gestionar tiendas

- Gestionar productos

- Consultar reportes

## Operador

Puede:

- Gestionar inventario

- Gestionar pedidos

## Cliente

Puede:

- Comprar productos

- Consultar pedidos propios

## Control de Acceso

- Autenticación

Todos los endpoints deberán validar:

- Rol

- Permisos

Ejemplo:

DELETE /productos solo puede ser ejecutado por el Administrador

## Principio de Mínimo Privilegio

- Los roles IAM deberán cumplir el principio de mínimo privilegio.

- No se permitirá asignar permisos administrativos globales sin justificación técnica.

## 6. Arquitectura Basada en Eventos

Cuando se genere un pedido:

<div style='text-align: center;'><img src='https://maas-watermark-prod-new.cn-wlcb.ufileos.com/ocr%2Fcrop%2F20260722004028655760fc00f2435b%2Fcrop_1_1784652059952.png?UCloudPublicKey=TOKEN_6df395df-5d8c-4f69-90f8-a4fe46088958&Signature=2dwKqSfHfKTucd4SVYxP6xVDHkw%3D&Expires=1785256859' alt='OCR图片'/></div>

## 7.Auditoría

Toda acción relevante deberá registrarse.

Ejemplos:

- Creación de usuarios

- Eliminación de productos

- Creación de pedidos

- Cancelación de pedidos

- Modificación de inventario

Ejemplo de registro:

{

"usuario":"admin01",

"accion":"ELIMINAR_PRODUCTO",

"fecha":"2026-07-25",

"resultado":"EXITOSO"

}

## 8.Monitoreo

Implementar CloudWatch para:

- Logs de Lambda

- Métricas de API Gateway

- Errores de autenticación

- Errores de aplicación

- Latencia promedio

## 9.Infraestructura como Código

- Toda la infraestructura deberá desplegarse utilizando Terraform.

- No se permitirá la creación manual de recursos AWS.

- Terraform deberá desplegar como mínimo:

1 Bucket S3

1 Distribución CloudFront

1 WAF

1 API Gateway

Múltiples funciones Lambda

Múltiples tablas DynamoDB

Roles IAM

Policies IAM

EventBridge

CloudWatch

SES

## 10.Entregables

- Repositorio Git del proyecto.

- Archivos Terraform completos.

- Documento Técnico

Arquitectura

Diseño de APIs

Diseño de Base de Datos

Diseño de Seguridad

Evidencias de despliegue

- Exposición: Todos los integrantes deberán estar preparados para responder preguntas técnicas sobre cualquier componente desarrollado.

## 11.Casos de Prueba Obligatorios

Caso 1: Intento de acceso sin permisos.

Resultado esperado: 403 Forbidden

Caso 2: Creación exitosa de pedido.

Debe evidenciar:

- Pedido creado

- Inventario actualizado

- Evento generado

- Auditoría registrada

- Correo enviado

Caso 3: Visualización de métricas en CloudWatch.

Caso 4: Despliegue completo mediante Terraform.

## 12.Rúbrica de Evaluación del Proyecto Final

<table border="1"><tr><td>Criteria</td><td>Descripción</td><td>Ponderación</td></tr><tr><td>Funcionalidad del sistema</td><td>La aplicación funciona correctamente de extremo a extremo.</td><td>30%</td></tr><tr><td>Arquitectura e integración</td><td>Correcta integración entre frontend, API y base de datos.</td><td>25%</td></tr><tr><td>Uso de tecnologías cloud</td><td>Implementación adecuada de servicios AWS. Implementación adecuada de servicios con Terraform, según aplique.</td><td>15%</td></tr><tr><td>Calidad técnica</td><td>Código claro, validaciones básicas y buenas prácticas.</td><td>15%</td></tr><tr><td>Documentación y presentación</td><td>Explicación clara del sistema y su funcionamiento.</td><td>15%</td></tr></table>

Valor del Proyecto Final: 40% de la nota global del curso.