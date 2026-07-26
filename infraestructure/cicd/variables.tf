variable "aws_region" {
  description = "Región AWS donde vive el proyecto."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefijo de nombres de recursos que el pipeline puede tocar (S3, DynamoDB, Lambda, etc.)."
  type        = string
  default     = "cloudshop"
}
