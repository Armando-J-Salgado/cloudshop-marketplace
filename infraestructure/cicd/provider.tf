provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = "CloudShop"
      ManagedBy = "Terraform"
      Module    = "cicd"
    }
  }
}
