resource "aws_cognito_user_pool" "users" {
  name = "${var.project_name}-users"

  username_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = true
  }

  mfa_configuration = "OFF"

  auto_verified_attributes = ["email"]

  schema {
    name                = "role"
    attribute_data_type = "String"
    required            = false
    mutable             = true
  }

  schema {
    name                = "status"
    attribute_data_type = "String"
    required            = false
    mutable             = true
  }

  lifecycle {
    ignore_changes = [schema]
  }
}

resource "aws_cognito_user_pool_client" "web" {
  name         = "${var.project_name}-web"
  user_pool_id = aws_cognito_user_pool.users.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]
}

# Roles del §5 del documento del proyecto y del claim cognito:groups que
# el backend evalúa ("admin" in user_groups or "operator" in user_groups
# en orders/* y products/*). Los nombres deben coincidir exactamente.
resource "aws_cognito_user_group" "admin" {
  name         = "admin"
  user_pool_id = aws_cognito_user_pool.users.id
  description  = "Administrador: gestiona usuarios, tiendas, productos y consulta reportes."
}

resource "aws_cognito_user_group" "operator" {
  name         = "operator"
  user_pool_id = aws_cognito_user_pool.users.id
  description  = "Operador: gestiona inventario y pedidos."
}

resource "aws_cognito_user_group" "cliente" {
  name         = "cliente"
  user_pool_id = aws_cognito_user_pool.users.id
  description  = "Cliente: compra productos y consulta sus propios pedidos."
}
