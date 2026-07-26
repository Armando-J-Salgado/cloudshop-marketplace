variable "project_name" {
  description = "Prefijo de nombres de recursos."
  type        = string
}

variable "api_gateway_stage_arn" {
  description = "ARN del stage de API Gateway (output stage_arn del módulo api-gateway), para la asociación REGIONAL."
  type        = string
}
