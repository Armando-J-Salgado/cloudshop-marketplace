output "source_email" {
  value = aws_ses_email_identity.source.email
}

output "template_name" {
  value = aws_ses_template.order.name
}
