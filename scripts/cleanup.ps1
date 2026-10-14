# ParkCloud Safe Teardown & Cleanup Script
# Destroys billable cloud resources tagged Project=ParkCloud
# Requires explicit typed confirmation before executing any destructive operations

param (
    [string]$TerraformDir = "infrastructure/terraform"
)

Write-Host "==========================================================" -ForegroundColor Red
Write-Host "  WARNING: ParkCloud Demo Environment Teardown Script     " -ForegroundColor Red
Write-Host "==========================================================" -ForegroundColor Red
Write-Host ""
Write-Host "This script will permanently destroy all AWS cloud resources" -ForegroundColor Yellow
Write-Host "tagged Project=ParkCloud in ap-south-1 (Mumbai):" -ForegroundColor Yellow
Write-Host "  • Application Load Balancer (ALB) and Target Group"
Write-Host "  • EC2 Auto Scaling Group and Launch Template"
Write-Host "  • Amazon RDS PostgreSQL Database Instance & Subnet Group"
Write-Host "  • Amazon S3 Storage Bucket & Stored Report Objects"
Write-Host "  • CloudWatch Alarms & Log Groups"
Write-Host "  • SNS Topic & Email Subscriptions"
Write-Host "  • Systems Manager Parameter Store SecureStrings"
Write-Host "  • Custom VPC, Subnets, Route Tables, and Internet Gateway"
Write-Host ""
Write-Host "DATA LOSS WARNING: All database bookings, user accounts, and S3 PDF/CSV reports" -ForegroundColor Red
Write-Host "will be permanently erased. If you require a database dump or report backup," -ForegroundColor Red
Write-Host "export them prior to running this script." -ForegroundColor Red
Write-Host ""

$confirmation = Read-Host "To confirm complete teardown, type 'DELETE-PARKCLOUD-DEMO'"

if ($confirmation -ne "DELETE-PARKCLOUD-DEMO") {
    Write-Host "Teardown aborted. No resources were modified or deleted." -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "Confirmation confirmed. Invoking Terraform destroy..." -ForegroundColor Yellow

$env:PATH = "d:\CCL\tools;" + $env:PATH
terraform -chdir=$TerraformDir destroy -auto-approve

if ($LASTEXITCODE -eq 0) {
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "  ParkCloud Demo Cloud Resources Successfully Destroyed. " -ForegroundColor Green
    Write-Host "  Zero recurring AWS cloud costs remain.                  " -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
} else {
    Write-Host "Terraform destroy encountered an error. Please inspect output above." -ForegroundColor Red
}
