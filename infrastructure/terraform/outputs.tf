output "alb_dns_name" {
  description = "Public DNS name of the Application Load Balancer"
  value       = aws_lb.parkcloud.dns_name
}

output "alb_http_url" {
  description = "Entrypoint URL for the ParkCloud REST API"
  value       = "http://${aws_lb.parkcloud.dns_name}"
}

output "rds_endpoint" {
  description = "Private endpoint address for RDS PostgreSQL database"
  value       = aws_db_instance.postgres.address
}

output "s3_bucket_name" {
  description = "Designated private S3 bucket name"
  value       = aws_s3_bucket.storage.id
}

output "sns_topic_arn" {
  description = "ARN of SNS Alert Topic"
  value       = aws_sns_topic.alerts.arn
}

output "cloudwatch_log_group" {
  description = "CloudWatch Application Log Group"
  value       = aws_cloudwatch_log_group.app_logs.name
}

output "resource_group_name" {
  description = "AWS Resource Group for ParkCloud"
  value       = aws_resourcegroups_group.parkcloud.name
}
