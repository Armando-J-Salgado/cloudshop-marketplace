variable "project_name" {
  description = "Prefijo de nombres de recursos."
  type        = string
}

variable "frontend_dir" {
  description = "Directorio del frontend relativo a la raiz del proyecto"
  type        = string
  default     = "frontend"
}

variable "api_url" {
  description = "URL de la API Gateway para el frontend"
  type        = string
}

variable "user_pool_id" {
  description = "ID del User Pool de Cognito"
  type        = string
}

variable "client_id" {
  description = "Client ID de Cognito"
  type        = string
}

variable "region" {
  description = "Region de AWS"
  type        = string
  default     = "us-east-1"
}

variable "api_key" {
  description = "API Key para el frontend (no usada actualmente, reservada para futuro)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "bucket_id" {
  description = "ID del bucket S3 del frontend"
  type        = string
}

variable "cloudfront_distribution_id" {
  description = "ID de la distribucion CloudFront"
  type        = string
}
