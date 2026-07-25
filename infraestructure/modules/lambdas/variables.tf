variable "project_name" {
  description = "Prefijo de nombres de recursos."
  type        = string
}

variable "role_arns" {
  description = "ARNs de los roles IAM por dominio (output role_arns del módulo iam)."
  type        = map(string)
}

variable "table_names" {
  description = "Nombres de las tablas DynamoDB por entidad (output table_names del módulo dynamodb)."
  type        = map(string)
}

variable "event_bus_name" {
  description = "Nombre del event bus de EventBridge. String de convención, no un atributo de recurso: rompe la dependencia circular lambdas<->eventbridge."
  type        = string
}
