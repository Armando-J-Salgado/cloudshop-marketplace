locals {
  # Los .id de aws_api_gateway_resource no se conocen hasta el apply, así
  # que no pueden vivir dentro de un valor usado como for_each (Terraform
  # exige claves conocidas en plan). Por eso las rutas solo guardan
  # `resource_key` (string estático) y se resuelven contra este mapa en el
  # momento de usarlas, no en la clave del for_each.
  resource_map = {
    registrations        = aws_api_gateway_resource.registrations
    users                = aws_api_gateway_resource.users
    users_id             = aws_api_gateway_resource.users_id
    carts                = aws_api_gateway_resource.carts
    carts_id             = aws_api_gateway_resource.carts_id
    carts_id_products    = aws_api_gateway_resource.carts_id_products
    carts_id_products_id = aws_api_gateway_resource.carts_id_products_id
    products             = aws_api_gateway_resource.products
    products_id          = aws_api_gateway_resource.products_id
    stores               = aws_api_gateway_resource.stores
    stores_id            = aws_api_gateway_resource.stores_id
    orders               = aws_api_gateway_resource.orders
    orders_id            = aws_api_gateway_resource.orders_id
    dashboard            = aws_api_gateway_resource.dashboard
    audit                = aws_api_gateway_resource.audit
  }

  # Una entrada por ruta del diagrama. `auth = "NONE"` solo en el registro
  # público; todo lo demás exige el authorizer Cognito.
  routes = {
    register = {
      resource_key = "registrations"
      method       = "POST"
      lambda_key   = "users_register"
      auth         = "NONE"
    }
    users_list = {
      resource_key = "users"
      method       = "GET"
      lambda_key   = "users_list"
      auth         = "COGNITO_USER_POOLS"
    }
    users_update = {
      resource_key = "users_id"
      method       = "PATCH"
      lambda_key   = "users_update"
      auth         = "COGNITO_USER_POOLS"
    }
    users_delete = {
      resource_key = "users_id"
      method       = "DELETE"
      lambda_key   = "users_delete"
      auth         = "COGNITO_USER_POOLS"
    }

    carts_get = {
      resource_key = "carts_id"
      method       = "GET"
      lambda_key   = "carts_get"
      auth         = "COGNITO_USER_POOLS"
    }
    carts_clear = {
      resource_key = "carts_id"
      method       = "DELETE"
      lambda_key   = "carts_clear"
      auth         = "COGNITO_USER_POOLS"
    }
    carts_add_product = {
      resource_key = "carts_id_products_id"
      method       = "POST"
      lambda_key   = "carts_add_product"
      auth         = "COGNITO_USER_POOLS"
    }
    carts_modify_quantity = {
      resource_key = "carts_id_products_id"
      method       = "PATCH"
      lambda_key   = "carts_modify_quantity"
      auth         = "COGNITO_USER_POOLS"
    }
    carts_remove_product = {
      resource_key = "carts_id_products_id"
      method       = "DELETE"
      lambda_key   = "carts_remove_product"
      auth         = "COGNITO_USER_POOLS"
    }

    products_create = {
      resource_key = "products"
      method       = "POST"
      lambda_key   = "products_create"
      auth         = "COGNITO_USER_POOLS"
    }
    products_list = {
      resource_key = "products"
      method       = "GET"
      lambda_key   = "products_list"
      auth         = "COGNITO_USER_POOLS"
    }
    products_get = {
      resource_key = "products_id"
      method       = "GET"
      lambda_key   = "products_get"
      auth         = "COGNITO_USER_POOLS"
    }
    products_update = {
      resource_key = "products_id"
      method       = "PATCH"
      lambda_key   = "products_update"
      auth         = "COGNITO_USER_POOLS"
    }
    products_delete = {
      resource_key = "products_id"
      method       = "DELETE"
      lambda_key   = "products_delete"
      auth         = "COGNITO_USER_POOLS"
    }

    stores_create = {
      resource_key = "stores"
      method       = "POST"
      lambda_key   = "stores_create"
      auth         = "COGNITO_USER_POOLS"
    }
    stores_list = {
      resource_key = "stores"
      method       = "GET"
      lambda_key   = "stores_list"
      auth         = "COGNITO_USER_POOLS"
    }
    stores_get = {
      resource_key = "stores_id"
      method       = "GET"
      lambda_key   = "stores_get"
      auth         = "COGNITO_USER_POOLS"
    }
    stores_update = {
      resource_key = "stores_id"
      method       = "PATCH"
      lambda_key   = "stores_update"
      auth         = "COGNITO_USER_POOLS"
    }
    stores_delete = {
      resource_key = "stores_id"
      method       = "DELETE"
      lambda_key   = "stores_delete"
      auth         = "COGNITO_USER_POOLS"
    }

    orders_create = {
      resource_key = "orders"
      method       = "POST"
      lambda_key   = "orders_create"
      auth         = "COGNITO_USER_POOLS"
    }
    orders_list = {
      resource_key = "orders"
      method       = "GET"
      lambda_key   = "orders_list"
      auth         = "COGNITO_USER_POOLS"
    }
    orders_get = {
      resource_key = "orders_id"
      method       = "GET"
      lambda_key   = "orders_get"
      auth         = "COGNITO_USER_POOLS"
    }
    orders_update_status = {
      resource_key = "orders_id"
      method       = "PATCH"
      lambda_key   = "orders_update_status"
      auth         = "COGNITO_USER_POOLS"
    }
    orders_cancel = {
      resource_key = "orders_id"
      method       = "DELETE"
      lambda_key   = "orders_cancel"
      auth         = "COGNITO_USER_POOLS"
    }

    dashboard_get = {
      resource_key = "dashboard"
      method       = "GET"
      lambda_key   = "dashboard_get"
      auth         = "COGNITO_USER_POOLS"
    }

    audit_get = {
      resource_key = "audit"
      method       = "GET"
      lambda_key   = "audit_get"
      auth         = "COGNITO_USER_POOLS"
    }
  }

  # Solo rutas cuya Lambda ya tiene código (var.lambda_invoke_arns viene del
  # módulo lambdas, que filtra por fileexists() sobre el entry file real).
  # Así el plan no falla por una clave ausente si algún handler todavía no
  # existe. Los valores usados para filtrar (route.lambda_key, las claves
  # de var.lambda_invoke_arns) son literales/estructurales, conocidos en
  # plan aunque los ARN todavía no lo estén.
  active_routes = {
    for key, route in local.routes : key => route
    if contains(keys(var.lambda_invoke_arns), route.lambda_key)
  }

  # Strings estáticos (nunca .id de un recurso): válido como clave de
  # for_each incluso en el primer plan, antes de que API Gateway asigne IDs.
  cors_resource_keys = distinct([for route in local.active_routes : route.resource_key])
}

resource "aws_api_gateway_method" "route" {
  for_each = local.active_routes

  rest_api_id      = aws_api_gateway_rest_api.this.id
  resource_id      = local.resource_map[each.value.resource_key].id
  http_method      = each.value.method
  authorization    = each.value.auth
  authorizer_id    = each.value.auth == "COGNITO_USER_POOLS" ? aws_api_gateway_authorizer.cognito.id : null
  api_key_required = false
}

resource "aws_api_gateway_integration" "route" {
  for_each = local.active_routes

  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = local.resource_map[each.value.resource_key].id
  http_method             = aws_api_gateway_method.route[each.key].http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.lambda_invoke_arns[each.value.lambda_key]
}

resource "aws_lambda_permission" "route" {
  for_each = local.active_routes

  statement_id  = "AllowAPIGateway${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names[each.value.lambda_key]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

# CORS: las Lambdas ya devuelven Access-Control-Allow-Origin en sus
# respuestas, pero el preflight OPTIONS lo tiene que contestar API Gateway.
resource "aws_api_gateway_method" "options" {
  for_each = toset(local.cors_resource_keys)

  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = local.resource_map[each.value].id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options" {
  for_each = toset(local.cors_resource_keys)

  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = local.resource_map[each.value].id
  http_method = aws_api_gateway_method.options[each.key].http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "options" {
  for_each = toset(local.cors_resource_keys)

  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = local.resource_map[each.value].id
  http_method = aws_api_gateway_method.options[each.key].http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "options" {
  for_each = toset(local.cors_resource_keys)

  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = local.resource_map[each.value].id
  http_method = aws_api_gateway_method.options[each.key].http_method
  status_code = aws_api_gateway_method_response.options[each.key].status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,GET,POST,PATCH,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.options]
}
