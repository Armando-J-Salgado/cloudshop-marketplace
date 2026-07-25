variable "project_name" {
  description = "Prefijo de nombres de recursos."
  type        = string
}

variable "api_stage_name" {
  type = string
}

variable "user_pool_arn" {
  description = "ARN del user pool de Cognito, para el authorizer COGNITO_USER_POOLS."
  type        = string
}

variable "lambda_invoke_arns" {
  description = "invoke_arn por clave lógica (output invoke_arns del módulo lambdas). Solo contiene claves de funciones que existen hoy."
  type        = map(string)
}

variable "lambda_function_names" {
  description = "function_name por clave lógica (output function_names del módulo lambdas)."
  type        = map(string)
}
