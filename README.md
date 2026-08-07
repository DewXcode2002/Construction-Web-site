# Rohana Construction Management System

A modern, role-based Web Application designed for **Rohana Construction** to manage construction estimate requests, project tracking, employee attendance/salaries, and customer-admin communications.

The application is split into a **React + Vite** frontend and a **Node.js + Express + SQLite** backend.

---

## 🚀 Features

### 👤 Customer Portal
*   **House Plan Browser:** Explore pre-designed architectural plans with description, structure, and base cost details.
*   **Dynamic Cost Estimator:** Calculate dynamic estimates for multiple service categories (Residential Construction, Commercial Buildings, Renovation, Painting, Landscaping, Plumbing, Electrical, etc.) based on parameters like land size (in perches), bedrooms, bathrooms, and material qualities (Premium Wood, Luxury Tiles, Eco Paint, etc.).
*   **Estimate Request Submission:** Request official estimates, upload custom design blueprints (PDF/image files), and pay an processing fee (LKR 1,500).
*   **Budget Acceptance:** Review and accept detailed, official budget PDFs uploaded by the administrator.
*   **Real-time Progress Tracker:** Track active building progress across phases (Foundation, Walls, Roofing, Painting, Completed) on an interactive progress tracker.

### 👷 Employee Portal
*   **Skilled Worker Registration:** Register with specified skills (Tile, House wiring, Painting, Masonry work, Gardening, Roofing, Carpentry), national identity (NIC), and experience.
*   **Check-in & Check-out System:** Clock in and clock out daily, recording timestamps.
*   **Dynamic Salary Tracker:** Auto-generates monthly wage records based on daily rates and validated attendance logs.
*   **Site Schedule:** View assigned project sites, details, and active progress.

### 👑 Admin Dashboard
*   **Overview Metrics & Analytics:** View key operational metrics (Total Customers, Pending/Active Employees, Active/Completed Projects, Pending Estimates) represented visually with graphs (Chart.js).
*   **Worker Approval:** Approve or reject worker registrations and set their daily wage rates.
*   **Estimate Management:** Review incoming customer requests, calculate final budgets, and upload company budget sheets (PDFs) for client approval.
*   **Project Assignment:** Assign approved workers to active building projects, adjust progress percentages, and manage construction phases.

### 💬 Messaging System
*   **Direct Chat:** Facilitates direct messaging between users (e.g., Customer to Admin) for negotiations and project communications.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework:** React 19 (JavaScript)
*   **Bundler:** Vite
*   **Styling:** TailwindCSS v4
*   **Icons:** Lucide React
*   **Charts:** Chart.js & React-chartjs-2

### Backend
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** SQLite3 (Serverless SQL Database)
*   **Authentication:** JSON Web Tokens (JWT) & bcryptjs (Password Hashing)
*   **File Uploads:** Multer

---

## 📊 Database Schema

The database uses SQLite with the following core tables:

1.  `users`: Stores credentials, emails, and roles (`customer`, `employee`, `admin`).
2.  `customers`: Customer profile details (name, phone, address).
3.  `employees`: Employee details, skills, experience, approval status, and daily rate.
4.  `projects`: Active building projects, location, current phase, progress %, and assigned workers.
5.  `house_plans`: Seeding/catalog of default architectural plans.
6.  `estimates`: Detailed customer request specifications, customized costs, payment logs, and paths to custom uploaded plan blueprints and admin budget PDFs.
7.  `attendance`: Daily check-in/out log for workers.
8.  `salary`: Tracks monthly base salary, bonuses, overtime, and payout status.
9.  `messages`: Chat records between users.

---

## ⚙️ Installation & Setup

### Prerequisites
*   Node.js (v16 or higher)
*   npm (v7 or higher)

### Setup the Backend
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the backend server:
    ```bash
    npm run dev
    ```
    *The database will be automatically initialized and seeded with an admin user (`admin` / `admin123`) and basic house plans.*

### Setup the Frontend
1.  Navigate to the frontend directory:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite dev server:
    ```bash
    npm run dev
    ```

---

## 🔐 Default Credentials (Seeded Data)

*   **Administrator Account:**
    *   **Username:** `admin`
    *   **Password:** `admin123`
