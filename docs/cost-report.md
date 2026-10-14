# AWS Cost Estimation & Budget Report — ParkCloud (India Edition)

**Project:** ParkCloud – Smart Parking Management System  
**AWS Region:** `ap-south-1` (Asia Pacific, Mumbai)  
**Valuation Date:** 14 October 2026  
**Exchange Rate Used:** 1 USD = ₹84.50 INR  
**Budget Ceiling:** $90.00 – $100.00 USD (₹7,605 – ₹8,450 INR)

---

## 1. Itemized Resource Cost Table (ap-south-1 Mumbai Pricing)

| Service Component | Configuration & Sizing | Hourly Rate (USD) | 3-Day Demo Cost (USD) | 3-Day Demo Cost (INR) | Full Month Cost (USD) | Full Month Cost (INR) |
|---|---|---|---|---|---|---|
| **EC2 Backend Instance** | 1× `t4g.small` (2 vCPU, 2GB RAM, Graviton ARM) | $0.0168 / hr | $1.21 | ₹102.25 | $12.10 | ₹1,022.45 |
| **Application Load Balancer** | 1× ALB (2 AZs, ~1 LCU) | $0.0225 / hr + LCU | $1.62 | ₹136.89 | $16.20 | ₹1,368.90 |
| **Amazon RDS PostgreSQL** | 1× `db.t4g.micro` (Single-AZ, 20GB gp3) | $0.0180 / hr | $1.30 | ₹109.85 | $12.96 | ₹1,095.12 |
| **EBS Storage (EC2)** | 20 GB gp3 ($0.096 / GB-mo) | ~$0.0026 / hr | $0.19 | ₹16.06 | $1.92 | ₹162.24 |
| **RDS Storage (gp3)** | 20 GB gp3 ($0.138 / GB-mo) | ~$0.0038 / hr | $0.27 | ₹22.82 | $2.76 | ₹233.22 |
| **Public IPv4 Address** | 1× Public IP on EC2 ($0.005 / hr) | $0.0050 / hr | $0.36 | ₹30.42 | $3.60 | ₹304.20 |
| **Amazon S3 Storage** | ~50 MB storage + 500 GET/PUT requests | Negligible | $0.01 | ₹0.85 | $0.05 | ₹4.23 |
| **Amazon CloudWatch** | 1 Log Group (14-day retention) + 2 Alarms + 1 Dashboard | Minimal | $0.20 | ₹16.90 | $0.80 | ₹67.60 |
| **Amazon SNS** | 1 Topic + Email Subscriptions (< 100 emails) | Free Tier | $0.00 | ₹0.00 | $0.00 | ₹0.00 |
| **AWS Systems Manager** | Standard Parameter Store (SecureString) | Free Tier | $0.00 | ₹0.00 | $0.00 | ₹0.00 |
| **AWS Budgets** | 1 Monthly Budget with 3 Alert Thresholds | Free Tier | $0.00 | ₹0.00 | $0.00 | ₹0.00 |
| **Data Transfer Out** | < 1 GB demo traffic ($0.109 / GB) | Negligible | $0.05 | ₹4.23 | $0.15 | ₹12.68 |
| **TOTAL ESTIMATED COST** | **Active ParkCloud Demo Architecture** | **~$0.071 / hr** | **$5.21** | **₹440.27** | **$50.54** | **₹4,270.64** |

---

## 2. Key Cost-Optimization Architectural Decisions

### A. Elimination of NAT Gateway (Major Saving: ~₹2,738 / month)
- **Standard VPC Architecture:** Typically uses 1 NAT Gateway per AZ (~$0.045/hr each + $0.045/GB data processing), adding **$32.40/month (~₹2,737.80 INR)** per NAT Gateway.
- **ParkCloud Optimization:** We eliminated NAT Gateways entirely. EC2 instances reside in public subnets with public IPs for outbound package access, but are strictly shielded by Security Groups accepting inbound traffic only from the ALB.
- **S3 Gateway Endpoint:** S3 traffic routes directly across AWS internal routing at **$0.00 cost** via an `aws_vpc_endpoint` (Gateway type).

### B. Single-AZ RDS PostgreSQL with Minimal Retention
- Running Multi-AZ RDS doubles the database compute and storage costs. ParkCloud uses a Single-AZ `db.t4g.micro` with a 1-day backup retention period, perfectly tailored for academic evaluation.

### C. Auto Scaling Guardrails
- Minimum capacity is set to `1` (ensuring immediate availability), with desired capacity `1` and max capacity `2`. This ensures that even under traffic bursts, only 1 additional small instance can be launched.

---

## 3. Demo Operational Cost Plan (Staying within Credits)

1. **Development & Local Verification Phase (Days 1–2):**
   - Implemented and fully verified using local PostgreSQL and built Electron binaries.
   - Cloud cost incurred: **$0.00 (₹0.00)**.

2. **Faculty Evaluation & Demo Phase (3 Days):**
   - Infrastructure deployed via Terraform for live evaluation.
   - Total expected expenditure for 72 continuous hours: **~$5.21 USD (~₹440.27 INR)**.
   - This consumes only **~5.2%** of the available $100 AWS credit budget.

3. **Interim Pausing:**
   - Between demonstration sessions, running `scripts/pause.ps1` scales the ASG to 0 instances and stops the RDS database, reducing idle hourly costs by **>70%**.

4. **Permanent Teardown:**
   - After project grading is completed, running `scripts/cleanup.ps1` completely destroys all cloud resources, reducing ongoing costs to **$0.00**.
