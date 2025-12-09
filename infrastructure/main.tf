# Terraform configuration for banking service infrastructure

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  required_version = ">= 1.0"
}

# Configure the AWS provider
provider "aws" {
  region = var.aws_region
}

# Create VPC
resource "aws_vpc" "banking_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "banking-vpc"
  }
}

# Create public subnet
resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.banking_vpc.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = var.availability_zone
  map_public_ip_on_launch = true
  
  tags = {
    Name = "banking-public-subnet"
  }
}

# Create private subnet
resource "aws_subnet" "private_subnet" {
  vpc_id            = aws_vpc.banking_vpc.id
  cidr_block        = var.private_subnet_cidr
  availability_zone = var.availability_zone
  
  tags = {
    Name = "banking-private-subnet"
  }
}

# Create Internet Gateway
resource "aws_internet_gateway" "banking_igw" {
  vpc_id = aws_vpc.banking_vpc.id
  
  tags = {
    Name = "banking-igw"
  }
}

# Create route table for public subnet
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.banking_vpc.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.banking_igw.id
  }
  
  tags = {
    Name = "banking-public-rt"
  }
}

# Associate route table with public subnet
resource "aws_route_table_association" "public_rta" {
  subnet_id      = aws_subnet.public_subnet.id
  route_table_id = aws_route_table.public_rt.id
}

# Security group for application tier
resource "aws_security_group" "app_sg" {
  name        = "banking-app-sg"
  description = "Security group for banking application"
  vpc_id      = aws_vpc.banking_vpc.id
  
  # Allow inbound HTTP traffic
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # Allow inbound HTTPS traffic
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # Allow inbound SSH traffic (for debugging only)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_access_cidr]
  }
  
  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "banking-app-sg"
  }
}

# Security group for database tier
resource "aws_security_group" "db_sg" {
  name        = "banking-db-sg"
  description = "Security group for banking database"
  vpc_id      = aws_vpc.banking_vpc.id

  # Allow inbound MongoDB traffic from application tier
  ingress {
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "banking-db-sg"
  }
}

# ============================================
# SECRETS MANAGEMENT
# ============================================

# AWS Secrets Manager for storing sensitive configuration
resource "aws_secretsmanager_secret" "banking_secrets" {
  name                    = "banking-service-secrets"
  description             = "Secrets for the banking service application"
  recovery_window_in_days = 7

  tags = {
    Name        = "banking-secrets"
    Environment = var.environment
  }
}

# Secret version (values should be set manually or via CI/CD)
resource "aws_secretsmanager_secret_version" "banking_secrets_version" {
  secret_id = aws_secretsmanager_secret.banking_secrets.id
  secret_string = jsonencode({
    JWT_SECRET   = "CHANGE_ME_IN_CONSOLE"
    MONGODB_URI  = "CHANGE_ME_IN_CONSOLE"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# ============================================
# MONITORING AND LOGGING
# ============================================

# CloudWatch Log Group for application logs
resource "aws_cloudwatch_log_group" "banking_app_logs" {
  name              = "/banking-service/application"
  retention_in_days = 30

  tags = {
    Name        = "banking-app-logs"
    Environment = var.environment
  }
}

# CloudWatch Log Group for access logs
resource "aws_cloudwatch_log_group" "banking_access_logs" {
  name              = "/banking-service/access"
  retention_in_days = 30

  tags = {
    Name        = "banking-access-logs"
    Environment = var.environment
  }
}

# SNS Topic for alerts
resource "aws_sns_topic" "banking_alerts" {
  name = "banking-service-alerts"

  tags = {
    Name        = "banking-alerts"
    Environment = var.environment
  }
}

# CloudWatch Alarm for high error rate
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "banking-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This alarm fires when error rate is too high"
  alarm_actions       = [aws_sns_topic.banking_alerts.arn]

  tags = {
    Name        = "banking-error-alarm"
    Environment = var.environment
  }
}

# CloudWatch Alarm for high latency
resource "aws_cloudwatch_metric_alarm" "high_latency" {
  alarm_name          = "banking-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Average"
  threshold           = 5000
  alarm_description   = "This alarm fires when API latency exceeds 5 seconds"
  alarm_actions       = [aws_sns_topic.banking_alerts.arn]

  tags = {
    Name        = "banking-latency-alarm"
    Environment = var.environment
  }
}

# ============================================
# RESILIENCY - Multi-AZ Setup
# ============================================

# Secondary public subnet in different AZ
resource "aws_subnet" "public_subnet_2" {
  vpc_id                  = aws_vpc.banking_vpc.id
  cidr_block              = var.public_subnet_2_cidr
  availability_zone       = var.availability_zone_2
  map_public_ip_on_launch = true

  tags = {
    Name = "banking-public-subnet-2"
  }
}

# Secondary private subnet in different AZ
resource "aws_subnet" "private_subnet_2" {
  vpc_id            = aws_vpc.banking_vpc.id
  cidr_block        = var.private_subnet_2_cidr
  availability_zone = var.availability_zone_2

  tags = {
    Name = "banking-private-subnet-2"
  }
}

# Associate second public subnet with route table
resource "aws_route_table_association" "public_rta_2" {
  subnet_id      = aws_subnet.public_subnet_2.id
  route_table_id = aws_route_table.public_rt.id
}

# Note: All outputs are defined in outputs.tf