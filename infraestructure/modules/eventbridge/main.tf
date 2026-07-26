resource "aws_cloudwatch_event_bus" "this" {
  name = var.bus_name
}

resource "aws_cloudwatch_event_rule" "order_created" {
  name           = "${var.project_name}-order-created"
  event_bus_name = aws_cloudwatch_event_bus.this.name
  event_pattern = jsonencode({
    source      = ["cloudshop.orders"]
    detail-type = ["OrderCreated"]
  })
}

resource "aws_cloudwatch_event_rule" "order_status_changed" {
  name           = "${var.project_name}-order-status-changed"
  event_bus_name = aws_cloudwatch_event_bus.this.name
  event_pattern = jsonencode({
    source      = ["cloudshop.orders"]
    detail-type = ["OrderStatusChanged"]
  })
}

resource "aws_cloudwatch_event_rule" "order_cancelled" {
  name           = "${var.project_name}-order-cancelled"
  event_bus_name = aws_cloudwatch_event_bus.this.name
  event_pattern = jsonencode({
    source      = ["cloudshop.orders"]
    detail-type = ["OrderCancelled"]
  })
}

locals {
  rules = {
    order_created        = aws_cloudwatch_event_rule.order_created
    order_status_changed = aws_cloudwatch_event_rule.order_status_changed
    order_cancelled      = aws_cloudwatch_event_rule.order_cancelled
  }
}

# Auditoría: las 3 reglas, evento nativo sin transformar (audit_handler lee
# event["detail-type"] / event["detail"] directamente).
resource "aws_cloudwatch_event_target" "audit" {
  for_each = local.rules

  rule           = each.value.name
  event_bus_name = aws_cloudwatch_event_bus.this.name
  target_id      = "audit"
  arn            = var.lambda_function_arns["events_audit"]
}

resource "aws_lambda_permission" "audit" {
  for_each = local.rules

  statement_id  = "AllowEventBridge${each.key}Audit"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["events_audit"]
  principal     = "events.amazonaws.com"
  source_arn    = each.value.arn
}

# Notificaciones: solo OrderCreated. input_transformer traduce el Detail
# PascalCase a un envoltorio {"body": "<json snake_case>"} porque
# send-order-notification/handler.py tiene forma de integración HTTP
# (json.loads(event["body"])), no de consumidor de evento nativo.
#
# create_order incluye "Items" en el Detail (ver
# backend/lambdas/orders/create_order/lambda_function.py); se mapea aquí a
# "items" para que send-order-notification reciba el array no vacío que
# valida en validate_order_data().
resource "aws_cloudwatch_event_target" "notifications_order_created" {
  rule           = aws_cloudwatch_event_rule.order_created.name
  event_bus_name = aws_cloudwatch_event_bus.this.name
  target_id      = "notifications"
  arn            = var.lambda_function_arns["notifications_send_order"]

  input_transformer {
    input_paths = {
      order_id       = "$.detail.OrderId"
      customer_id    = "$.detail.CustomerId"
      customer_email = "$.detail.Email"
      items          = "$.detail.Items"
      status         = "$.detail.Status"
      total          = "$.detail.Total"
    }
    input_template = <<-EOF
      {
        "body": "{\"order_id\": \"<order_id>\", \"customer_id\": \"<customer_id>\", \"customer_email\": \"<customer_email>\", \"items\": <items>, \"status\": \"<status>\", \"total\": <total>}"
      }
    EOF
  }
}

resource "aws_lambda_permission" "notifications_order_created" {
  statement_id  = "AllowEventBridgeOrderCreatedNotifications"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["notifications_send_order"]
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.order_created.arn
}
