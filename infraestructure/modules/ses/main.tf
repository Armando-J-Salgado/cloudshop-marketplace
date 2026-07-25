resource "aws_ses_email_identity" "source" {
  email = var.source_email
}

# TemplateData enviado por notifications/send-order-notification/handler.py:
# {order_id, customer_id, items, status, total} (snake_case, tal cual el
# código). Ver PENDIENTE.md: `items` solo llega si create_order lo agrega
# al Detail del evento (hoy no lo hace).
resource "aws_ses_template" "order" {
  name    = "${var.project_name}-order-template"
  subject = "CloudShop - Pedido {{order_id}}"
  html    = <<-HTML
    <html>
      <body>
        <h2>Confirmación de pedido</h2>
        <p>Pedido: <strong>{{order_id}}</strong></p>
        <p>Cliente: {{customer_id}}</p>
        <p>Estado: {{status}}</p>
        <ul>
          {{#each items}}
          <li>{{this.product_id}} x{{this.quantity}} - $${{this.price}}</li>
          {{/each}}
        </ul>
        <p>Total: $${{total}}</p>
      </body>
    </html>
  HTML
  text    = <<-TEXT
    Confirmación de pedido {{order_id}}
    Cliente: {{customer_id}}
    Estado: {{status}}
    Total: $${{total}}
  TEXT
}

# Nombres exactos que backend/lambdas/users/*/handler.py y
# backend/lambdas/notifications/send-order-notification/handler.py leen
# vía ssm.get_parameter(). Cambiarlos exige tocar backend/.
resource "aws_ssm_parameter" "cognito_user_pool_id" {
  name  = "/app/cognito/user-pool-id"
  type  = "String"
  value = var.user_pool_id
}

resource "aws_ssm_parameter" "ses_template_name" {
  name  = "/app/ses/order-template-name"
  type  = "String"
  value = aws_ses_template.order.name
}

resource "aws_ssm_parameter" "ses_source_email" {
  name  = "/app/ses/source-email"
  type  = "String"
  value = var.source_email
}
