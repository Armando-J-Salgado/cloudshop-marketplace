resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project_name}-frontend-${random_string.suffix.result}"
}

# Block Public Access activo por defecto: §3 de Diseno_Seguridad_CloudShop.md
# exige esto explícitamente, a diferencia del Lab 8 (bucket público con
# website hosting). El acceso lo da la bucket policy de CloudFront (OAC),
# creada en el módulo cloudfront/ para evitar una dependencia circular.
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
