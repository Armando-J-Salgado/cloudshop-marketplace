# ---------------------------------------------------------------------------
# github-actions-compute: Lambda, API Gateway, EventBridge, CloudWatch
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "compute" {
  statement {
    sid    = "LambdaFuncionesDelProyecto"
    effect = "Allow"
    actions = [
      "lambda:CreateFunction", "lambda:DeleteFunction", "lambda:UpdateFunctionCode",
      "lambda:UpdateFunctionConfiguration", "lambda:GetFunction", "lambda:GetFunctionConfiguration",
      "lambda:ListVersionsByFunction", "lambda:PublishVersion", "lambda:CreateAlias",
      "lambda:UpdateAlias", "lambda:DeleteAlias", "lambda:GetAlias",
      "lambda:AddPermission", "lambda:RemovePermission", "lambda:GetPolicy",
      "lambda:TagResource", "lambda:UntagResource", "lambda:ListTags",
      "lambda:PutFunctionConcurrency", "lambda:DeleteFunctionConcurrency",
    ]
    resources = ["arn:aws:lambda:${var.aws_region}:${local.account}:function:${var.project_name}-*"]
  }

  statement {
    sid    = "ApiGatewayDelProyecto"
    effect = "Allow"
    actions = [
      "apigateway:GET", "apigateway:POST", "apigateway:PUT",
      "apigateway:PATCH", "apigateway:DELETE",
    ]
    # API Gateway no soporta ARNs con nombre de proyecto en la creación
    # (los IDs de API se generan después de crearla). Se acota por acción.
    resources = ["arn:aws:apigateway:${var.aws_region}::*"]
  }

  statement {
    sid    = "EventBridgeDelProyecto"
    effect = "Allow"
    actions = [
      "events:PutRule", "events:DeleteRule", "events:DescribeRule",
      "events:PutTargets", "events:RemoveTargets", "events:ListTargetsByRule",
      "events:TagResource", "events:UntagResource",
      "events:CreateEventBus", "events:DeleteEventBus", "events:DescribeEventBus",
    ]
    resources = [
      "arn:aws:events:${var.aws_region}:${local.account}:rule/${var.project_name}-*",
      "arn:aws:events:${var.aws_region}:${local.account}:event-bus/${var.project_name}-*",
    ]
  }

  statement {
    sid    = "CloudWatchLogsYAlarmasDelProyecto"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup", "logs:DeleteLogGroup", "logs:PutRetentionPolicy",
      "logs:TagResource", "logs:UntagResource", "logs:TagLogGroup",
      "cloudwatch:PutMetricAlarm", "cloudwatch:DeleteAlarms", "cloudwatch:DescribeAlarms",
      "cloudwatch:PutDashboard", "cloudwatch:DeleteDashboards", "cloudwatch:GetDashboard",
      "cloudwatch:TagResource", "cloudwatch:UntagResource",
    ]
    resources = [
      "arn:aws:logs:${var.aws_region}:${local.account}:log-group:/aws/lambda/${var.project_name}-*",
      "arn:aws:cloudwatch:${var.aws_region}:${local.account}:alarm:${var.project_name}-*",
      "arn:aws:cloudwatch::${local.account}:dashboard/${var.project_name}-*",
    ]
  }
}

resource "aws_iam_policy" "compute" {
  name   = "github-actions-compute"
  path   = "/cicd/"
  policy = data.aws_iam_policy_document.compute.json
}

# ---------------------------------------------------------------------------
# github-actions-data-edge: DynamoDB, S3, CloudFront, WAFv2, SES, Cognito
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "data_edge" {
  statement {
    sid    = "S3FrontendYArtefactos"
    effect = "Allow"
    actions = [
      "s3:CreateBucket", "s3:DeleteBucket", "s3:GetBucketLocation",
      "s3:GetBucketPolicy", "s3:PutBucketPolicy", "s3:PutBucketPublicAccessBlock",
      "s3:GetBucketPublicAccessBlock", "s3:PutBucketVersioning", "s3:GetBucketVersioning",
      "s3:PutEncryptionConfiguration", "s3:GetEncryptionConfiguration",
      "s3:PutBucketTagging", "s3:GetBucketTagging", "s3:PutBucketWebsite", "s3:GetBucketWebsite",
      "s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket",
    ]
    resources = [
      "arn:aws:s3:::${var.project_name}-*",
      "arn:aws:s3:::${var.project_name}-*/*",
    ]
  }

  statement {
    sid    = "DynamoDBTablasDelProyecto"
    effect = "Allow"
    actions = [
      "dynamodb:CreateTable", "dynamodb:DeleteTable", "dynamodb:DescribeTable",
      "dynamodb:UpdateTable", "dynamodb:DescribeTimeToLive", "dynamodb:UpdateTimeToLive",
      "dynamodb:DescribeContinuousBackups", "dynamodb:UpdateContinuousBackups",
      "dynamodb:TagResource", "dynamodb:UntagResource", "dynamodb:ListTagsOfResource",
    ]
    resources = ["arn:aws:dynamodb:${var.aws_region}:${local.account}:table/${var.project_name}-*"]
  }

  # Honestidad: CloudFront y WAFv2 no soportan permisos a nivel de recurso en
  # las acciones de creación. No hay forma de acotarlo por nombre; se acota
  # por lista cerrada de acciones.
  statement {
    sid    = "CloudFrontYWaf"
    effect = "Allow"
    actions = [
      "cloudfront:CreateDistribution", "cloudfront:UpdateDistribution",
      "cloudfront:DeleteDistribution", "cloudfront:GetDistribution", "cloudfront:GetDistributionConfig",
      "cloudfront:ListDistributions", "cloudfront:TagResource", "cloudfront:UntagResource",
      "cloudfront:CreateOriginAccessControl", "cloudfront:GetOriginAccessControl",
      "cloudfront:UpdateOriginAccessControl", "cloudfront:DeleteOriginAccessControl",
      "cloudfront:CreateCachePolicy", "cloudfront:GetCachePolicy", "cloudfront:DeleteCachePolicy",
      "wafv2:CreateWebACL", "wafv2:UpdateWebACL", "wafv2:DeleteWebACL",
      "wafv2:GetWebACL", "wafv2:ListWebACLs", "wafv2:AssociateWebACL",
      "wafv2:DisassociateWebACL", "wafv2:TagResource", "wafv2:ListTagsForResource",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "SesDelProyecto"
    effect = "Allow"
    actions = [
      "ses:VerifyDomainIdentity", "ses:VerifyEmailIdentity", "ses:DeleteIdentity",
      "ses:GetIdentityVerificationAttributes", "ses:SetIdentityMailFromDomain",
      "ses:TagResource", "ses:UntagResource",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "CognitoDelProyecto"
    effect = "Allow"
    actions = [
      "cognito-idp:CreateUserPool", "cognito-idp:DeleteUserPool", "cognito-idp:UpdateUserPool",
      "cognito-idp:DescribeUserPool", "cognito-idp:CreateUserPoolClient",
      "cognito-idp:DeleteUserPoolClient", "cognito-idp:UpdateUserPoolClient",
      "cognito-idp:DescribeUserPoolClient", "cognito-idp:CreateGroup", "cognito-idp:DeleteGroup",
      "cognito-idp:GetGroup", "cognito-idp:TagResource", "cognito-idp:UntagResource",
    ]
    resources = ["arn:aws:cognito-idp:${var.aws_region}:${local.account}:userpool/*"]
  }
}

resource "aws_iam_policy" "data_edge" {
  name   = "github-actions-data-edge"
  path   = "/cicd/"
  policy = data.aws_iam_policy_document.data_edge.json
}

# ---------------------------------------------------------------------------
# CloudShopWorkloadBoundary: techo de permisos de CUALQUIER rol que el
# pipeline cree para las Lambdas/servicios del proyecto (paso 2 del roadmap).
# Sin iam:*, sin sts:AssumeRole: un rol con este boundary no puede escalar.
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "workload_boundary" {
  statement {
    sid    = "PermisosDeEjecucionDeAplicacion"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem",
      "dynamodb:Query", "dynamodb:Scan",
      "events:PutEvents",
      "ses:SendEmail", "ses:SendRawEmail",
      "logs:CreateLogStream", "logs:PutLogEvents",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "workload_boundary" {
  name   = "CloudShopWorkloadBoundary"
  path   = "/cicd/"
  policy = data.aws_iam_policy_document.workload_boundary.json
}

# ---------------------------------------------------------------------------
# github-actions-iam: gestión de roles/políticas de aplicación bajo
# /cloudshop/, con permissions boundary obligatorio y Deny de auto-escalada.
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "iam" {
  # (1) Solo crea roles bajo /cloudshop/ y SOLO si les adjunta el boundary.
  statement {
    sid    = "CrearRolesConBoundaryObligatorio"
    effect = "Allow"
    actions = [
      "iam:CreateRole", "iam:PutRolePolicy", "iam:AttachRolePolicy",
      "iam:PutRolePermissionsBoundary",
    ]
    resources = ["arn:aws:iam::${local.account}:role/cloudshop/*"]

    condition {
      test     = "StringEquals"
      variable = "iam:PermissionsBoundary"
      values   = [aws_iam_policy.workload_boundary.arn]
    }
  }

  statement {
    sid    = "GestionRolesDeAplicacion"
    effect = "Allow"
    actions = [
      "iam:GetRole", "iam:DeleteRole", "iam:DeleteRolePolicy", "iam:DetachRolePolicy",
      "iam:GetRolePolicy", "iam:ListRolePolicies", "iam:ListAttachedRolePolicies",
      "iam:TagRole", "iam:UntagRole", "iam:UpdateAssumeRolePolicy",
    ]
    resources = ["arn:aws:iam::${local.account}:role/cloudshop/*"]
  }

  # (2) PassRole acotado por path Y por servicio destino.
  statement {
    sid       = "PassRoleSoloAServiciosDelProyecto"
    effect    = "Allow"
    actions   = ["iam:PassRole"]
    resources = ["arn:aws:iam::${local.account}:role/cloudshop/*"]

    condition {
      test     = "StringEquals"
      variable = "iam:PassedToService"
      values   = ["lambda.amazonaws.com", "apigateway.amazonaws.com", "events.amazonaws.com"]
    }
  }

  statement {
    sid    = "PoliticasGestionadasDelProyecto"
    effect = "Allow"
    actions = [
      "iam:CreatePolicy", "iam:DeletePolicy", "iam:CreatePolicyVersion",
      "iam:DeletePolicyVersion", "iam:GetPolicy", "iam:GetPolicyVersion",
      "iam:ListPolicyVersions", "iam:ListEntitiesForPolicy",
    ]
    resources = ["arn:aws:iam::${local.account}:policy/cloudshop/*"]
  }

  # (3) Deny explícito: el pipeline no puede tocarse a sí mismo ni rotarse
  #     su propia credencial. Un Deny gana sobre cualquier Allow, incluido
  #     el de ReadOnlyAccess.
  statement {
    sid    = "DenyAutoEscalada"
    effect = "Deny"
    actions = [
      "iam:*",
    ]
    resources = [
      "arn:aws:iam::${local.account}:user/cicd/*",
      "arn:aws:iam::${local.account}:role/cicd/*",
      "arn:aws:iam::${local.account}:policy/cicd/*",
    ]
  }

  statement {
    sid       = "DenyQuitarBoundary"
    effect    = "Deny"
    actions   = ["iam:DeleteRolePermissionsBoundary"]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "iam" {
  name   = "github-actions-iam"
  path   = "/cicd/"
  policy = data.aws_iam_policy_document.iam.json
}
