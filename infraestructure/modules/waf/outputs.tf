output "regional_web_acl_arn" {
  value = aws_wafv2_web_acl.api.arn
}

output "cloudfront_web_acl_arn" {
  value = aws_wafv2_web_acl.cdn.arn
}
