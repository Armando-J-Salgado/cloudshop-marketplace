variable "project_name" {
  description = "Prefijo de nombres de recursos."
  type        = string
}

variable "aws_region" {
  type = string
}

variable "lambda_function_names" {
  description = "function_name por clave lógica (output function_names del módulo lambdas). Una alarma de Errors por función."
  type        = map(string)
}

variable "api_gateway_name" {
  type = string
}

variable "api_gateway_stage_name" {
  type = string
}
