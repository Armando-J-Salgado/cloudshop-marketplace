aws_region     = "us-east-1"
project_name   = "cloudshop-armando"
environment    = "dev-armando"
api_stage_name = "dev-armando"

ses_source_email = "20245138cloudshop@esen.edu.sv"

# Determinístico: policy "CloudShopWorkloadBoundary", path "/cicd/",
# cuenta 636017850255 (infraestructure/cicd/, ya aplicado). Ver su
# output workload_boundary_arn para confirmar.
# workload_boundary_arn = "arn:aws:iam::636017850255:policy/cicd/CloudShopWorkloadBoundary"
