aws_region     = "us-east-1"
project_name   = "cloudshop"
environment    = "dev"
api_stage_name = "dev"

ses_source_email = "20245387+cloudshop@esen.edu.sv"

# Determinístico: policy "CloudShopWorkloadBoundary", path "/cicd/",
# cuenta 636017850255 (infraestructure/cicd/, ya aplicado). Ver su
# output workload_boundary_arn para confirmar.
workload_boundary_arn = "arn:aws:iam::511949652182:policy/cicd/CloudShopWorkloadBoundary"
