locals {
  # Mapa completo de funciones Lambda. `enabled_functions` decide si el
  # recurso se crea; se calcula con fileexists() sobre el entry file real,
  # así que cualquier Lambda futura sin código aún aparece sola en el
  # siguiente `plan` en cuanto exista su handler, sin que Terraform tenga
  # que escribir una línea de Python.
  functions = {
    # --- orders (5) ---
    orders_create = {
      source_dir = "${path.root}/backend/lambdas/orders/create_order"
      entry_file = "lambda_function.py"
      handler    = "lambda_function.lambda_handler"
      name       = "orders-create"
      role       = "orders"
      env = {
        ORDERS_TABLE_NAME   = var.table_names["orders"]
        PRODUCTS_TABLE_NAME = var.table_names["products"]
        CARTS_TABLE_NAME    = var.table_names["carts"]
        EVENT_BUS_NAME      = var.event_bus_name
      }
    }
    orders_list = {
      source_dir = "${path.root}/backend/lambdas/orders/get_orders"
      entry_file = "lambda_function.py"
      handler    = "lambda_function.lambda_handler"
      name       = "orders-list"
      role       = "orders"
      env = {
        ORDERS_TABLE_NAME = var.table_names["orders"]
      }
    }
    orders_get = {
      source_dir = "${path.root}/backend/lambdas/orders/get_order_by_id"
      entry_file = "lambda_function.py"
      handler    = "lambda_function.lambda_handler"
      name       = "orders-get"
      role       = "orders"
      env = {
        ORDERS_TABLE_NAME = var.table_names["orders"]
      }
    }
    orders_update_status = {
      source_dir = "${path.root}/backend/lambdas/orders/update_order_status"
      entry_file = "lambda_function.py"
      handler    = "lambda_function.lambda_handler"
      name       = "orders-update-status"
      role       = "orders"
      env = {
        ORDERS_TABLE_NAME = var.table_names["orders"]
        EVENT_BUS_NAME    = var.event_bus_name
      }
    }
    orders_cancel = {
      source_dir = "${path.root}/backend/lambdas/orders/cancel_order"
      entry_file = "lambda_function.py"
      handler    = "lambda_function.lambda_handler"
      name       = "orders-cancel"
      role       = "orders"
      env = {
        ORDERS_TABLE_NAME   = var.table_names["orders"]
        PRODUCTS_TABLE_NAME = var.table_names["products"]
        EVENT_BUS_NAME      = var.event_bus_name
      }
    }

    # --- carts (4) ---
    carts_add_product = {
      source_dir = "${path.root}/backend/lambdas/carts/add_product"
      entry_file = "lambda_function.py"
      handler    = "lambda_function.lambda_handler"
      name       = "carts-add-product"
      role       = "carts"
      env = {
        CARTS_TABLE_NAME = var.table_names["carts"]
      }
    }
    carts_modify_quantity = {
      source_dir = "${path.root}/backend/lambdas/carts/modify_quantity"
      entry_file = "lambda_function.py"
      handler    = "lambda_function.lambda_handler"
      name       = "carts-modify-quantity"
      role       = "carts"
      env = {
        CARTS_TABLE_NAME = var.table_names["carts"]
      }
    }
    carts_remove_product = {
      source_dir = "${path.root}/backend/lambdas/carts/remove_product"
      entry_file = "lambda_function.py"
      handler    = "lambda_function.lambda_handler"
      name       = "carts-remove-product"
      role       = "carts"
      env = {
        CARTS_TABLE_NAME = var.table_names["carts"]
      }
    }
    carts_clear = {
      source_dir = "${path.root}/backend/lambdas/carts/clear_cart"
      entry_file = "lambda_function.py"
      handler    = "lambda_function.lambda_handler"
      name       = "carts-clear"
      role       = "carts"
      env = {
        CARTS_TABLE_NAME = var.table_names["carts"]
      }
    }
    carts_get = {
      source_dir = "${path.root}/backend/lambdas/carts/get_cart"
      entry_file = "lambda_function.py"
      handler    = "lambda_function.lambda_handler"
      name       = "carts-get"
      role       = "carts"
      env = {
        CARTS_TABLE_NAME = var.table_names["carts"]
      }
    }

    # --- products (5) ---
    products_create = {
      source_dir = "${path.root}/backend/lambdas/products/create_product"
      entry_file = "lambda_function.py"
      handler    = "lambda_function.lambda_handler"
      name       = "products-create"
      role       = "products"
      env = {
        PRODUCTS_TABLE_NAME = var.table_names["products"]
      }
    }
    products_update = {
      source_dir = "${path.root}/backend/lambdas/products/update_product"
      entry_file = "lambda_function.py"
      handler    = "lambda_function.lambda_handler"
      name       = "products-update"
      role       = "products"
      env = {
        PRODUCTS_TABLE_NAME = var.table_names["products"]
      }
    }
    products_delete = {
      source_dir = "${path.root}/backend/lambdas/products/delete_product"
      entry_file = "lambda_function.py"
      handler    = "lambda_function.lambda_handler"
      name       = "products-delete"
      role       = "products"
      env = {
        PRODUCTS_TABLE_NAME = var.table_names["products"]
      }
    }
    products_list = {
      source_dir = "${path.root}/backend/lambdas/products/get_products"
      entry_file = "lambda_function.py"
      handler    = "lambda_function.lambda_handler"
      name       = "products-list"
      role       = "products"
      env = {
        PRODUCTS_TABLE_NAME = var.table_names["products"]
      }
    }
    products_get = {
      source_dir = "${path.root}/backend/lambdas/products/get_product_by_id"
      entry_file = "lambda_function.py"
      handler    = "lambda_function.lambda_handler"
      name       = "products-get"
      role       = "products"
      env = {
        PRODUCTS_TABLE_NAME = var.table_names["products"]
      }
    }

    # --- stores (5) ---
    stores_create = {
      source_dir = "${path.root}/backend/lambdas/stores/create_store"
      entry_file = "lambda_function.py"
      handler    = "lambda_function.lambda_handler"
      name       = "stores-create"
      role       = "stores"
      env = {
        STORES_TABLE_NAME = var.table_names["stores"]
      }
    }
    stores_update = {
      source_dir = "${path.root}/backend/lambdas/stores/update_store"
      entry_file = "lambda_function.py"
      handler    = "lambda_function.lambda_handler"
      name       = "stores-update"
      role       = "stores"
      env = {
        STORES_TABLE_NAME = var.table_names["stores"]
      }
    }
    stores_delete = {
      source_dir = "${path.root}/backend/lambdas/stores/delete_store"
      entry_file = "lambda_function.py"
      handler    = "lambda_function.lambda_handler"
      name       = "stores-delete"
      role       = "stores"
      env = {
        STORES_TABLE_NAME = var.table_names["stores"]
      }
    }
    stores_list = {
      source_dir = "${path.root}/backend/lambdas/stores/get_stores"
      entry_file = "lambda_function.py"
      handler    = "lambda_function.lambda_handler"
      name       = "stores-list"
      role       = "stores"
      env = {
        STORES_TABLE_NAME = var.table_names["stores"]
      }
    }
    stores_get = {
      source_dir = "${path.root}/backend/lambdas/stores/get_store_by_id"
      entry_file = "lambda_function.py"
      handler    = "lambda_function.lambda_handler"
      name       = "stores-get"
      role       = "stores"
      env = {
        STORES_TABLE_NAME = var.table_names["stores"]
      }
    }

    # --- users (4) ---
    users_register = {
      source_dir = "${path.root}/backend/lambdas/users/register-user"
      entry_file = "handler.py"
      handler    = "handler.lambda_handler"
      name       = "users-register"
      role       = "users"
      env        = {}
    }
    users_list = {
      source_dir = "${path.root}/backend/lambdas/users/get-users"
      entry_file = "handler.py"
      handler    = "handler.lambda_handler"
      name       = "users-list"
      role       = "users"
      env        = {}
    }
    users_update = {
      source_dir = "${path.root}/backend/lambdas/users/update-user"
      entry_file = "handler.py"
      handler    = "handler.lambda_handler"
      name       = "users-update"
      role       = "users"
      env        = {}
    }
    users_delete = {
      source_dir = "${path.root}/backend/lambdas/users/delete-user"
      entry_file = "handler.py"
      handler    = "handler.lambda_handler"
      name       = "users-delete"
      role       = "users"
      env        = {}
    }

    # --- events (1, consumidor de EventBridge) ---
    events_audit = {
      source_dir = "${path.root}/backend/lambdas/events/audit_handler"
      entry_file = "lambda_function.py"
      handler    = "lambda_function.lambda_handler"
      name       = "events-audit"
      role       = "audit"
      env = {
        AUDIT_TABLE_NAME = var.table_names["audit"]
      }
    }

    # --- notifications (1, consumidor de EventBridge + SES) ---
    notifications_send_order = {
      source_dir = "${path.root}/backend/lambdas/notifications/send-order-notification"
      entry_file = "handler.py"
      handler    = "handler.lambda_handler"
      name       = "notifications-send-order"
      role       = "notifications"
      env        = {}
    }

    # --- dashboard (1) ---
    dashboard_get = {
      source_dir = "${path.root}/backend/lambdas/dashboard/get_dashboard"
      entry_file = "lambda_function.py"
      handler    = "lambda_function.lambda_handler"
      name       = "dashboard-get"
      role       = "dashboard"
      env = {
        ORDERS_TABLE_NAME   = var.table_names["orders"]
        PRODUCTS_TABLE_NAME = var.table_names["products"]
      }
    }

    # --- audit (1, lectura para el panel de auditoria del admin) ---
    audit_get = {
      source_dir = "${path.root}/backend/lambdas/audit/get_audit_logs"
      entry_file = "lambda_function.py"
      handler    = "lambda_function.lambda_handler"
      name       = "audit-get"
      role       = "audit"
      env = {
        AUDIT_TABLE_NAME = var.table_names["audit"]
      }
    }
  }

  enabled_functions = {
    for key, fn in local.functions : key => fn
    if fileexists("${fn.source_dir}/${fn.entry_file}")
  }
}

data "archive_file" "this" {
  for_each = local.enabled_functions

  type        = "zip"
  source_dir  = each.value.source_dir
  output_path = "${path.root}/.terraform-build/${each.key}.zip"
}

resource "aws_cloudwatch_log_group" "this" {
  for_each = local.enabled_functions

  name              = "/aws/lambda/${var.project_name}-${each.value.name}"
  retention_in_days = 14
}

resource "aws_lambda_function" "this" {
  for_each = local.enabled_functions

  function_name    = "${var.project_name}-${each.value.name}"
  filename         = data.archive_file.this[each.key].output_path
  source_code_hash = data.archive_file.this[each.key].output_base64sha256
  runtime          = "python3.12"
  handler          = each.value.handler
  role             = var.role_arns[each.value.role]
  timeout          = 10
  memory_size      = 128

  environment {
    variables = each.value.env
  }

  depends_on = [aws_cloudwatch_log_group.this]
}
