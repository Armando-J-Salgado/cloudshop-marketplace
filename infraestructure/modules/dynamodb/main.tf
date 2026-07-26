# Claves alineadas al código ya mergeado en backend/lambdas/ (no al
# diagrama de BD original, que difiere en Carts y Orders — ver spec.md).

resource "aws_dynamodb_table" "carts" {
  name         = "${var.project_name}-carts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "ClientId"

  attribute {
    name = "ClientId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}

resource "aws_dynamodb_table" "products" {
  name         = "${var.project_name}-products"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "StoreId"
  range_key    = "ProductId"

  attribute {
    name = "StoreId"
    type = "S"
  }

  attribute {
    name = "ProductId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}

resource "aws_dynamodb_table" "orders" {
  name         = "${var.project_name}-orders"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "CustomerId"
  range_key    = "OrderId"

  attribute {
    name = "CustomerId"
    type = "S"
  }

  attribute {
    name = "OrderId"
    type = "S"
  }

  attribute {
    name = "StoreId"
    type = "S"
  }

  # get_orders filtra hoy por tienda con scan + FilterExpression. El GSI
  # deja el camino listo para migrar a query cuando el backend lo adopte;
  # el scan actual sigue funcionando mientras tanto.
  global_secondary_index {
    name            = "StoreIdIndex"
    hash_key        = "StoreId"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}

resource "aws_dynamodb_table" "stores" {
  name         = "${var.project_name}-stores"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "StoreId"

  attribute {
    name = "StoreId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}

resource "aws_dynamodb_table" "audit" {
  name         = "${var.project_name}-audit"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "UserId"
  range_key    = "Timestamp"

  attribute {
    name = "UserId"
    type = "S"
  }

  attribute {
    name = "Timestamp"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}
