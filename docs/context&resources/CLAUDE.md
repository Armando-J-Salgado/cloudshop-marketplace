# Proyecto de Nube: Cloudshop Marketplace
## Contexto

<!-- TODO: Descripción del proyecto y su estado actual (actualizado con cada cambio o commit) -->

### Recursos auxiliares y referencias para contexto
- [Documento de indicaciones y rúbrica de evaluación](<Proyecto Final - CloudShop Enterprise.md>): Contiene las indicaciones del proyecto, es una guía general en términos de requerimientos mínimos, servicios a utilizar y entregables.
- [Repositorio principal del proyecto](cloudshop-marketplace): Contiene el código fuente y la infraestructura del proyecto. Aquí es donde se deben manejar con más cuidado los cambios en el proyecto y de donde se debe de mantener actualizada la documentación.
- [Repositorio de referencia - Laboratorio 10](https://github.com/GiGiS05/cloudbox-enterprise): Repositorio de referencia de un proyecto anterior que puede ser de utilidad para comprender la intención de ciertas decisiones detrás del diseño del proyecto de CloudShop.
- [Repositorio de referencia - Laboratorios 7 - 9](https://github.com/Reina905/cloudbox-enterprise): Repositorio de referencia que se constituye por varios laboratorios utilizados en conjunto como una parte del Laboratorio 10. También será de utilidad para comprender la intención de ciertas decisiones detrás del diseño del proyecto de CloudShop.
- [Diagrama de APIs](Diagrama-APIs-Cloudshop.json): Contiene el diagrama de APIs del proyecto en formato JSON.
- [Diseño de seguridad](Diseno_Seguridad_CloudShop.md): Contiene el diseño de seguridad del proyecto en formato Markdown. Es una guía general en términos de requerimientos mínimos de seguridad.
- [Documento entregable Final del Proyecto](https://esenedusv-my.sharepoint.com/:w:/g/personal/20245138_esen_edu_sv/IQC-_cf668EOTYE6hEiSPsvNAQSTYoHDrJqJNcy7VjtYN-s?e=vmqvaY): Este documento contiene la mayoría de la información centralizada en términos de diseño de arquitectura del proyecto, junto con su análisis y justificación. Este documento será el entregable principal junto con el repositorio. Puede ser accedido por medio de una conexión MCP con Microsoft 365 buscando un archivo con el titulo de "Cloudshop - ASD".

### Instrucciones generales para manejar este proyecto
- El flujo de trabajo asistido por IA para este proyecto es el siguiente:
  1. Se trabajará por medio de la metodología de SDD (Spec Driven Development), donde es crucial siempre documentar y exponer el contexto para tareas compartidas por varios agentes de IA. Por lo tanto, antes de producir cualquier cambio, se crea un Spec plan sencillo y luego se le solicita a los agentes de IA tomar el contexto correspondiente, crear un plan de implementación, validarlo con el usuario y ejecutarlo (generalmente, la planificación será realizada por modelos más potentes y la implementación por modelos más pequeños o especializados).
  2. Al finalizar cada implementación, se deberá de crear un archivo walkthrough.md para cada tarea realizada que le permita al usuario conocer el flujo que debe de seguir para validar que todo está correcto e un informe conciso de los cambios realizados y demás que sea de interés por parte del usuario para evitar comportamientos de caja negra y que el usuario pierda conciencia de lo que está ocurriendo en el desarrollo de los agentes. Debe estar actualizado a la última versión de la aplicación.
  3. Como principio fundamental para este proyecto, el contexto de la toma de decisiones y análisis debe de estar siempre expuesto a todos en el proyecto para minimizar confuciones y dejar claros aspectos cómo reglas de negocio, alcance, asignación de responsabildiades, etc.
- Ningún agente de IA tiene permiso explícito de realizar comandos en terminal de terraform que apliquen modificaciones en AWS (apply/destroy) sin autorización previa del usuario. Si lo necesita, deberá de aclarar con mucho énfasis las consecuencias de utilizar el comando solicitado para que el usuario tome una decisión informada.
- Para validar cambios con todo el equipo, se deberpa de hacer uso de GitHub Actions con un IAM específico para desplegar la versión más reciente del proyecto. Actualmente, no existe dicha configuración, por lo que se espera que el agente que tenga la tarea de implementar esta funcionalidad se encargue de crear dicha configuración.

<!-- TODO: GitHub actions + IAM para validación y despliegue -->
