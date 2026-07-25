output "rest_api_id" {
  value = aws_api_gateway_rest_api.this.id
}

output "execution_arn" {
  value = aws_api_gateway_rest_api.this.execution_arn
}

output "stage_name" {
  value = aws_api_gateway_stage.this.stage_name
}

output "invoke_url" {
  value = aws_api_gateway_stage.this.invoke_url
}

output "stage_arn" {
  description = "ARN del stage, para asociar el WAF REGIONAL (aws_wafv2_web_acl_association)."
  value       = aws_api_gateway_stage.this.arn
}
