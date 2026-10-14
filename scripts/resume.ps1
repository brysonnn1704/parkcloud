# ParkCloud Cost-Control: Resume Demo Environment
# Starts stopped RDS instance and scales ASG back to 1 instance for faculty demo

param (
    [string]$Region = "ap-south-1",
    [string]$ProjectName = "parkcloud"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  ParkCloud Demo Resuming (Preparing Live Demo)           " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start RDS instance
$dbIdentifier = "$ProjectName-postgres-db"
Write-Host "[1/2] Checking RDS Instance '$dbIdentifier'..." -ForegroundColor Yellow
$dbStatus = aws rds describe-db-instances --db-instance-identifier $dbIdentifier --region $Region --query "DBInstances[0].DBInstanceStatus" --output text 2>$null

if ($dbStatus -eq "stopped") {
    Write-Host "Starting RDS instance '$dbIdentifier'..." -ForegroundColor Yellow
    aws rds start-db-instance --db-instance-identifier $dbIdentifier --region $Region | Out-Null
    Write-Host "RDS start initiated. Please wait ~3-5 minutes for PostgreSQL to become 'available'." -ForegroundColor Green
} else {
    Write-Host "RDS instance is currently in '$dbStatus' state." -ForegroundColor Gray
}

# 2. Scale ASG to 1 instance
$asgName = aws autoscaling describe-auto-scaling-groups --region $Region --query "AutoScalingGroups[?contains(AutoScalingGroupName, '$ProjectName')].AutoScalingGroupName" --output text

if ($asgName) {
    Write-Host "[2/2] Scaling Auto Scaling Group '$asgName' to min=1 / desired=1..." -ForegroundColor Yellow
    aws autoscaling update-auto-scaling-group --auto-scaling-group-name $asgName --min-size 1 --desired-capacity 1 --region $Region
    Write-Host "ASG instance launching. Health check takes ~2 minutes to mark healthy." -ForegroundColor Green
} else {
    Write-Host "[2/2] No active Auto Scaling Group found for $ProjectName." -ForegroundColor Gray
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Resume commands sent. Check ALB target health:          " -ForegroundColor Cyan
Write-Host "  aws elbv2 describe-target-health                        " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
