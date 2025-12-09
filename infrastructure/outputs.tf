# Terraform outputs for banking service infrastructure

# Network outputs
output "vpc_id" {
  description = "ID of the created VPC"
  value       = aws_vpc.banking_vpc.id
}

output "public_subnet_id" {
  description = "ID of the primary public subnet"
  value       = aws_subnet.public_subnet.id
}

output "public_subnet_2_id" {
  description = "ID of the secondary public subnet"
  value       = aws_subnet.public_subnet_2.id
}

output "private_subnet_id" {
  description = "ID of the primary private subnet"
  value       = aws_subnet.private_subnet.id
}

output "private_subnet_2_id" {
  description = "ID of the secondary private subnet"
  value       = aws_subnet.private_subnet_2.id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.banking_igw.id
}

# Security outputs
output "app_security_group_id" {
  description = "ID of the application security group"
  value       = aws_security_group.app_sg.id
}

output "db_security_group_id" {
  description = "ID of the database security group"
  value       = aws_security_group.db_sg.id
}

# Secrets management outputs
output "secrets_manager_arn" {
  description = "ARN of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.banking_secrets.arn
}

output "secrets_manager_name" {
  description = "Name of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.banking_secrets.name
}

# Monitoring outputs
output "app_log_group_name" {
  description = "Name of the application CloudWatch log group"
  value       = aws_cloudwatch_log_group.banking_app_logs.name
}

output "access_log_group_name" {
  description = "Name of the access CloudWatch log group"
  value       = aws_cloudwatch_log_group.banking_access_logs.name
}

output "sns_alerts_topic_arn" {
  description = "ARN of the SNS alerts topic"
  value       = aws_sns_topic.banking_alerts.arn
}
