terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.80"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "ParkCloud"
      Environment = "Demo"
      ManagedBy   = "ParkCloudIaC"
      Region      = var.aws_region
    }
  }
}

# Resource Group named ParkCloud-Demo grouping all tagged resources
resource "aws_resourcegroups_group" "parkcloud" {
  name        = "ParkCloud-Demo"
  description = "Resource Group for all ParkCloud Smart Parking Cloud components"

  resource_query {
    query = jsonencode({
      ResourceTypeFilters = ["AWS::AllSupported"]
      TagFilters = [
        {
          Key    = "Project"
          Values = ["ParkCloud"]
        }
      ]
    })
  }
}
