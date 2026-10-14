# ParkCloud Viva Examination & Technical Defense Guide

**Student Quick-Reference for Project Viva & Faculty Evaluation**

---

### Q1: What is the core problem statement of ParkCloud?
**A:** Indian metropolitan cities (Mumbai, Pune, Bengaluru) face severe traffic congestion caused by vehicles circling commercial complexes, railway stations, and IT parks searching for parking. ParkCloud solves this by providing real-time slot availability, guaranteed double-booking prevention, multi-vehicle support (2-wheelers, cars, EVs, autos), and instant QR passes.

---

### Q2: Why did you choose EC2 instead of a 100% serverless (Lambda + API Gateway) architecture?
**A:** 
1. **Rubric Compliance:** Rubric Condition 2 explicitly mandates that the core backend must run on EC2 instances and cannot be fully serverless.
2. **Predictable Performance:** Dedicated Node.js instances avoid Lambda cold-start latency, which is critical for real-time boom-barrier scan verification.
3. **Connection Pooling:** Long-lived PostgreSQL connection pools (`pg.Pool`) are far more efficient on persistent EC2 instances than spawning ephemeral Lambda connections that can exhaust RDS database connection limits.

---

### Q3: How do you prevent double-booking when multiple users book the same slot simultaneously?
**A:** We use a two-layer defense mechanism:
1. **Row-Level Transaction Locking:** The API backend initiates a PostgreSQL transaction (`BEGIN`) and locks the requested slot using `SELECT ... FROM parking_slots WHERE id = $1 FOR UPDATE`. This serializes concurrent requests for the same slot.
2. **Database-Level Exclusion Constraint (`btree_gist`):** Even if two application threads attempt simultaneous inserts, PostgreSQL enforces our table constraint:
   ```sql
   CONSTRAINT exclude_slot_time_overlap EXCLUDE USING gist (
       slot_id WITH =,
       tstzrange(start_time, end_time, '[)') WITH &&
   ) WHERE (status IN ('CONFIRMED', 'ACTIVE'));
   ```
   PostgreSQL mathematically rejects any overlapping `tstzrange` interval on the same slot, throwing error code `23P01`, which our API maps to a clean `409 Conflict`. Frontend checks are never trusted.

---

### Q4: Why did you choose Amazon RDS for PostgreSQL over DynamoDB or MongoDB?
**A:** Smart parking booking is fundamentally relational and requires strict ACID compliance. Slot reservation, user vehicles, parking sessions, and audit logs require foreign key referential integrity. Most importantly, PostgreSQL's GiST index and range types (`tstzrange`) provide native temporal exclusion constraints that NoSQL databases cannot enforce without complex custom locking logic.

---

### Q5: Why is the RDS database placed in a private subnet?
**A:** Defense-in-depth security. By placing RDS in private subnets with no route to the Internet Gateway (`0.0.0.0/0`) and setting `publicly_accessible = false`, the database cannot be reached directly from the internet. In addition, its Security Group accepts inbound traffic on port 5432 strictly from the EC2 application instances.

---

### Q6: What is the difference between Public and Private subnets in your VPC?
**A:**
- **Public Subnets:** Associated with a route table containing a route to the Internet Gateway (`0.0.0.0/0 -> igw`). Resources with public IPs can receive and transmit internet traffic.
- **Private Subnets:** Associated with a route table with no route to the Internet Gateway. Resources in private subnets cannot communicate directly with the public internet.

---

### Q7: Why is there NO NAT Gateway in your architecture?
**A:** A single AWS NAT Gateway costs ~$0.045/hour plus data processing fees (~$32.40/month or ~₹2,738/month). Since our project operates under a strict ~$90-$100 student credit budget, provision of NAT Gateways across two AZs would quickly consume ~65% of the budget. Instead, our EC2 instances live in public subnets with public IPs for outbound access (e.g. package updates, SSM, CloudWatch), but their Security Group blocks all inbound internet traffic, accepting port 5000 exclusively from the ALB. S3 is accessed via a free S3 Gateway VPC Endpoint.

---

### Q8: What does the Application Load Balancer (ALB) do?
**A:** The ALB sits in front of the EC2 instances across both Availability Zones (`ap-south-1a` and `ap-south-1b`). It provides a single stable DNS entrypoint, performs continuous health checks on `/api/health`, automatically diverts traffic away from degraded instances, and distributes client traffic evenly.

---

### Q9: How does EC2 Auto Scaling work in your deployment?
**A:** Auto Scaling maintains a minimum of 1, desired capacity of 1, and maximum of 2 instances. We configured a Target Tracking Scaling Policy based on `ASGAverageCPUUtilization` set to 60%. If traffic surges and average CPU exceeds 60%, the Auto Scaling Group automatically provisions an additional instance from our Launch Template and attaches it to the ALB target group.

---

### Q10: How did you eliminate hardcoded AWS credentials?
**A:** We use **IAM Roles and Instance Profiles**. The EC2 instance assumes `ParkCloudEC2Role`. When the Node.js backend initializes the AWS SDK (S3, SSM, CloudWatch, SNS), the SDK automatically retrieves short-lived temporary security credentials from the EC2 Instance Metadata Service (IMDSv2). No AWS access keys or secret keys exist in the source code or git history.

---

### Q11: How are sensitive parameters like database passwords managed?
**A:** They are stored in **AWS Systems Manager (SSM) Parameter Store** under namespaced paths (e.g., `/parkcloud/demo/db/password`) using the `SecureString` type, which encrypts values with AWS KMS. The EC2 instance fetches them during startup using the AWS CLI and decrypts them in-memory.

---

### Q12: How are CloudWatch and SNS integrated?
**A:** CloudWatch monitors system metrics (EC2 CPU utilization, ALB target health) and application logs (`/parkcloud/app-logs`). We configured two CloudWatch Alarms:
1. `ParkCloud-HighCPU-Alarm`: Triggers if CPU > 70% for 5 minutes.
2. `ParkCloud-UnhealthyTargets-Alarm`: Triggers if ALB healthy host count drops.
When an alarm state transitions to `ALARM`, it publishes an alert message to an Amazon SNS topic (`parkcloud-alerts-topic`), which instantly delivers an email notification to the subscribed administrator.

---

### Q13: Does AWS Budgets automatically cap spending or stop instances?
**A:** **No.** AWS Budgets sends early warning alert notifications via email when actual or forecasted spend crosses specified thresholds (50%, 80%, 100% of our $25 limit). It does not automatically shut down resources by default. Immediate manual or scripted action (such as running our `scripts/pause.ps1` script) is required to stop compute resources.

---

### Q14: How are analytics calculated for Indian users?
**A:** All timestamps are stored in UTC in PostgreSQL for standard timekeeping. Analytical queries use PostgreSQL's `AT TIME ZONE 'Asia/Kolkata'` to group bookings by hour-of-day and day-of-week in Indian Standard Time (IST, UTC+05:30). Fees are calculated and stored in integer paise (never floating-point numbers) and formatted using the `en-IN` locale (lakh/crore grouping: ₹1,25,000.50).

---

### Q15: Why did you deploy in `ap-south-1` (Mumbai)?
**A:** 
1. **Low Latency:** Physical proximity to Indian users minimizes round-trip latency (< 30ms across India).
2. **Data Residency:** Keeps parking operational and vehicle telemetry within Indian borders in compliance with the principles of the India Digital Personal Data Protection (DPDP) Act, 2023.
3. **Full Service Availability:** Every required AWS service (VPC, EC2 Graviton/x86, RDS Postgres, S3, IAM, SSM, CloudWatch, SNS, ALB, ASG, Budgets) is fully supported in Mumbai.

---

### Q16: What are the current limitations of your system?
**A:**
1. **Single-AZ RDS:** To stay within student credits, RDS is provisioned in Single-AZ mode rather than Multi-AZ with automated standby failover.
2. **Minimum ASG Capacity 1:** Desired capacity is set to 1 instance. If that single instance fails, there is a 2-3 minute downtime while Auto Scaling replaces it.
3. **Demo Payments:** Payment gateway integration is mocked; fees are labeled as estimated/accrued demo fees with 18% GST rather than initiating actual UPI/card debits.
