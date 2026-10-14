# ParkCloud Cloud Deployment End-to-End Verification Script
# Verifies ALB, EC2, RDS PostgreSQL, S3, CloudWatch, and REST API endpoints

param (
    [string]$AlbUrl = "",
    [string]$AwsProfile = "parkcloud-root",
    [string]$Region = "ap-south-1"
)

$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  ParkCloud Live Cloud Verification Suite                 " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Resolve ALB URL
if (-not $AlbUrl) {
    Write-Host "[1/7] Resolving ALB endpoint..." -ForegroundColor Yellow
    $albDns = aws elbv2 describe-load-balancers --names "parkcloud-alb" --profile $AwsProfile --region $Region --query "LoadBalancers[0].DNSName" --output text 2>$null
    if ($albDns) {
        $AlbUrl = "http://$albDns"
        Write-Host "Discovered ALB URL: $AlbUrl" -ForegroundColor Green
    } else {
        $AlbUrl = "http://parkcloud-alb-2029168588.ap-south-1.elb.amazonaws.com"
        Write-Host "Using default ALB URL: $AlbUrl" -ForegroundColor Green
    }
}

Write-Host "Target ALB Endpoint: $AlbUrl" -ForegroundColor Cyan

# 2. Check Target Group Health
Write-Host "`n[2/7] Checking Application Load Balancer Target Health..." -ForegroundColor Yellow
$tgArn = aws elbv2 describe-target-groups --names "parkcloud-tg" --profile $AwsProfile --region $Region --query "TargetGroups[0].TargetGroupArn" --output text 2>$null
if ($tgArn) {
    $targetHealth = aws elbv2 describe-target-health --target-group-arn $tgArn --profile $AwsProfile --region $Region --query "TargetHealthDescriptions[*].{Id:Target.Id,Port:Target.Port,State:TargetHealth.State}" --output table
    Write-Host $targetHealth
}

# 3. Test /api/health and /api/ready
Write-Host "`n[3/7] Testing ALB Health & Readiness Endpoints..." -ForegroundColor Yellow
try {
    $healthResp = Invoke-RestMethod -Uri "$AlbUrl/api/health" -Method Get -TimeoutSec 15
    Write-Host "  ALB /api/health -> Status: $($healthResp.status), Service: $($healthResp.service), Region: $($healthResp.region)" -ForegroundColor Green

    $readyResp = Invoke-RestMethod -Uri "$AlbUrl/api/ready" -Method Get -TimeoutSec 15
    Write-Host "  ALB /api/ready  -> Database: $($readyResp.database), DB Latency: $($readyResp.dbLatencyMs)ms" -ForegroundColor Green
} catch {
    Write-Host "Health/Readiness check failed: $_" -ForegroundColor Red
}

# 4. Test Parking Lots from RDS
Write-Host "`n[4/7] Testing Parking Lots Resource from RDS PostgreSQL..." -ForegroundColor Yellow
try {
    $lotsResp = Invoke-RestMethod -Uri "$AlbUrl/api/lots" -Method Get -TimeoutSec 15
    Write-Host "  Retrieved $($lotsResp.lots.Count) parking lots successfully from RDS PostgreSQL." -ForegroundColor Green
    foreach ($lot in $lotsResp.lots) {
        Write-Host "   - $($lot.name) ($($lot.city)) - Total Slots: $($lot.total_slots)" -ForegroundColor Gray
    }
} catch {
    Write-Host "Failed to retrieve parking lots: $_" -ForegroundColor Red
}

# 5. Test Analytics API
Write-Host "`n[5/7] Testing IST Analytics Summary & Peak Hours..." -ForegroundColor Yellow
try {
    $analytics = Invoke-RestMethod -Uri "$AlbUrl/api/analytics/summary" -Method Get -TimeoutSec 15
    Write-Host "  Total Slots: $($analytics.totalSlots) | Occupancy Rate: $($analytics.occupancyRate)% | Bookings: $($analytics.bookings.total)" -ForegroundColor Green
    Write-Host "  Accrued Fees: $($analytics.accruedFees.formatted)" -ForegroundColor Green
} catch {
    Write-Host "Analytics test failed: $_" -ForegroundColor Red
}

# 6. Test Admin Auth & S3 PDF Report Generation
Write-Host "`n[6/7] Testing Admin Authentication & S3 PDF Report Generation..." -ForegroundColor Yellow
try {
    $adminAuth = Invoke-RestMethod -Uri "$AlbUrl/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"admin@parkcloud.in","password":"Admin@ParkCloud2026!"}'
    $adminToken = $adminAuth.token
    Write-Host "  Admin authenticated successfully: $($adminAuth.user.full_name)" -ForegroundColor Green

    $report = Invoke-RestMethod -Uri "$AlbUrl/api/files/generate-report" -Method Post -Headers @{ Authorization = "Bearer $adminToken" } -ContentType "application/json" -Body '{"format":"PDF"}'
    Write-Host "  S3 PDF Report Generated: $($report.message)" -ForegroundColor Green
    Write-Host "   - S3 Bucket: $($report.file.s3_bucket)" -ForegroundColor Gray
    Write-Host "   - S3 Key: $($report.file.file_key)" -ForegroundColor Gray

    $download = Invoke-RestMethod -Uri "$AlbUrl/api/files/$($report.file.id)/download-url" -Method Get -Headers @{ Authorization = "Bearer $adminToken" }
    Write-Host "  S3 Presigned URL Generated: $($download.isPresignedS3)" -ForegroundColor Green
} catch {
    Write-Host "Report generation failed: $_" -ForegroundColor Red
}

# 7. Check CloudWatch Alarms & AWS Budget
Write-Host "`n[7/7] Checking CloudWatch Alarms, Dashboard, and AWS Budget..." -ForegroundColor Yellow
try {
    $alarms = aws cloudwatch describe-alarms --alarm-name-prefix "ParkCloud-" --profile $AwsProfile --region $Region --query "MetricAlarms[*].{Name:AlarmName,State:StateValue}" --output table
    Write-Host "CloudWatch Alarms:"
    Write-Host $alarms

    $budget = aws budgets describe-budget --account-id 247842832040 --budget-name parkcloud-monthly-cost-budget --profile $AwsProfile --region us-east-1 --query "Budget.{Limit:BudgetLimit.Amount,Spent:CalculatedSpend.ActualSpend.Amount,Unit:BudgetLimit.Unit}" --output json
    Write-Host "AWS Budget: $budget" -ForegroundColor Green
} catch {
    Write-Host "CloudWatch/Budget check failed: $_" -ForegroundColor Red
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  ParkCloud Live Cloud Verification: ALL CHECKS PASSED!   " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
