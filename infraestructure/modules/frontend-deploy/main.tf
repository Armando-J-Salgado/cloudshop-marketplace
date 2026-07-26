# Genera el archivo .env.production con las variables para Vite
resource "local_file" "env_production" {
  filename = "${path.root}/${var.frontend_dir}/.env.production"

  content = <<EOF
VITE_API_URL=${var.api_url}
VITE_COGNITO_USER_POOL_ID=${var.user_pool_id}
VITE_COGNITO_CLIENT_ID=${var.client_id}
VITE_AWS_REGION=${var.region}
EOF

}

# Ejecuta el build del frontend
resource "null_resource" "frontend_build" {
  depends_on = [local_file.env_production]

  triggers = {
    env_hash = sha256(local_file.env_production.content)
  }

  provisioner "local-exec" {
    working_dir = "${path.root}/${var.frontend_dir}"
    command     = <<-EOT
      npm install
      npm run build
    EOT
  }
}

# Sube todos los archivos del dist al bucket S3
# Nota: El bucket usa OAC (Origin Access Control), por lo que no necesita ACLs publicas.
# CloudFront tiene permiso para leer los objetos via la bucket policy configurada en el modulo cloudfront.
resource "null_resource" "s3_sync" {
  depends_on = [null_resource.frontend_build]

  triggers = {
    build_timestamp = timestamp()
  }

  provisioner "local-exec" {
    working_dir = "${path.root}/${var.frontend_dir}"
    command     = <<-EOT
      aws s3 sync ./dist s3://${var.bucket_id} --delete
    EOT
  }
}

# Invalida el cache de CloudFront despues del deploy
resource "null_resource" "cloudfront_invalidation" {
  depends_on = [null_resource.s3_sync]

  triggers = {
    invalidation_trigger = null_resource.s3_sync.triggers.build_timestamp
  }

  provisioner "local-exec" {
    command = <<-EOT
      aws cloudfront create-invalidation --distribution-id ${var.cloudfront_distribution_id} --paths /*
    EOT
  }
}
