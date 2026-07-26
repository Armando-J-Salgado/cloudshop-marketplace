output "table_names" {
  value = {
    carts    = aws_dynamodb_table.carts.name
    products = aws_dynamodb_table.products.name
    orders   = aws_dynamodb_table.orders.name
    stores   = aws_dynamodb_table.stores.name
    audit    = aws_dynamodb_table.audit.name
  }
}

output "table_arns" {
  value = {
    carts    = aws_dynamodb_table.carts.arn
    products = aws_dynamodb_table.products.arn
    orders   = aws_dynamodb_table.orders.arn
    stores   = aws_dynamodb_table.stores.arn
    audit    = aws_dynamodb_table.audit.arn
  }
}
