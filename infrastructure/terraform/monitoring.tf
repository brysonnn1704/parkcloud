# 1. CloudWatch Log Group
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/${var.project_name}/app-logs"
  retention_in_days = 14

  tags = {
    Name = "${var.project_name}-log-group"
  }
}

# 2. SNS Alert Topic
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts-topic"

  tags = {
    Name = "${var.project_name}-alerts-topic"
  }
}

# 3. SNS Email Subscription
resource "aws_sns_topic_subscription" "email_sub" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# 4. CloudWatch Alarm: EC2 High CPU (> 70% for 5 consecutive 1-minute periods)
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "ParkCloud-HighCPU-Alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Average"
  threshold           = 70
  alarm_description   = "Triggers when average EC2 Auto Scaling CPU utilization exceeds 70% for 5 consecutive minutes."
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }

  tags = {
    Name = "ParkCloud-HighCPU-Alarm"
  }
}

# 5. CloudWatch Alarm: Unhealthy ALB Targets
resource "aws_cloudwatch_metric_alarm" "unhealthy_targets" {
  alarm_name          = "ParkCloud-UnhealthyTargets-Alarm"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Maximum"
  threshold           = 1
  alarm_description   = "Triggers when one or more backend instances fail ALB health checks."
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    TargetGroup  = aws_lb_target_group.app.arn_suffix
    LoadBalancer = aws_lb.parkcloud.arn_suffix
  }

  tags = {
    Name = "ParkCloud-UnhealthyTargets-Alarm"
  }
}

# 6. CloudWatch Dashboard for Consolidated Monitoring
resource "aws_cloudwatch_dashboard" "parkcloud" {
  dashboard_name = "ParkCloud-Operational-Dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", aws_autoscaling_group.app.name]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "EC2 ASG CPU Utilization (%)"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", aws_lb.parkcloud.arn_suffix],
            [".", "TargetResponseTime", ".", "."]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "ALB Requests & Latency"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", aws_db_instance.postgres.identifier]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "RDS Active Database Connections"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["ParkCloud/Application", "LotOccupancyRate", "Environment", var.environment]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ParkCloud Custom Metric: Lot Occupancy Rate (%)"
        }
      }
    ]
  })
}
