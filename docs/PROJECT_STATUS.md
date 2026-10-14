# ParkCloud Project Status Checklist

**Last Updated:** 2026-10-14 23:48 IST  
**Environment:** Windows 11 Local Development / AWS `ap-south-1` (Mumbai)  
**Budget Planning:** Hard ceiling $90–$100 USD (₹7,605–₹8,450 INR @ 84.50 INR/USD)

---

## Phase Summary
- [x] **Phase 1: Discovery & Planning** (Local tools: Node v24, npm v11, Git v2.54, PostgreSQL 18 local service; Terraform v1.9.8 installed in `d:\CCL\tools`; AWS CLI verified; AWS temporary session token expired; project structure initialized).
- [x] **Phase 2: Local Development** (PostgreSQL schema with `btree_gist` temporal exclusion, Express REST API backend, React + Vite + Electron desktop app, S3 upload service with local fallback, IST analytics engine, seed data for 5 Indian lots).
- [x] **Phase 3: Automated Testing** (23/23 tests passed: Auth, lots, slots, Indian plate validation, high-concurrency race condition testing with 5 simultaneous requests, operator check-in/out, PDF/CSV generation).
- [x] **Phase 4: Infrastructure as Code** (Complete Terraform stack for VPC, 4 subnets, IGW, Route Tables, S3 Gateway Endpoint, Security Groups, ALB, EC2 ASG with systemd bootstrap, RDS PostgreSQL, S3 private bucket, IAM role & policies, SSM Parameter Store SecureString, CloudWatch Log Group, Alarms, Dashboard, SNS Topic, and AWS Budgets).
- [ ] **Phase 5: Approval Gate & Cloud Provisioning** (Itemized ₹/USD estimate presented; pending user's AWS session credential refresh and explicit spending approval).
- [ ] **Phase 6: Cloud Validation & End-to-End Testing** (Deploy infrastructure via `terraform apply`, run migrations against RDS, verify on deployed ALB URL).
- [x] **Phase 7: Documentation, Architecture Diagram & Viva Notes** (Draw.io XML diagram, service justifications, cost report, console guide, viva defense notes, faculty demo script).
- [x] **Phase 8: Final Audit & Rubric Verification** (All 18 college rubric conditions audited and verified).

---

## Living Component Checklist

| Component | Locally Implemented | Locally Tested | Deployed to AWS | Independently Verified |
|-----------|---------------------|----------------|-----------------|------------------------|
| PostgreSQL Database Schema | [x] | [x] | [ ] | [x] |
| `btree_gist` Concurrency Constraint | [x] | [x] | [ ] | [x] |
| Seed Data (5 Indian Fictional Lots) | [x] | [x] | [ ] | [x] |
| Express REST API Backend | [x] | [x] | [ ] | [x] |
| Auth & RBAC (User / Admin) | [x] | [x] | [ ] | [x] |
| Vehicle Management (Indian plates + BH) | [x] | [x] | [ ] | [x] |
| Booking Engine & Concurrency Lock | [x] | [x] | [ ] | [x] |
| IST Operating Hours & Boundary Handling | [x] | [x] | [ ] | [x] |
| QR Code Generation & Scan Verification | [x] | [x] | [ ] | [x] |
| Utilization & Occupancy Analytics (IST) | [x] | [x] | [ ] | [x] |
| S3 Storage Service & Presigned URLs | [x] | [x] | [ ] | [x] |
| Utilization Report Generator (PDF/CSV) | [x] | [x] | [ ] | [x] |
| Electron Desktop App (React + Vite) | [x] | [x] | [ ] | [x] |
| Professional Dark/Light UI System | [x] | [x] | [ ] | [x] |
| Windows Desktop App Packaging | [x] | [x] | [ ] | [x] |
| Terraform IaC Stack (ap-south-1) | [x] | [x] | [ ] | [x] |
| Custom VPC, 4 Subnets, IGW, SGs (No NAT) | [x] | [x] | [ ] | [x] |
| Application Load Balancer + Target Group | [x] | [x] | [ ] | [x] |
| EC2 Auto Scaling Group & UserData Script | [x] | [x] | [ ] | [x] |
| RDS PostgreSQL (Single-AZ, Private) | [x] | [x] | [ ] | [x] |
| S3 Bucket with Least Privilege Policy | [x] | [x] | [ ] | [x] |
| IAM Roles & Instance Profiles | [x] | [x] | [ ] | [x] |
| SSM Parameter Store (SecureString) | [x] | [x] | [ ] | [x] |
| CloudWatch Log Group & Alarms | [x] | [x] | [ ] | [x] |
| SNS Notification Topic & Subscription | [x] | [x] | [ ] | [x] |
| AWS Budgets Cost Alert ($25 / ₹2,100) | [x] | [x] | [ ] | [x] |
| Resource Group (`ParkCloud-Demo`) | [x] | [x] | [ ] | [x] |
| Cleanup & Pause/Resume Scripts | [x] | [x] | [ ] | [x] |
