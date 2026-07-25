aws_region     = "us-east-1"
project_name   = "cloudshop"
environment    = "dev"
api_stage_name = "dev"

# TODO(PENDIENTE.md): reemplazar por un remitente real, verificado en SES,
# antes del primer `terraform apply`. Placeholder para que `validate`/`plan`
# corran sin credenciales de correo reales.
ses_source_email = "notifications@cloudshop.example"

# Determinístico: policy "CloudShopWorkloadBoundary", path "/cicd/",
# cuenta 636017850255 (infraestructure/cicd/, ya aplicado). Ver su
# output workload_boundary_arn para confirmar.
workload_boundary_arn = "arn:aws:iam::636017850255:policy/cicd/CloudShopWorkloadBoundary"
