data "aws_caller_identity" "current" {}

locals {
  account = data.aws_caller_identity.current.account_id
}

# Usuario dedicado al pipeline, como en el Laboratorio 10 (Parte 4.1).
# path /cicd/ para que el Allow sobre user/cloudshop/* y role/cloudshop/*
# de la política IAM (policies.tf) nunca alcance a este usuario.
#
# La Access Key NO se crea aquí: un aws_iam_access_key dejaría el secreto en
# texto plano dentro del terraform.tfstate. Se crea a mano en la consola
# (ver README.md), igual que en el Laboratorio 10.
resource "aws_iam_user" "github_actions" {
  name = "github-actions"
  path = "/cicd/"

  tags = {
    Purpose = "CI/CD pipeline - GitHub Actions"
  }
}

# Superficie de LECTURA para el refresh de `terraform plan`.
# Compromiso deliberado: es amplio pero no puede mutar nada, y enumerar los
# ~120 Describe*/Get*/List* de 10 servicios sería frágil de mantener.
resource "aws_iam_user_policy_attachment" "readonly" {
  user       = aws_iam_user.github_actions.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

resource "aws_iam_user_policy_attachment" "compute" {
  user       = aws_iam_user.github_actions.name
  policy_arn = aws_iam_policy.compute.arn
}

resource "aws_iam_user_policy_attachment" "data_edge" {
  user       = aws_iam_user.github_actions.name
  policy_arn = aws_iam_policy.data_edge.arn
}

resource "aws_iam_user_policy_attachment" "iam" {
  user       = aws_iam_user.github_actions.name
  policy_arn = aws_iam_policy.iam.arn
}
