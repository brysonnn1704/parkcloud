# ParkCloud Faculty Live Demonstration Script

**Walkthrough Guide for 10-Minute Project Evaluation**

---

### Step 1: Launch the Desktop Application
1. Launch the standalone desktop application from:
   `parkcloud/frontend/dist_electron/win-unpacked/ParkCloud.exe`
2. Point out that this is an **installable desktop application (Electron + React)** packaged natively for Windows, not a browser webpage.
3. Show the sleek dark mode interface with the **India Edition** badge and theme toggle (Sun/Moon).

---

### Step 2: User Authentication & Profile
1. Click **Sign In** on the top right.
2. Click the **"Demo User (Rahul)"** one-click fill pill to auto-populate credentials (`rahul.sharma@example.com` / `User@ParkCloud2026!`).
3. Click **Sign In**.
4. Point out that the session is secured with **HttpOnly cookies and JWT**, preventing cross-site scripting token theft.

---

### Step 3: Indian Metro Parking Locations
1. Navigate to **Find Parking** in the navigation bar.
2. Filter lots by city using the quick pills: **Mumbai**, **Pune**, **Thane**, **Vasai-Virar**, **Bengaluru**.
3. Point out Indian localization:
   - Pricing in **₹/hour** broken down by vehicle type (Two-Wheeler ₹20/hr, Four-Wheeler ₹50/hr, EV ₹40/hr).
   - Operating hours displayed in **Asia/Kolkata (IST)**.
   - Pincodes and localized addresses (e.g. Kurla LBS Marg, Station Road Navghar).

---

### Step 4: Visual Slot Grid & Real-Time Availability
1. Click **"View Slots & Book"** on **Phoenix Marketcity Mall Smart Lot**.
2. Notice the visual slot map:
   - **Green slots:** Available for booking.
   - **Red slots:** Already occupied/booked during that time window.
   - **Purple slots:** Dedicated EV fast charging bays with chargers.
3. Change the time window and observe the slots update dynamically based on database interval queries.

---

### Step 5: Reserve a Slot & Concurrency Lock
1. Click an available slot (e.g. **Slot P1-05**).
2. The **Confirm Parking Reservation** modal appears:
   - Select Rahul's registered vehicle (e.g., `MH02DE4567` or `22BH1234AA`).
   - Notice the fee breakdown in **₹**: Base parking fee + clearly labeled **Demo 18% GST**.
3. Click **"Confirm & Generate Pass"**.
4. The system executes a PostgreSQL transaction with **`SELECT ... FOR UPDATE`** and verifies the **`btree_gist` exclusion constraint**, locking the bay.
5. A high-resolution **QR Code Pass** is instantly generated with a unique reference (`PC-...`).

---

### Step 6: Concurrency Race-Condition Proof (Viva Highlight)
1. Point out our automated test suite evidence in `docs/evidence/backend-test-results.txt`.
2. Demonstrate how 5 simultaneous requests attempting to book the exact same slot at the exact same time result in **exactly 1 success** and **4 immediate 409 Conflict rejections** due to the database exclusion constraint.

---

### Step 7: Gate Operator Check-In / Check-Out (Admin Flow)
1. Log out and click **Sign In** -> select **"Admin (ParkCloud)"** pill (`admin@parkcloud.in` / `Admin@ParkCloud2026!`).
2. Click **Admin Console** in the navigation bar.
3. In the **Gate Boom Barrier Scanner** tab, enter the booking reference from Step 5.
4. Click **"Verify & Check In (Gate Open)"**:
   - The status updates to **ACTIVE** in RDS, and a check-in timestamp session record is recorded.
5. Click **"Process Check Out"**:
   - The status updates to **COMPLETED**, finalizing the session.

---

### Step 8: Cloud Report Generation & Amazon S3 Integration
1. Click **Reports (S3)** in the navigation bar.
2. Click **"Generate PDF Audit"**:
   - The EC2 backend streams real booking records from PostgreSQL into `pdfkit`.
   - The PDF document is uploaded to the private Amazon S3 bucket (`parkcloud-storage-ap-south-1-*`) with server-side encryption (`AES256`).
3. Click **"Download"** on the generated report:
   - The application generates a temporary **15-minute S3 Pre-signed URL** via the IAM instance role.
   - The PDF opens in the viewer, displaying an official, DPDP Act-compliant utilization report.

---

### Step 9: Live Analytics, Heatmaps & Forecasting
1. Click **Analytics** in the navigation bar.
2. Point out:
   - **System Occupancy Gauge:** Real-time occupancy percentage calculated via SQL.
   - **Peak Parking Hours Distribution (IST):** 24-hour bar chart aggregated in `Asia/Kolkata` time.
   - **Utilization Heatmap:** 7-day × 24-hour matrix showing peak density in dark purple.
   - **Statistical Occupancy Forecast:** Time-series projection based on past volume (clearly marked as a statistical model, not fake AI).
   - **Accrued Demo Fees in ₹:** Accrued parking revenue with transparent formula tooltip.

---

### Step 10: AWS Management Console Verification
1. Open the AWS Console and show the **Resource Group `ParkCloud-Demo`** containing all tagged components.
2. Show **ALB Target Group** with target health = **Healthy** on `/api/health`.
3. Show **RDS PostgreSQL** database in private subnets with **Public access: No**.
4. Show **Systems Manager Parameter Store** with encrypted `SecureString` parameters.
5. Show **CloudWatch Dashboard** with CPU and occupancy widgets, and **AWS Budgets** with the $25 limit.
