data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

# Un rol por dominio, todos bajo /cloudshop/ y con el permissions boundary
# obligatorio que exige infraestructure/cicd/policies.tf. La política
# CrearRolesConBoundaryObligatorio del pipeline rechaza cualquier rol de
# este path que no lleve exactamente ese boundary.

resource "aws_iam_role" "orders" {
  name                 = "${var.project_name}-lambda-orders"
  path                 = "/cloudshop/"
  assume_role_policy   = data.aws_iam_policy_document.lambda_assume_role.json
  permissions_boundary = var.workload_boundary_arn
}

resource "aws_iam_role" "carts" {
  name                 = "${var.project_name}-lambda-carts"
  path                 = "/cloudshop/"
  assume_role_policy   = data.aws_iam_policy_document.lambda_assume_role.json
  permissions_boundary = var.workload_boundary_arn
}

resource "aws_iam_role" "products" {
  name                 = "${var.project_name}-lambda-products"
  path                 = "/cloudshop/"
  assume_role_policy   = data.aws_iam_policy_document.lambda_assume_role.json
  permissions_boundary = var.workload_boundary_arn
}

resource "aws_iam_role" "stores" {
  name                 = "${var.project_name}-lambda-stores"
  path                 = "/cloudshop/"
  assume_role_policy   = data.aws_iam_policy_document.lambda_assume_role.json
  permissions_boundary = var.workload_boundary_arn
}

resource "aws_iam_role" "users" {
  name                 = "${var.project_name}-lambda-users"
  path                 = "/cloudshop/"
  assume_role_policy   = data.aws_iam_policy_document.lambda_assume_role.json
  permissions_boundary = var.workload_boundary_arn
}

resource "aws_iam_role" "audit" {
  name                 = "${var.project_name}-lambda-audit"
  path                 = "/cloudshop/"
  assume_role_policy   = data.aws_iam_policy_document.lambda_assume_role.json
  permissions_boundary = var.workload_boundary_arn
}

resource "aws_iam_role" "notifications" {
  name                 = "${var.project_name}-lambda-notifications"
  path                 = "/cloudshop/"
  assume_role_policy   = data.aws_iam_policy_document.lambda_assume_role.json
  permissions_boundary = var.workload_boundary_arn
}

resource "aws_iam_role" "dashboard" {
  name                 = "${var.project_name}-lambda-dashboard"
  path                 = "/cloudshop/"
  assume_role_policy   = data.aws_iam_policy_document.lambda_assume_role.json
  permissions_boundary = var.workload_boundary_arn
}

# Logs, igual para las 8: CreateLogGroup/CreateLogStream/PutLogEvents ya
# están dentro del boundary (ver infraestructure/cicd/policies.tf).
resource "aws_iam_role_policy_attachment" "logs" {
  for_each = local.roles

  role       = each.value.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

locals {
  roles = {
    orders        = aws_iam_role.orders
    carts         = aws_iam_role.carts
    products      = aws_iam_role.products
    stores        = aws_iam_role.stores
    users         = aws_iam_role.users
    audit         = aws_iam_role.audit
    notifications = aws_iam_role.notifications
    dashboard     = aws_iam_role.dashboard
  }
}

# --- orders: RW sobre orders/products/carts + su GSI, PutEvents ---
resource "aws_iam_role_policy" "orders" {
  name = "${var.project_name}-orders-policy"
  role = aws_iam_role.orders.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem",
          "dynamodb:DeleteItem", "dynamodb:Query", "dynamodb:Scan",
        ]
        Resource = [
          var.table_arns["orders"], "${var.table_arns["orders"]}/index/*",
          var.table_arns["products"],
          var.table_arns["carts"],
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["events:PutEvents"]
        Resource = [var.event_bus_arn]
      },
    ]
  })
}

# --- carts: RW sobre carts + SSM (eventbus name, para event_emitter.py) ---
resource "aws_iam_role_policy" "carts" {
  name = "${var.project_name}-carts-policy"
  role = aws_iam_role.carts.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem",
        ]
        Resource = [var.table_arns["carts"]]
      },
      {
        Effect   = "Allow"
        Action   = ["ssm:GetParameter"]
        Resource = ["arn:aws:ssm:${var.aws_region}:*:parameter/cloudshop/eventbus/name"]
      },
    ]
  })
}

# --- products: RW sobre products + SSM (eventbus name, para event_emitter.py) ---
resource "aws_iam_role_policy" "products" {
  name = "${var.project_name}-products-policy"
  role = aws_iam_role.products.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem",
          "dynamodb:DeleteItem", "dynamodb:Query", "dynamodb:Scan",
        ]
        Resource = [var.table_arns["products"]]
      },
      {
        Effect   = "Allow"
        Action   = ["ssm:GetParameter"]
        Resource = ["arn:aws:ssm:${var.aws_region}:*:parameter/cloudshop/eventbus/name"]
      },
    ]
  })
}

# --- stores: RW sobre stores + SSM (eventbus name, para event_emitter.py) ---
resource "aws_iam_role_policy" "stores" {
  name = "${var.project_name}-stores-policy"
  role = aws_iam_role.stores.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem",
          "dynamodb:DeleteItem", "dynamodb:Query", "dynamodb:Scan",
        ]
        Resource = [var.table_arns["stores"]]
      },
      {
        Effect   = "Allow"
        Action   = ["ssm:GetParameter"]
        Resource = ["arn:aws:ssm:${var.aws_region}:*:parameter/cloudshop/eventbus/name"]
      },
    ]
  })
}

# --- users: SSM (user-pool-id + eventbus name) + administración Cognito ---
resource "aws_iam_role_policy" "users" {
  name = "${var.project_name}-users-policy"
  role = aws_iam_role.users.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ssm:GetParameter", "ssm:GetParameters"]
        Resource = ["arn:aws:ssm:${var.aws_region}:*:parameter/app/cognito/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["ssm:GetParameter"]
        Resource = ["arn:aws:ssm:${var.aws_region}:*:parameter/cloudshop/eventbus/name"]
      },
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:AdminCreateUser", "cognito-idp:AdminGetUser",
          "cognito-idp:AdminUpdateUserAttributes", "cognito-idp:AdminSetUserPassword",
          "cognito-idp:AdminDisableUser", "cognito-idp:AdminDeleteUser",
          "cognito-idp:AdminAddUserToGroup", "cognito-idp:ListUsers",
        ]
        Resource = [var.user_pool_arn]
      },
    ]
  })
}

# --- audit: solo escritura en audit (consumidor de EventBridge) ---
resource "aws_iam_role_policy" "audit" {
  name = "${var.project_name}-audit-policy"
  role = aws_iam_role.audit.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:PutItem"]
        Resource = [var.table_arns["audit"]]
      },
    ]
  })
}

# --- notifications: SSM (ses/*) + SendTemplatedEmail ---
resource "aws_iam_role_policy" "notifications" {
  name = "${var.project_name}-notifications-policy"
  role = aws_iam_role.notifications.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ssm:GetParameter", "ssm:GetParameters"]
        Resource = ["arn:aws:ssm:${var.aws_region}:*:parameter/app/ses/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["ses:SendTemplatedEmail"]
        Resource = ["*"]
      },
    ]
  })
}

# --- dashboard: solo lectura sobre orders/products ---
resource "aws_iam_role_policy" "dashboard" {
  name = "${var.project_name}-dashboard-policy"
  role = aws_iam_role.dashboard.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["dynamodb:GetItem", "dynamodb:Query", "dynamodb:Scan"]
        Resource = [
          var.table_arns["orders"], "${var.table_arns["orders"]}/index/*",
          var.table_arns["products"],
        ]
      },
    ]
  })
}
