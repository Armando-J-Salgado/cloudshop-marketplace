output "github_actions_user_name" {
  description = "Usuario IAM para el que hay que crear la Access Key en la consola (ver README.md)."
  value       = aws_iam_user.github_actions.name
}

output "github_actions_user_arn" {
  value = aws_iam_user.github_actions.arn
}

output "workload_boundary_arn" {
  description = "ARN del permissions boundary que debe adjuntarse a cualquier rol de ejecución de Lambda creado en el paso 2 del roadmap."
  value       = aws_iam_policy.workload_boundary.arn
}
