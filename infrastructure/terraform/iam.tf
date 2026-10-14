# 1. EC2 Instance Assume Role Policy
resource "aws_iam_role" "ec2_role" {
  name = "ParkCloudEC2Role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "ParkCloudEC2Role"
  }
}

# 2. Scoped S3 Policy
resource "aws_iam_policy" "s3_access" {
  name        = "ParkCloudS3ScopedPolicy"
  description = "Allows ParkCloud EC2 instance to read/write objects in its designated S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = aws_s3_bucket.storage.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.storage.arn}/*"
      }
    ]
  })
}

# 3. Scoped SSM Parameter Store Read Policy
resource "aws_iam_policy" "ssm_access" {
  name        = "ParkCloudSSMScopedPolicy"
  description = "Allows ParkCloud EC2 instance to read namespaced parameters from Parameter Store"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:*:parameter/${var.project_name}/*"
      }
    ]
  })
}

# 4. Scoped CloudWatch & SNS Policy
resource "aws_iam_policy" "monitoring_access" {
  name        = "ParkCloudMonitoringScopedPolicy"
  description = "Allows ParkCloud EC2 to ingest application logs and publish custom metrics/alerts"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:log-group:/${var.project_name}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "cloudwatch:namespace" = "ParkCloud/Application"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = "arn:aws:sns:${var.aws_region}:*:${var.project_name}-*"
      }
    ]
  })
}

# Attach Scoped Policies to Role
resource "aws_iam_role_policy_attachment" "attach_s3" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.s3_access.arn
}

resource "aws_iam_role_policy_attachment" "attach_ssm" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ssm_access.arn
}

resource "aws_iam_role_policy_attachment" "attach_monitoring" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.monitoring_access.arn
}

# AWS Managed policy for SSM Session Manager (secure terminal access without open SSH port 22)
resource "aws_iam_role_policy_attachment" "attach_ssm_core" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# 5. Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "ParkCloudEC2InstanceProfile"
  role = aws_iam_role.ec2_role.name
}
