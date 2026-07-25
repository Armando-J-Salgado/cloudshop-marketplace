output "role_arns" {
  value = { for k, v in local.roles : k => v.arn }
}
