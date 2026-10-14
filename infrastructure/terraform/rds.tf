# DB Subnet Group spanning private subnets across 2 AZs
resource "aws_db_subnet_group" "parkcloud" {
  name        = "${var.project_name}-db-subnet-group"
  description = "Subnet group for ParkCloud RDS PostgreSQL in private subnets"
  subnet_ids  = [aws_subnet.private_1.id, aws_subnet.private_2.id]

  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "postgres" {
  identifier             = "${var.project_name}-postgres-db"
  engine                 = "postgres"
  engine_version         = "16.14"
  instance_class         = var.db_instance_class
  allocated_storage      = 20
  max_allocated_storage  = 20
  storage_type           = "gp3"
  storage_encrypted      = true

  db_name  = "parkcloud_prod"
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.parkcloud.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  multi_az               = false # Cost optimization: single AZ for demo
  backup_retention_period = 1    # Minimal backup retention
  skip_final_snapshot    = true  # Facilitates clean teardown
  deletion_protection    = false
  auto_minor_version_upgrade = true

  tags = {
    Name = "${var.project_name}-postgres-db"
  }
}
