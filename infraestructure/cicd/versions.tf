terraform {
  required_version = "~> 1.9"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.70"
    }
  }

  # Root module independiente, apply manual único (ver README.md).
  # No usa backend remoto: se toca 2-3 veces en todo el proyecto y su estado
  # local es aceptable. Si se pierde, se recupera con `terraform import`
  # (comandos documentados en README.md).
}
