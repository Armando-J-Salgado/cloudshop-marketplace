output "api_url" {
  value = module.api_gateway.invoke_url
}

output "user_pool_id" {
  value = module.cognito.user_pool_id
}

output "app_client_id" {
  value = module.cognito.client_id
}

output "frontend_url" {
  value = "https://${module.cloudfront.domain_name}"
}

output "cloudfront_domain" {
  value = module.cloudfront.domain_name
}

output "frontend_bucket_name" {
  value = module.s3.bucket_id
}

output "event_bus_name" {
  value = local.event_bus_name
}

output "dynamodb_tables" {
  value = module.dynamodb.table_names
}

output "dashboard_name" {
  value = module.cloudwatch.dashboard_name
}
