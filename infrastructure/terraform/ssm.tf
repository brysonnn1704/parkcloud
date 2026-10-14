resource "aws_ssm_parameter" "db_host" {
  name        = "/${var.project_name}/${var.environment}/db/host"
  description = "RDS PostgreSQL endpoint host"
  type        = "String"
  value       = aws_db_instance.postgres.address
}

resource "aws_ssm_parameter" "db_port" {
  name        = "/${var.project_name}/${var.environment}/db/port"
  description = "RDS PostgreSQL port"
  type        = "String"
  value       = tostring(aws_db_instance.postgres.port)
}

resource "aws_ssm_parameter" "db_name" {
  name        = "/${var.project_name}/${var.environment}/db/name"
  description = "ParkCloud database name"
  type        = "String"
  value       = aws_db_instance.postgres.db_name
}

resource "aws_ssm_parameter" "db_user" {
  name        = "/${var.project_name}/${var.environment}/db/user"
  description = "Database master username"
  type        = "String"
  value       = var.db_username
}

resource "aws_ssm_parameter" "db_password" {
  name        = "/${var.project_name}/${var.environment}/db/password"
  description = "Database master password (Encrypted SecureString)"
  type        = "SecureString"
  value       = var.db_password
}

resource "aws_ssm_parameter" "jwt_secret" {
  name        = "/${var.project_name}/${var.environment}/jwt/secret"
  description = "Application JWT token signing secret (SecureString)"
  type        = "SecureString"
  value       = var.jwt_secret
}

resource "aws_ssm_parameter" "s3_bucket" {
  name        = "/${var.project_name}/${var.environment}/s3/bucket"
  description = "ParkCloud S3 Storage bucket name"
  type        = "String"
  value       = aws_s3_bucket.storage.id
}
