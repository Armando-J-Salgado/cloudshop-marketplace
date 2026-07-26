variable "project_name" {
  description = "Prefijo de nombres de recursos."
  type        = string
}

variable "source_email" {
  description = "Dirección de correo remitente verificada en SES."
  type        = string
}

variable "user_pool_id" {
  description = "ID del user pool de Cognito, publicado en Parameter Store para que las Lambdas de users/ lo lean en runtime."
  type        = string
}
