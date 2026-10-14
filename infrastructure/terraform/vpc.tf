data "aws_availability_zones" "available" {
  state = "available"
}

# 1. Custom VPC
resource "aws_vpc" "parkcloud" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# 2. Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.parkcloud.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# 3. Public Subnets (AZ1 & AZ2)
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.parkcloud.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-subnet-1a"
    Type = "Public"
  }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.parkcloud.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-subnet-1b"
    Type = "Public"
  }
}

# 4. Private Subnets for RDS PostgreSQL (AZ1 & AZ2)
resource "aws_subnet" "private_1" {
  vpc_id                  = aws_vpc.parkcloud.id
  cidr_block              = "10.0.10.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = false

  tags = {
    Name = "${var.project_name}-private-subnet-1a"
    Type = "Private-DB"
  }
}

resource "aws_subnet" "private_2" {
  vpc_id                  = aws_vpc.parkcloud.id
  cidr_block              = "10.0.20.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = false

  tags = {
    Name = "${var.project_name}-private-subnet-1b"
    Type = "Private-DB"
  }
}

# 5. Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.parkcloud.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

# 6. Private Route Table (Isolated, No default internet route)
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.parkcloud.id

  tags = {
    Name = "${var.project_name}-private-rt"
  }
}

resource "aws_route_table_association" "private_1" {
  subnet_id      = aws_subnet.private_1.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_2" {
  subnet_id      = aws_subnet.private_2.id
  route_table_id = aws_route_table.private.id
}

# 7. S3 Gateway VPC Endpoint (Free of charge, provides secure private connection to S3)
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.parkcloud.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"

  route_table_ids = [
    aws_route_table.public.id,
    aws_route_table.private.id
  ]

  tags = {
    Name = "${var.project_name}-s3-gateway-endpoint"
  }
}
