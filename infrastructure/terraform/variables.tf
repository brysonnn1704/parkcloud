variable "aws_region" {
  description = "AWS Region for deployment (Mumbai)"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Project Name identifier"
  type        = string
  default     = "parkcloud"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "demo"
}

variable "vpc_cidr" {
  description = "CIDR block for ParkCloud custom VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "notification_email" {
  description = "Administrator email for Budgets and CloudWatch/SNS notifications"
  type        = string
  default     = "admin@parkcloud.in"
}

variable "db_instance_class" {
  description = "RDS PostgreSQL instance type (small/micro)"
  type        = string
  default     = "db.t4g.micro"
}

variable "ec2_instance_type" {
  description = "EC2 instance type for backend API (ARM Graviton / x86)"
  type        = string
  default     = "t4g.small"
}

variable "db_username" {
  description = "Master database username"
  type        = string
  default     = "parkcloud_admin"
}

variable "db_password" {
  description = "Master database password"
  type        = string
  sensitive   = true
  default     = "ParkCloudSecureDbPass2026!"
}

variable "jwt_secret" {
  description = "JWT Secret Key stored in SSM SecureString"
  type        = string
  sensitive   = true
  default     = "parkcloud_prod_jwt_secret_token_98200_safe"
}
