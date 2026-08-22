# 🩸 Blood Bank Management System

A full-stack web application designed for managing blood donations, inventory, and emergency patient requests. Built with **Node.js**, **Express**, **PostgreSQL**, **Prisma ORM**, and **React + Tailwind CSS**.

---

## 🏗️ Project Architecture

```
├── docker-compose.yml           # Local PostgreSQL 16 container definition
├── .env.example                 # Root environment template
└── server/                      # Express & Prisma Backend
    ├── package.json             # Backend dependencies & scripts
    ├── tsconfig.json            # TypeScript configuration
    ├── .env                     # Server environment variables
    ├── prisma/
    │   ├── schema.prisma        # Prisma database schema (Enums, Models, Relations)
    │   └── seed.ts              # Seed script with test users, inventory, & requests
    ├── sql/
    │   └── schema.sql           # Raw PostgreSQL DDL script
    └── src/
        └── index.ts             # Express server entry point
```

---

## 🗄️ Database Schema Overview

### 1. Enums
- **`Role`**: `ADMIN`, `DONOR`, `PATIENT`
- **`BloodGroup`**: `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-` (mapped to `A_POS`, `A_NEG`, etc.)
- **`DonationStatus`**: `PENDING`, `APPROVED`, `REJECTED`
- **`RequestUrgency`**: `NORMAL`, `URGENT`
- **`RequestStatus`**: `PENDING`, `APPROVED`, `FULFILLED`, `REJECTED`

### 2. Tables & Relations
- **`users`**: Stores authentication and profile data for Admins, Donors, and Patients.
- **`blood_inventory`**: Tracks real-time available units per blood group.
- **`donations`**: Logs donor donation history and approval status.
- **`blood_requests`**: Handles patient/hospital blood requirement requests and fulfillment.

---

## 🚀 Quick Setup Instructions

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+ or v20+ recommended)
- [Docker](https://www.docker.com/) (optional, for running PostgreSQL locally) or an existing PostgreSQL instance.

### 2. Start PostgreSQL Database (via Docker)
```bash
# In the root directory:
docker compose up -d
```

### 3. Setup the Backend
```bash
cd server

# Install dependencies
npm install

# Push schema to database / run migrations
npm run prisma:push
# or: npx prisma migrate dev --name init

# Seed initial test data
npm run prisma:seed
```

### 4. Start the Server
```bash
npm run dev
```
The server will start at: `http://localhost:5000`  
Health check endpoint: `http://localhost:5000/api/health`

### 5. Inspect Database (Prisma Studio)
```bash
npm run prisma:studio
```
Prisma Studio UI will open at: `http://localhost:5555`

---

## 🔑 Default Seed Credentials for Testing

| Role | Email | Password | Blood Group |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@bloodbank.org` | `AdminPassword123!` | O+ |
| **Donor** | `donor.john@example.com` | `DonorPassword123!` | O+ |
| **Donor** | `donor.sarah@example.com` | `DonorPassword123!` | A+ |
| **Donor** | `donor.david@example.com` | `DonorPassword123!` | B- |
| **Donor** | `donor.priya@example.com` | `DonorPassword123!` | AB+ |
| **Patient** | `patient.alice@example.com` | `PatientPassword123!` | O- |
| **Patient** | `patient.bob@example.com` | `PatientPassword123!` | A- |
| **Patient** | `patient.emily@example.com` | `PatientPassword123!` | B+ |
