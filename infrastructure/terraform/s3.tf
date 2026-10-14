resource "random_string" "s3_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Private S3 Bucket for Lot Images, Documents, and Utilization Reports
resource "aws_s3_bucket" "storage" {
  bucket        = "${var.project_name}-storage-${var.aws_region}-${random_string.s3_suffix.result}"
  force_destroy = true # Allows clean script teardown without leaving orphaned objects

  tags = {
    Name = "${var.project_name}-storage"
    Type = "Storage"
  }
}

# Block all public access
resource "aws_s3_bucket_public_access_block" "storage" {
  bucket = aws_s3_bucket.storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Server-Side Encryption (AES256)
resource "aws_s3_bucket_server_side_encryption_configuration" "storage" {
  bucket = aws_s3_bucket.storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Enforce TLS 1.2+ for all bucket access
resource "aws_s3_bucket_policy" "enforce_tls" {
  bucket = aws_s3_bucket.storage.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "EnforceTLSRequestsOnly"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.storage.arn,
          "${aws_s3_bucket.storage.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# Lifecycle rule to automatically expire temporary generated reports
resource "aws_s3_bucket_lifecycle_configuration" "storage" {
  bucket = aws_s3_bucket.storage.id

  rule {
    id     = "expire-temp-reports"
    status = "Enabled"

    filter {
      prefix = "reports/"
    }

    expiration {
      days = 7
    }
  }
}

# 6. Backend Application Deployment Bundle
data "archive_file" "backend_deploy" {
  type        = "zip"
  source_dir  = "${path.module}/../../backend"
  output_path = "${path.module}/backend_deploy.zip"
  excludes = [
    "node_modules",
    "uploads",
    ".git"
  ]
}

resource "aws_s3_object" "backend_bundle" {
  bucket                 = aws_s3_bucket.storage.id
  key                    = "deploy/backend.zip"
  source                 = data.archive_file.backend_deploy.output_path
  source_hash            = data.archive_file.backend_deploy.output_base64sha256
  server_side_encryption = "AES256"

  depends_on = [
    aws_s3_bucket_policy.enforce_tls
  ]
}
