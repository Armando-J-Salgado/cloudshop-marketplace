variable "project_name" {
  description = "Prefijo de nombres de recursos."
  type        = string
}

variable "aws_region" {
  type = string
}

variable "workload_boundary_arn" {
  description = "ARN de CloudShopWorkloadBoundary (infraestructure/cicd/). Obligatorio en todo rol."
  type        = string
  default     = null
}

variable "table_arns" {
  description = "ARNs de las tablas DynamoDB, por nombre lógico."
  type        = map(string)
}

variable "event_bus_arn" {
  type = string
}

variable "user_pool_arn" {
  type = string
}
