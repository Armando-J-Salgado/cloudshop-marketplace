resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = var.lambda_function_names

  alarm_name          = "${var.project_name}-${each.key}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = each.value
  }
}

resource "aws_cloudwatch_metric_alarm" "api_5xx" {
  alarm_name          = "${var.project_name}-api-5xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = var.api_gateway_name
    Stage   = var.api_gateway_stage_name
  }
}

resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "${var.project_name}-api-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Average"
  threshold           = 2000
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = var.api_gateway_name
    Stage   = var.api_gateway_stage_name
  }
}

resource "aws_cloudwatch_dashboard" "this" {
  dashboard_name = "${var.project_name}-overview"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "API Gateway - Requests & 5XX"
          region = var.aws_region
          period = 300
          stat   = "Sum"
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiName", var.api_gateway_name, "Stage", var.api_gateway_stage_name],
            ["AWS/ApiGateway", "5XXError", "ApiName", var.api_gateway_name, "Stage", var.api_gateway_stage_name],
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "API Gateway - Latencia"
          region = var.aws_region
          period = 300
          stat   = "Average"
          metrics = [
            ["AWS/ApiGateway", "Latency", "ApiName", var.api_gateway_name, "Stage", var.api_gateway_stage_name],
          ]
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 24
        height = 6
        properties = {
          title   = "Lambda - Errores por función"
          region  = var.aws_region
          period  = 300
          stat    = "Sum"
          metrics = [for name in var.lambda_function_names : ["AWS/Lambda", "Errors", "FunctionName", name]]
        }
      },
    ]
  })
}
