# ParkCloud Cost-Control: Pause Demo Environment
# Scales Auto Scaling Group to 0 and stops single-AZ RDS instance to halt compute billing

param (
    [string]$Region = "ap-south-1",
    [string]$ProjectName = "parkcloud"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  ParkCloud Demo Pausing (Cost Optimization)              " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Scale ASG to 0 instances
$asgName = aws autoscaling describe-auto-scaling-groups --region $Region --query "AutoScalingGroups[?contains(AutoScalingGroupName, '$ProjectName')].AutoScalingGroupName" --output text

if ($asgName) {
    Write-Host "[1/2] Scaling Auto Scaling Group '$asgName' to 0 instances..." -ForegroundColor Yellow
    aws autoscaling update-auto-scaling-group --auto-scaling-group-name $asgName --min-size 0 --desired-capacity 0 --region $Region
    Write-Host "Auto Scaling Group scaled to 0. EC2 hourly compute paused." -ForegroundColor Green
} else {
    Write-Host "[1/2] No active Auto Scaling Group found for $ProjectName." -ForegroundColor Gray
}

# 2. Stop RDS instance
$dbIdentifier = "$ProjectName-postgres-db"
Write-Host "[2/2] Checking RDS Instance '$dbIdentifier'..." -ForegroundColor Yellow
$dbStatus = aws rds describe-db-instances --db-instance-identifier $dbIdentifier --region $Region --query "DBInstances[0].DBInstanceStatus" --output text 2>$null

if ($dbStatus -eq "available") {
    Write-Host "Stopping RDS instance '$dbIdentifier' to save hourly compute costs..." -ForegroundColor Yellow
    aws rds stop-db-instance --db-instance-identifier $dbIdentifier --region $Region | Out-Null
    Write-Host "RDS instance stop initiated. (Note: AWS auto-restarts stopped RDS instances after 7 days)." -ForegroundColor Green
} else {
    Write-Host "RDS instance status is '$dbStatus'. No action needed." -ForegroundColor Gray
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  ParkCloud Demo Environment is now PAUSED.               " -ForegroundColor Cyan
Write-Host "  Run scripts/resume.ps1 before your faculty demo.        " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
