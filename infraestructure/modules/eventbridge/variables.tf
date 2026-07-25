variable "project_name" {
  description = "Prefijo de nombres de recursos."
  type        = string
}

variable "bus_name" {
  description = "Nombre del event bus. Lo decide el root (local, no output de este módulo) para romper la dependencia circular con el módulo lambdas, que necesita este mismo string como EVENT_BUS_NAME."
  type        = string
}

variable "lambda_function_arns" {
  description = "ARNs de las Lambdas objetivo, por clave lógica (output function_arns del módulo lambdas)."
  type        = map(string)
}

variable "lambda_function_names" {
  description = "function_name de las Lambdas objetivo, por clave lógica (output function_names del módulo lambdas)."
  type        = map(string)
}
