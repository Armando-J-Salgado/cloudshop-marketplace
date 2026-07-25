output "function_arns" {
  description = "ARN por clave lógica, solo de las funciones cuyo código existe hoy."
  value       = { for k, v in aws_lambda_function.this : k => v.arn }
}

output "function_names" {
  value = { for k, v in aws_lambda_function.this : k => v.function_name }
}

output "invoke_arns" {
  value = { for k, v in aws_lambda_function.this : k => v.invoke_arn }
}

output "enabled_functions" {
  description = "Claves lógicas con código disponible. Usado por api-gateway/ para no declarar rutas de dominios sin Lambda."
  value       = keys(local.enabled_functions)
}
