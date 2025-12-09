# Terraform variables for banking service infrastructure

variable "aws_region" {
  description = "AWS region to deploy infrastructure"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  default     = "development"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for public subnet (AZ 1)"
  type        = string
  default     = "10.0.1.0/24"
}

variable "private_subnet_cidr" {
  description = "CIDR block for private subnet (AZ 1)"
  type        = string
  default     = "10.0.2.0/24"
}

variable "public_subnet_2_cidr" {
  description = "CIDR block for public subnet (AZ 2)"
  type        = string
  default     = "10.0.3.0/24"
}

variable "private_subnet_2_cidr" {
  description = "CIDR block for private subnet (AZ 2)"
  type        = string
  default     = "10.0.4.0/24"
}

variable "availability_zone" {
  description = "Primary availability zone"
  type        = string
  default     = "us-west-2a"
}

variable "availability_zone_2" {
  description = "Secondary availability zone for resiliency"
  type        = string
  default     = "us-west-2b"
}

variable "ssh_access_cidr" {
  description = "CIDR block allowed for SSH access (restrict in production)"
  type        = string
  default     = "0.0.0.0/0"
}
