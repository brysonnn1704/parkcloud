# ParkCloud - Friend's Laptop Setup Guide (Zero-Breakage)

Welcome to **ParkCloud Smart Parking Management System (India Edition)**!

The entire backend and PostgreSQL database are hosted live on **AWS (Mumbai `ap-south-1`)** behind an Application Load Balancer. This means **your friend does NOT need to install PostgreSQL, configure AWS credentials, or set up a local backend server**. Their laptop only runs the frontend client, which connects directly to the cloud.

---

## 🚀 Choose How Your Friend Wants to Set It Up

### Method 1: Instant Desktop App (Easiest — No Node.js Needed)
If your friend just wants to view, test, or demo the application without installing coding tools:

1. Copy the folder `frontend\dist_electron\win-unpacked` to your friend's laptop (via Pendrive or Google Drive).
2. On their laptop, open the folder and double-click **`ParkCloud.exe`**.
3. The app will launch immediately with 0 configuration!

---

### Method 2: Full Codebase Setup (For Antigravity / VS Code / Development)
If your friend wants the full project to edit code, run dev mode, or submit as a pair project:

#### Step 1: Transfer the Project
* Copy the `D:\CCL\parkcloud` folder to their laptop (e.g. `C:\parkcloud` or `D:\CCL\parkcloud`).
* **Tip:** Do **NOT** copy `node_modules` folders (they are huge). Keep only the source code.

#### Step 2: One-Click Setup
In the project root, simply double-click:
```
setup-and-run.bat
```
* It will automatically check Node.js, install all frontend dependencies (`npm install`), and give you a menu to launch in the browser or as a desktop app!

#### Step 3: Manual Commands (If preferred via Terminal / PowerShell)
```powershell
cd parkcloud/frontend
npm install
npm run dev
```
* Open **`http://localhost:5173`** in Google Chrome or Edge.

---

## 🔑 Demo Login Credentials
Your friend can click the **One-Click Quick Fill** buttons on the login screen or enter:

| Role | Email | Password | What It Demonstrates |
| :--- | :--- | :--- | :--- |
| **Driver / User** | `rahul.sharma@example.com` | `User@ParkCloud2026!` | Search Mumbai/Pune/Bengaluru hubs, reserve bays, view active QR passes, download receipts |
| **Admin / Operator** | `admin@parkcloud.in` | `Admin@ParkCloud2026!` | Full admin console, real-time bay occupancy, vehicle check-in/check-out scanner |

---

## 🌐 Live AWS Cloud Endpoints
The frontend connects automatically to:
* **Load Balancer:** `http://parkcloud-alb-2029168588.ap-south-1.elb.amazonaws.com`
* **Health Check:** `http://parkcloud-alb-2029168588.ap-south-1.elb.amazonaws.com/api/health`
* **Lots API:** `http://parkcloud-alb-2029168588.ap-south-1.elb.amazonaws.com/api/lots`
