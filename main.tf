data "aws_caller_identity" "current" {}

locals {
  # Nombre/ARN del event bus calculados aquí, no leídos de module.eventbridge:
  # el módulo iam los necesita para el rol de orders (events:PutEvents) y el
  # módulo lambdas para EVENT_BUS_NAME, pero eventbridge a su vez necesita
  # los ARNs de las Lambdas ya creadas. Depender del output real del módulo
  # eventbridge desde iam/lambdas cerraría un ciclo (iam -> eventbridge ->
  # lambdas -> iam). El nombre del bus es una convención nuestra, no un
  # atributo generado por AWS, así que calcularlo aquí es seguro.
  event_bus_name = "${var.project_name}-events"
  event_bus_arn  = "arn:aws:events:${var.aws_region}:${data.aws_caller_identity.current.account_id}:event-bus/${local.event_bus_name}"

  # Mismo razonamiento: el nombre de la REST API para las dimensiones de
  # CloudWatch (ApiName) es el `name` del recurso, conocido de antemano.
  api_gateway_name = "${var.project_name}-api"
}

# Parámetro SSM leído por utils/event_emitter.py (Products, Stores, Carts,
# Users) para obtener el nombre del event bus sin hardcodearlo en el código.
resource "aws_ssm_parameter" "cloudshop_eventbus_name" {
  name  = "/cloudshop/eventbus/name"
  type  = "String"
  value = local.event_bus_name
}

module "dynamodb" {
  source = "./infraestructure/modules/dynamodb"

  project_name = var.project_name
}

module "cognito" {
  source = "./infraestructure/modules/cognito"

  project_name = var.project_name
}

module "ses" {
  source = "./infraestructure/modules/ses"

  project_name = var.project_name
  source_email = var.ses_source_email
  user_pool_id = module.cognito.user_pool_id
}

module "iam" {
  source = "./infraestructure/modules/iam"

  project_name          = var.project_name
  aws_region            = var.aws_region
  workload_boundary_arn = var.workload_boundary_arn
  table_arns            = module.dynamodb.table_arns
  event_bus_arn         = local.event_bus_arn
  user_pool_arn         = module.cognito.user_pool_arn
}

module "lambdas" {
  source = "./infraestructure/modules/lambdas"

  project_name   = var.project_name
  role_arns      = module.iam.role_arns
  table_names    = module.dynamodb.table_names
  event_bus_name = local.event_bus_name
}

module "api_gateway" {
  source = "./infraestructure/modules/api-gateway"

  project_name          = var.project_name
  api_stage_name        = var.api_stage_name
  user_pool_arn         = module.cognito.user_pool_arn
  lambda_invoke_arns    = module.lambdas.invoke_arns
  lambda_function_names = module.lambdas.function_names
}

module "eventbridge" {
  source = "./infraestructure/modules/eventbridge"

  project_name          = var.project_name
  bus_name              = local.event_bus_name
  lambda_function_arns  = module.lambdas.function_arns
  lambda_function_names = module.lambdas.function_names
}

module "s3" {
  source = "./infraestructure/modules/s3"

  project_name = var.project_name
}

module "waf" {
  source = "./infraestructure/modules/waf"

  project_name          = var.project_name
  api_gateway_stage_arn = module.api_gateway.stage_arn
}

module "cloudfront" {
  source = "./infraestructure/modules/cloudfront"

  project_name                = var.project_name
  bucket_id                   = module.s3.bucket_id
  bucket_arn                  = module.s3.bucket_arn
  bucket_regional_domain_name = module.s3.bucket_regional_domain_name
  waf_web_acl_arn             = module.waf.cloudfront_web_acl_arn
}

module "cloudwatch" {
  source = "./infraestructure/modules/cloudwatch"

  project_name           = var.project_name
  aws_region             = var.aws_region
  lambda_function_names  = module.lambdas.function_names
  api_gateway_name       = local.api_gateway_name
  api_gateway_stage_name = var.api_stage_name
}
