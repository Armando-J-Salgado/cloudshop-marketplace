variable "project_name" {
  description = "Prefijo de nombres de recursos."
  type        = string
}

variable "bucket_id" {
  type = string
}

variable "bucket_arn" {
  type = string
}

variable "bucket_regional_domain_name" {
  type = string
}

variable "waf_web_acl_arn" {
  description = "ARN del Web ACL de WAFv2 scope CLOUDFRONT (output cloudfront_web_acl_arn del módulo waf)."
  type        = string
}
