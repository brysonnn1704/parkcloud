# Latest Amazon Linux 2023 AMI for ARM (Graviton) or x86
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-arm64"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}

# Launch Template
resource "aws_launch_template" "app" {
  name_prefix   = "${var.project_name}-lt-"
  image_id      = data.aws_ami.amazon_linux_2023.id
  instance_type = var.ec2_instance_type

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [aws_security_group.app.id]
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      encrypted             = true
      delete_on_termination = true
    }
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    set -e
    exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

    echo "=== ParkCloud EC2 Instance Bootstrap Starting ==="

    # 1. Update OS and install Node.js 20, git, postgresql
    dnf update -y
    dnf install -y nodejs git postgresql15 amazon-cloudwatch-agent

    # 2. Setup application directory
    mkdir -p /opt/parkcloud
    cd /opt/parkcloud

    # 3. Pull SSM Parameters into local env file (Safe, zero hardcoded keys in repo)
    AWS_REGION="${var.aws_region}"
    DB_HOST=$(aws ssm get-parameter --name "/${var.project_name}/${var.environment}/db/host" --region $AWS_REGION --query "Parameter.Value" --output text)
    DB_PORT=$(aws ssm get-parameter --name "/${var.project_name}/${var.environment}/db/port" --region $AWS_REGION --query "Parameter.Value" --output text)
    DB_NAME=$(aws ssm get-parameter --name "/${var.project_name}/${var.environment}/db/name" --region $AWS_REGION --query "Parameter.Value" --output text)
    DB_USER=$(aws ssm get-parameter --name "/${var.project_name}/${var.environment}/db/user" --region $AWS_REGION --query "Parameter.Value" --output text)
    DB_PASSWORD=$(aws ssm get-parameter --name "/${var.project_name}/${var.environment}/db/password" --with-decryption --region $AWS_REGION --query "Parameter.Value" --output text)
    JWT_SECRET=$(aws ssm get-parameter --name "/${var.project_name}/${var.environment}/jwt/secret" --with-decryption --region $AWS_REGION --query "Parameter.Value" --output text)
    S3_BUCKET=$(aws ssm get-parameter --name "/${var.project_name}/${var.environment}/s3/bucket" --region $AWS_REGION --query "Parameter.Value" --output text)

    cat <<EOT > /opt/parkcloud/.env
    PORT=5000
    NODE_ENV=production
    AWS_REGION=$AWS_REGION
    DB_HOST=$DB_HOST
    DB_PORT=$DB_PORT
    DB_NAME=$DB_NAME
    DB_USER=$DB_USER
    DB_PASSWORD=$DB_PASSWORD
    DB_SSL=true
    JWT_SECRET=$JWT_SECRET
    S3_BUCKET_NAME=$S3_BUCKET
    ENABLE_CLOUDWATCH_METRICS=true
    EOT

    chmod 600 /opt/parkcloud/.env

    # 4. Create systemd unit service
    cat <<EOT > /etc/systemd/system/parkcloud.service
    [Unit]
    Description=ParkCloud Smart Parking REST API Service
    After=network.target

    [Service]
    Type=simple
    User=ec2-user
    WorkingDirectory=/opt/parkcloud
    EnvironmentFile=/opt/parkcloud/.env
    ExecStart=/usr/bin/node /opt/parkcloud/src/server.js
    Restart=always
    RestartSec=10
    StandardOutput=journal
    StandardError=journal

    [Install]
    WantedBy=multi-user.target
    EOT

    systemctl daemon-reload
    systemctl enable parkcloud.service
    echo "=== ParkCloud Bootstrap Completed ==="
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name    = "${var.project_name}-backend-instance"
      Project = "ParkCloud"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "app" {
  name_prefix         = "${var.project_name}-asg-"
  vpc_zone_identifier = [aws_subnet.public_1.id, aws_subnet.public_2.id]
  target_group_arns   = [aws_lb_target_group.app.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = 1
  desired_capacity = 1
  max_size         = 2

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-asg-instance"
    propagate_at_launch = true
  }

  tag {
    key                 = "Project"
    value               = "ParkCloud"
    propagate_at_launch = true
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Target Tracking Scaling Policy (CPU 60%)
resource "aws_autoscaling_policy" "cpu_target_tracking" {
  name                   = "${var.project_name}-cpu-target-tracking"
  autoscaling_group_name = aws_autoscaling_group.app.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 60.0
  }
}
