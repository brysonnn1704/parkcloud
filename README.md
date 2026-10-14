# ParkCloud (India Edition)
### Cloud-Based Smart Parking Management and Analytics System for Indian Cities

[![AWS ap-south-1](https://img.shields.io/badge/AWS%20Region-ap--south--1%20(Mumbai)-orange.svg)](https://aws.amazon.com/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2F%20Express-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016%20%2F%2018-blue.svg)](https://www.postgresql.org/)
[![Electron](https://img.shields.io/badge/Frontend-Electron%20%2B%20React%20(Desktop)-purple.svg)](https://www.electronjs.org/)
[![IaC](https://img.shields.io/badge/IaC-Terraform%20v1.9+-623CE4.svg)](https://www.terraform.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 1. Abstract & Problem Statement

Urban congestion across Indian metropolitan hubs (Mumbai, Pune, Thane, Bengaluru) is heavily aggravated by vehicles circling commercial complexes, railway station lots, and tech parks searching for available parking. Conventional parking systems either lack real-time digital visibility or suffer from critical concurrency flaws, leading to double-booked bays, delayed ingress, and cash leakage.

**ParkCloud** is an enterprise-grade, cloud-hosted smart parking management platform engineered around Indian parking realities:
- **Vehicle Diversity:** Native support for Two-Wheelers (motorcycles/scooters), Four-Wheelers (cars/SUVs), Electric Vehicles (EVs with fast chargers), Three-Wheelers (Auto-Rickshaws), and Commercial vehicles.
- **Indian Plate Validation:** Normalization and validation for standard state registrations (`MH02AB1234`, `DL01C9999`) and Bharat Series (`22BH1234AA`).
- **Currency & Time Localization:** All fees stored in integer paise and displayed in Indian Rupees (₹, INR with `en-IN` lakh/crore notation) plus a clearly labeled demo 18% GST line. All operating schedules and peak analytics calculated in **Indian Standard Time (IST, Asia/Kolkata, UTC+05:30)**.
- **Strict Concurrency Protection:** Employs PostgreSQL row-level locking (`SELECT ... FOR UPDATE`) and database-level temporal exclusion (`btree_gist` with `tstzrange`) to guarantee that simultaneous booking attempts never double-book a bay.

---

## 2. System Architecture

```
Installed Electron Desktop App (Windows)
               │ (HTTPS/HTTP)
               ▼
   [ Internet Gateway (IGW) ]
               │
               ▼
[ Application Load Balancer (ALB) ] (Public Subnets: 10.0.1.0/24 & 10.0.2.0/24)
               │ (Proxy to Port 5000)
               ▼
[ EC2 Auto Scaling Group ] (Amazon Linux 2023, systemd parkcloud.service)
      │                     │                     │
      ▼                     ▼                     ▼
[ Private RDS Postgres ] [ Private S3 Bucket ] [ SSM Parameter Store ]
  (10.0.10.0/24 & 20/24)   (Via S3 Endpoint)     (SecureString Secrets)
```

- **Architecture Diagram:** Fully editable Draw.io XML located at [`docs/parkcloud-architecture.drawio`](docs/parkcloud-architecture.drawio).
- **Service Justification:** Detailed justification for all 9 integrated services located at [`docs/service-justification.md`](docs/service-justification.md).
- **Cost Analysis:** Itemized pricing breakdown in ₹ and USD located at [`docs/cost-report.md`](docs/cost-report.md).

---

## 3. Technology Stack

- **Desktop Frontend:** Electron v33 + React.js v18 + Vite v6 + Chart.js (packaged natively into `dist_electron/win-unpacked/ParkCloud.exe`).
- **Backend API:** Node.js v24 / Express.js REST API with Helmet security headers, rate limiting, and cookie-based authentication.
- **Authoritative Database:** PostgreSQL 16 (Amazon RDS in production, local PostgreSQL in development) with the `btree_gist` extension.
- **Cloud Infrastructure (AWS ap-south-1 Mumbai):**
  - **Compute:** Amazon EC2 (`t4g.small` / `t3.micro`) inside an Auto Scaling Group.
  - **Networking:** Custom VPC (`10.0.0.0/16`), 4 Subnets across 2 AZs, Route Tables, IGW, and S3 Gateway VPC Endpoint.
  - **Storage:** Amazon S3 Private Bucket with AES-256 encryption and 15-minute Presigned URLs.
  - **Security:** AWS IAM instance profile (`ParkCloudEC2Role`) + AWS Systems Manager (SSM) Parameter Store (`SecureString`).
  - **Monitoring & Alerts:** Amazon CloudWatch Logs & Alarms + Amazon Simple Notification Service (SNS) + AWS Budgets ($25 ceiling).

---

## 4. Local Quickstart & Development

### Prerequisites
- Node.js v20+ and npm v10+
- PostgreSQL v15+ running locally (e.g. on port 5432)

### Step 1: Database Initialization
```bash
# Connect to PostgreSQL and create databases
psql -U postgres -c "CREATE DATABASE parkcloud_dev;"
psql -U postgres -d parkcloud_dev -c "CREATE EXTENSION IF NOT EXISTS btree_gist;"
```

### Step 2: Backend Setup & Seed
```bash
cd backend
npm install
npm run migrate    # Applies database/migrations/001_initial_schema.sql
npm run seed       # Seeds 5 Indian parking lots, demo users & vehicles
npm run dev        # Starts REST API on http://localhost:5000
```

### Step 3: Launch Frontend Application
```bash
cd ../frontend
npm install
npm run electron:dev    # Launches Electron desktop application
```

### Demo Credentials
- **Standard Driver User:** `rahul.sharma@example.com` / `User@ParkCloud2026!`
- **Administrator / Operator:** `admin@parkcloud.in` / `Admin@ParkCloud2026!`

---

## 5. Automated Verification & Testing

ParkCloud includes an automated integration and concurrency test suite:
```bash
# Run test suite
node --test tests/backend.test.js
```
**Test Results (23/23 Tests Passed):**
- ✅ Indian Plate Normalization & Validation (Standard + Bharat Series)
- ✅ Indian Phone Number Validation (+91 prefix)
- ✅ Currency Formatting in Paise to INR (Lakh/Crore)
- ✅ Health & Readiness ALB target probes (HTTP 200)
- ✅ Authentication, Password Hashing & RBAC
- ✅ Time-Interval Slot Availability Computation
- ✅ **Concurrency Race Condition Test:** 5 simultaneous requests for the exact same slot -> Exactly 1 succeeds (201), 4 rejected with 409 Conflict.
- ✅ Gate Boom Barrier Check-in & Check-out Workflow
- ✅ Real-Time SQL Analytics (IST Peak Hours & Heatmap)
- ✅ Server-side PDF & CSV Audit Report Generation to S3

---

## 6. AWS Cloud Deployment (Terraform)

```bash
cd infrastructure/terraform

# 1. Initialize Terraform
terraform init

# 2. Review Execution Plan
terraform plan

# 3. Apply Infrastructure (Requires User Budget Approval)
terraform apply -auto-approve
```

---

## 7. Cost Control, Pausing & Teardown

To keep resource consumption strictly within the student credit budget (~$90–$100):
- **Pause between demos (Saves >70% hourly cost):**
  ```powershell
  .\scripts\pause.ps1
  ```
- **Resume for faculty evaluation:**
  ```powershell
  .\scripts\resume.ps1
  ```
- **Permanent Teardown (Destroys all billable resources):**
  ```powershell
  .\scripts\cleanup.ps1
  ```

---

## 8. Documentation Index

- [`docs/rubric-traceability.md`](docs/rubric-traceability.md) — 18/18 College Rubric Verification Matrix
- [`docs/service-justification.md`](docs/service-justification.md) — Architectural Justification for all 9 AWS Services
- [`docs/cost-report.md`](docs/cost-report.md) — Itemized INR and USD Cost Analysis
- [`docs/CONSOLE_GUIDE.md`](docs/CONSOLE_GUIDE.md) — AWS Management Console Evaluation & CLI Verification Guide
- [`docs/viva-notes.md`](docs/viva-notes.md) — Viva Defense Questions & Answers for Evaluators
- [`docs/demo-script.md`](docs/demo-script.md) — Step-by-Step 10-Minute Faculty Demo Walkthrough
- [`docs/parkcloud-architecture.drawio`](docs/parkcloud-architecture.drawio) — Editable Architecture Diagram
