variable "aws_region" {
  description = "Región AWS donde se despliega la plataforma."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefijo de nombres de recursos. Debe coincidir con el que acotan las políticas IAM de infraestructure/cicd/."
  type        = string
  default     = "cloudshop"
}

variable "environment" {
  description = "Entorno de despliegue (tag Environment)."
  type        = string
  default     = "dev"
}

variable "api_stage_name" {
  description = "Nombre del stage de API Gateway."
  type        = string
  default     = "dev"
}

variable "ses_source_email" {
  description = "Dirección de correo remitente verificada en SES para las notificaciones de pedidos."
  type        = string
}

variable "workload_boundary_arn" {
  description = "ARN del permissions boundary CloudShopWorkloadBoundary (output workload_boundary_arn de infraestructure/cicd/). Obligatorio en todo rol IAM de aplicación."
  type        = string
  default     = null
}

variable "api_key" {
  description = "API Key para el frontend (no usada actualmente, reservada para futuro)"
  type        = string
  sensitive   = true
  default     = ""
}
