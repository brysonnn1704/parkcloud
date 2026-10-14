# Service Justification Matrix — ParkCloud (India Edition)

This document satisfies Rubric Condition 10, 11, 12, and 15 by defining the exact role, architectural justification, integration pattern, failure impact, and verifiable evidence for all 9 integrated AWS services.

---

### 1. Amazon Elastic Compute Cloud (EC2) & Auto Scaling Group
- **Cloud Area:** Compute
- **What it does:** Hosts the ParkCloud Node.js/Express REST API backend as a `systemd` daemon on Amazon Linux 2023.
- **Why ParkCloud needs it:** Serves dynamic transactional endpoints, executes the server-side fee calculation in INR paise, processes QR passes, and manages concurrency locks.
- **Why not serverless / Lambda:** College Rubric Rule 2 strictly mandates that the main application backend must run on EC2 instances and cannot be fully serverless.
- **Integration:** Placed in public subnets behind the ALB; Security Group accepts traffic on port 5000 strictly from the ALB Security Group. Auto Scaling scales between 1 and 2 instances based on CPU Target Tracking (60%).
- **What breaks if removed:** The entire REST API becomes unavailable; desktop clients cannot authenticate or create bookings.
- **Rubric Conditions Satisfied:** 1, 2, 10, 11, 15.

---

### 2. Amazon Virtual Private Cloud (VPC), Subnets, Route Tables & IGW
- **Cloud Area:** Networking
- **What it does:** Provides an isolated software-defined network (`10.0.0.0/16`) spanning two Availability Zones (`ap-south-1a` and `ap-south-1b`).
- **Why ParkCloud needs it:** Enforces strict perimeter isolation. Public subnets host the ALB and EC2 instances, while private subnets isolate the RDS database with zero inbound or outbound internet routes.
- **Architectural Decision (No NAT Gateway):** NAT Gateways cost ~$0.045/hour (~$32.40/month or ~₹2,730/month) plus data charges. To stay within the $90-$100 credit budget, EC2 instances reside in public subnets with public IPs for outbound package access, but their Security Group blocks all inbound internet traffic, accepting port 5000 only from the ALB.
- **What breaks if removed:** No network segmentation or database isolation; resources cannot communicate securely.
- **Rubric Conditions Satisfied:** 3, 10, 15, 17.

---

### 3. Amazon RDS for PostgreSQL
- **Cloud Area:** Database
- **What it does:** Managed relational database storing users, vehicles, parking lots, slots, bookings, sessions, and audit logs.
- **Why ParkCloud needs it:** Authoritative persistence for smart parking data. Utilizes PostgreSQL's `btree_gist` extension to enforce mathematical time-interval exclusion (`exclude_slot_time_overlap`), preventing double-bookings.
- **Integration:** Multi-subnet private DB Subnet Group across `ap-south-1a` and `ap-south-1b`. Security Group restricts port 5432 exclusively to EC2 app instances.
- **What breaks if removed:** Complete loss of user accounts, vehicles, lot configurations, and booking records.
- **Rubric Conditions Satisfied:** 1, 4, 10, 14, 15.

---

### 4. Amazon Simple Storage Service (S3) & Gateway VPC Endpoint
- **Cloud Area:** Storage
- **What it does:** Private object storage for lot images and generated utilization audit reports (PDF & CSV).
- **Why ParkCloud needs it:** Enables persistent document storage without bloating PostgreSQL relational tables with binary blobs. Connected via a free S3 Gateway VPC Endpoint.
- **Integration:** EC2 instance role generates temporary 15-minute Pre-signed URLs for authenticated desktop clients to download reports securely.
- **What breaks if removed:** Report generation and parking lot photo attachments fail.
- **Rubric Conditions Satisfied:** 5, 10, 15.

---

### 5. AWS Identity and Access Management (IAM)
- **Cloud Area:** Security
- **What it does:** Dedicated role `ParkCloudEC2Role` and instance profile granting fine-grained, least-privilege permissions to the EC2 instances.
- **Why ParkCloud needs it:** Eliminates hardcoded AWS access keys and secret keys from code, Git repositories, and desktop builds.
- **Integration:** Role policy strictly scopes actions: `s3:*` on the specific ParkCloud bucket prefix, `ssm:GetParameter*` on `/parkcloud/*`, `logs:*` on `/parkcloud/*`, and `sns:Publish` to the alert topic.
- **What breaks if removed:** EC2 backend cannot read secrets from SSM or stream reports to S3.
- **Rubric Conditions Satisfied:** 6, 10, 15.

---

### 6. AWS Systems Manager (SSM) Parameter Store
- **Cloud Area:** Security / Configuration Management
- **What it does:** Stores sensitive configuration parameters (database master password, JWT signing secret) as encrypted `SecureString` types.
- **Why ParkCloud needs it:** Ensures zero secrets in code or environment files checked into Git.
- **Integration:** Instances read parameters securely during bootstrap and boot without exposing secrets in logs.
- **What breaks if removed:** Backend cannot decrypt database credentials and fails to start.
- **Rubric Conditions Satisfied:** 7, 10, 15.

---

### 7. Amazon CloudWatch (Logs, Custom Metrics, Alarms, Dashboard)
- **Cloud Area:** Monitoring & Operations
- **What it does:** Collects system and application logs (`/parkcloud/app-logs`), tracks custom metrics (`LotOccupancyRate`, `BookingsPerMinute`), evaluates alarm thresholds, and renders an operational dashboard.
- **Why ParkCloud needs it:** High CPU alarm (>70% for 5 mins) and ALB Unhealthy Host alarm automatically notify administrators of infrastructure degradation.
- **Integration:** Alarms trigger SNS notifications to email.
- **What breaks if removed:** Operations team has zero visibility into server crashes, target health, or traffic spikes.
- **Rubric Conditions Satisfied:** 8, 10, 15.

---

### 8. Amazon Simple Notification Service (SNS)
- **Cloud Area:** Application Integration / Messaging
- **What it does:** Manages topic `parkcloud-alerts-topic` and publishes critical alerts to subscribed administrative emails.
- **Why ParkCloud needs it:** Delivers real-time email notifications when CloudWatch alarms breach thresholds or when lots exceed 90% occupancy.
- **Integration:** Integrated with CloudWatch alarms and application-level threshold checks.
- **What breaks if removed:** Infrastructure failures occur silently without alerting administrators.
- **Rubric Conditions Satisfied:** 8, 10, 11, 15.

---

### 9. Application Load Balancer (ALB)
- **Cloud Area:** Networking / Load Balancing
- **What it does:** Distributes incoming traffic across EC2 instances in multiple AZs with continuous health checking on `/api/health`.
- **Why ParkCloud needs it:** Decouples the desktop client from specific EC2 IP addresses and provides automatic target failover.
- **Integration:** Spans public subnets across `ap-south-1a` and `ap-south-1b`. Forwards port 80 traffic to target group on port 5000.
- **What breaks if removed:** Desktop client must connect directly to instance IPs; zero redundancy or zero-downtime rolling updates.
- **Rubric Conditions Satisfied:** 1, 10, 11, 15.

---

### 10. AWS Budgets
- **Cloud Area:** Cost Governance
- **What it does:** Monitors total account spend against a strict $25 USD (~₹2,100 INR) threshold.
- **Why ParkCloud needs it:** Protects student AWS credits ($90-$100 limit) by triggering email alerts at 50%, 80%, and 100% of the forecast budget.
- **What breaks if removed:** Accidental resource misconfigurations could exhaust student credits undetected.
- **Rubric Conditions Satisfied:** 9, 10, 15.
