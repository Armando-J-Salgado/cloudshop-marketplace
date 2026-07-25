# cloudshop-marketplace

![Terraform CI/CD](https://github.com/Armando-J-Salgado/cloudshop-marketplace/actions/workflows/terraform.yml/badge.svg)

## Flujo de contribución

1. Crear una rama y abrir un PR contra `development` (o `main`).
2. El pipeline de GitHub Actions corre automáticamente `fmt`, `validate` y `plan`, y comenta el resultado del plan directamente en el PR.
3. Revisión del equipo antes de mergear. El `apply` a AWS queda gateado por el environment `aws-prod` y permanece deshabilitado hasta que exista backend remoto de Terraform (ver [docs/gh-actions-iam/walkthrough.md](docs/gh-actions-iam/walkthrough.md)).

