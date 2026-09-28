# IMPLEMENTATION_PLAN.md — Technical Architecture & Execution Roadmap

**Project**: Hemocare Management System — Smart Blood Donation & Emergency Response Platform  
**Target Architecture**: Scalable, Multi-Role, AI-Assisted Clinical Blood Management System  

---

## 1. System Architecture Overview

```
                      +------------------------------------------+
                      |         React 18 + Vite PWA              |
                      | (Admin, Donor, Hospital, Patient, ECC)   |
                      +--------------------+---------------------+
                                           |
                                      REST APIs
                                           v
+-----------------------------------------------------------------------------------+
|                              Express API Gateway                                  |
|  +---------------------+  +----------------------+  +-------------------------+  |
|  | Auth Middleware     |  | Role Verification    |  | Rate Limit / Safety     |  |
|  +---------------------+  +----------------------+  +-------------------------+  |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                            Core Rule Engines (Deterministic)                      |
|  +-------------------------------+    +----------------------------------------+  |
|  |  BloodCompatibilityEngine     |    |  DonorEligibilityEngine                |  |
|  +-------------------------------+    +----------------------------------------+  |
|  +-------------------------------+    +----------------------------------------+  |
|  |  DonorReliabilityEngine       |    |  GeoMatchingEngine (Haversine)         |  |
|  +-------------------------------+    +----------------------------------------+  |
|  +-------------------------------+    +----------------------------------------+  |
|  |  FEFOInventoryEngine          |    |  ExpiryManagementService               |  |
|  +-------------------------------+    +----------------------------------------+  |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                        Intelligence & Response Layer                              |
|  +-------------------------------+    +----------------------------------------+  |
|  | SmartDonorRecommendationEngine|    |  EmergencyResponseEngine               |  |
|  +-------------------------------+    +----------------------------------------+  |
|  +-------------------------------+    +----------------------------------------+  |
|  |  DemandAnalyticsService       |    |  DemandPredictionService               |  |
|  +-------------------------------+    +----------------------------------------+  |
|  +-------------------------------+                                                |
|  |  BloodCareAIChatbot           |                                                |
|  +-------------------------------+                                                |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                         Prisma ORM & SQLite Database                              |
| (users, hospitals, blood_units, blood_requests, donations, notifications, audit)  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Proposed Database Schema Extension (`schema.prisma`)

We will safely extend the existing `schema.prisma` without breaking existing tables or fields:

```prisma
// Extended Role Enum
// Existing: ADMIN, DONOR, PATIENT. Extended: HOSPITAL
enum Role {
  ADMIN
  DONOR
  PATIENT
  HOSPITAL
}

// Additional Prisma Models

model Hospital {
  id                String         @id @default(uuid())
  name              String
  address           String
  latitude          Float
  longitude         Float
  contact_number    String
  emergency_contact String
  is_verified       Boolean        @default(true)
  is_active         Boolean        @default(true)
  created_at        DateTime       @default(now())
  updated_at        DateTime       @updatedAt

  users             User[]         @relation("HospitalUsers")
  requests          BloodRequest[] @relation("HospitalRequests")

  @@map("hospitals")
}

model BloodUnit {
  id              String   @id @default(uuid())
  blood_group     String   // A_POS, A_NEG, B_POS, B_NEG, AB_POS, AB_NEG, O_POS, O_NEG
  component_type  String   @default("RBC") // RBC, PLASMA, PLATELETS, WHOLE_BLOOD
  collection_date DateTime
  expiry_date     DateTime
  volume_ml       Int      @default(450)
  donation_id     String?
  storage_location String  @default("Main Cold Storage Vault A")
  status          String   @default("AVAILABLE") // AVAILABLE, RESERVED, EXPIRING_SOON, EXPIRED, USED, DISCARDED
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  donation        Donation? @relation(fields: [donation_id], references: [id], onDelete: SetNull)

  @@map("blood_units")
}

model DonorProfile {
  id                     String    @id @default(uuid())
  user_id                String    @unique
  latitude               Float?
  longitude              Float?
  last_location_update   DateTime?
  service_radius_km      Float     @default(25.0)
  availability_status    Boolean   @default(true)
  deferral_status        String    @default("ELIGIBLE") // ELIGIBLE, TEMPORARILY_INELIGIBLE, PERMANENTLY_DEFERRED, REQUIRES_MEDICAL_REVIEW
  deferral_reason        String?
  deferral_until         DateTime?
  total_donations_count  Int       @default(0)
  last_donation_date     DateTime?
  reliability_score      Float     @default(100.0)
  response_rate          Float     @default(100.0)
  acceptance_rate        Float     @default(100.0)
  created_at             DateTime  @default(now())
  updated_at             DateTime  @updatedAt

  user                   User      @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@map("donor_profiles")
}

model DonorMatch {
  id                   String       @id @default(uuid())
  request_id           String
  donor_id             String
  distance_km          Float
  compatibility_reason String
  eligibility_status   String
  reliability_score    Float
  ranking_score        Float
  notification_status  String       @default("PENDING") // PENDING, NOTIFIED, ACCEPTED, DECLINED, EXPIRED
  created_at           DateTime     @default(now())

  request              BloodRequest @relation(fields: [request_id], references: [id], onDelete: Cascade)
  donor                User         @relation(fields: [donor_id], references: [id], onDelete: Cascade)

  @@map("donor_matches")
}

model Notification {
  id         String   @id @default(uuid())
  user_id    String
  title      String
  message    String
  type       String   // EMERGENCY_REQUEST, ELIGIBILITY_REMINDER, DONATION_REMINDER, SHORTAGE_ALERT, EXPIRY_WARNING
  is_read    Boolean  @default(false)
  metadata   String?  // JSON string
  created_at DateTime @default(now())

  user       User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@map("notifications")
}

model AuditEvent {
  id          String   @id @default(uuid())
  event_type  String
  severity    String   // info, success, warning, critical
  message     String
  details     String?
  actor       String
  created_at  DateTime @default(now())

  @@map("audit_events")
}
```

---

## 3. Phase-by-Phase Technical Blueprint

### Phase 1 — Blood Compatibility Engine
* **File**: `server/src/services/BloodCompatibilityEngine.ts`
* **Logic**: Deterministic ABO & Rh compatibility matrix for Red Blood Cells (RBC).
* **API / Service Methods**:
  * `canDonate(donorGroup: BloodGroup, recipientGroup: BloodGroup): CompatibilityResult`
  * `getCompatibleDonorGroups(recipientGroup: BloodGroup): BloodGroup[]`
  * `getCompatibleRecipientGroups(donorGroup: BloodGroup): BloodGroup[]`
* **Unit Tests**: Full cross-table test of all 64 blood group pairings.

### Phase 2 — Donor Eligibility Engine
* **File**: `server/src/services/DonorEligibilityEngine.ts`
* **Logic**: Rule evaluation for 56-day donation interval, active temporary/permanent deferrals, medical review flags.
* **Statuses**: `ELIGIBLE`, `TEMPORARILY_INELIGIBLE`, `PERMANENTLY_DEFERRED`, `REQUIRES_MEDICAL_REVIEW`.
* **Override Support**: Authorized medical override with audit log entry.

### Phase 3 — Smart Blood Unit / Batch Inventory (FEFO)
* **File**: `server/src/services/FEFOInventoryEngine.ts`
* **Logic**: First Expire -> First Out allocation. Maintains backward-compatible aggregate totals while dispatching exact traceable unit IDs.
* **Statuses**: `AVAILABLE`, `RESERVED`, `EXPIRING_SOON`, `EXPIRED`, `USED`, `DISCARDED`.

### Phase 4 — Smart Blood Expiry Management
* **File**: `server/src/services/ExpiryManagementService.ts`
* **Logic**: Automated evaluation of unit shelf-life (RBC 35-42 days).
* **Thresholds**: Normal (>10d), Expiring Soon (3-10d), High Priority (0-3d), Expired (<0d).
* **Analytics**: Wastage rates, expiring unit forecasts.

### Phase 5 — Hospital Management Module
* **Files**: `server/src/controllers/hospital.controller.ts`, `server/src/routes/hospital.routes.ts`
* **Features**: Hospital entity registration, verification status, contact numbers, geo-location, dedicated hospital API endpoints.

### Phase 6 — Geo-Location Donor Matching
* **File**: `server/src/services/GeoMatchingEngine.ts`
* **Logic**: Haversine formula distance computation. Radius filter steps: `0-5km`, `5-10km`, `10-25km`, `25km+`.
* **Privacy Guard**: Exact coordinates kept server-side; frontend receives distance rounded to 1 decimal place.

### Phase 7 — Donor Reliability Score
* **File**: `server/src/services/DonorReliabilityEngine.ts`
* **Metrics**: Response rate, acceptance rate, completed donation rate, no-show rate, profile verification status.
* **Score**: Transparent 0–100 numerical score with detailed score breakdown.

### Phase 8 — Smart Donor Recommendation Engine
* **File**: `server/src/services/SmartDonorRecommendationEngine.ts`
* **Pipeline**: Blood Request -> Compatibility Filter -> Eligibility Filter -> Availability Filter -> Geo Radius -> Reliability Ranking -> Top Recommendations with explicit reasons.

### Phase 9 — Intelligent Emergency Response Engine
* **File**: `server/src/services/EmergencyResponseEngine.ts`
* **Workflow**: Unified central orchestrator for STAT Critical, Urgent, and Standard requests. Automatically executes FEFO stock allocation + recommended donor notification dispatch.

### Phase 10 — Intelligent Notification System
* **File**: `server/src/services/NotificationService.ts`
* **Architecture**: Event-driven notification dispatch supporting in-app database notifications, SSE/polling telemetry feeds, and extensible provider interfaces.

### Phase 11 — Blood Demand Analytics
* **File**: `server/src/services/DemandAnalyticsService.ts`
* **Metrics**: Request volume, fulfillment rate, average fulfillment speed, shortage frequency by blood group and hospital, inventory utilization rate.

### Phase 12 — Blood Demand Prediction
* **File**: `server/src/services/DemandPredictionService.ts`
* **Algorithm**: Statistical moving average & exponential smoothing over historical request logs. Generates 7-day & 30-day forecasted demand per blood group with confidence intervals.

### Phase 13 — Rule-Bound AI Chatbot
* **File**: `server/src/services/BloodCareAIChatbot.ts` & `client/src/components/chat/BloodCareChatbot.tsx`
* **Safety Guards**: Strict system prompt enforcing non-medical diagnostic boundaries. Directs emergency cases to hospital services while assisting users with platform features.

### Phase 14 — Emergency Command Center Upgrade
* **Files**: `client/src/pages/EmergencyCommandCenter.tsx` & subcomponents
* **Features**: Live display of active emergencies, compatible stock, recommended donors, expiring units, demand analytics tab, donor dispatch controls.

### Phase 15 — Progressive Web App (PWA)
* **Files**: `client/public/manifest.json`, `client/src/sw.ts`, `client/vite.config.ts`
* **Features**: Web App Manifest, Service Worker caching static assets, installable app banner, offline request draft safety handling.

---

## 4. API Endpoints Map

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/inventory
GET    /api/inventory/units           (Batch unit breakdown)
POST   /api/inventory/units           (Add batch unit)
GET    /api/inventory/expiry-alerts    (Expiring/expired units)

GET    /api/requests
POST   /api/requests
GET    /api/requests/:id
PUT    /api/requests/:id/fulfill
PUT    /api/requests/:id/reject

POST   /api/emergency/dispatch        (Trigger emergency response engine)
GET    /api/emergency/recommend-donors (Get ranked donor matches)

GET    /api/hospitals
POST   /api/hospitals
GET    /api/hospitals/:id/dashboard

GET    /api/donors/eligibility
PUT    /api/donors/location
GET    /api/donors/reliability

GET    /api/analytics/demand
GET    /api/analytics/forecast

POST   /api/chatbot/message

GET    /api/notifications
PUT    /api/notifications/:id/read
```

---

## 5. Automated Test Suite Strategy

* **Test Framework**: Vitest or Node Test Runner.
* **Target Coverage**:
  1. `BloodCompatibilityEngine.test.ts`: Test all 64 donor-recipient blood group combinations.
  2. `DonorEligibilityEngine.test.ts`: Test eligible, 56-day interval violation, temporary deferral, permanent deferral, medical review.
  3. `FEFOInventoryEngine.test.ts`: Test FEFO sorting, batch reservation, stock deduction, insufficient stock rejection.
  4. `GeoMatchingEngine.test.ts`: Test Haversine distance calculations and radius filter bounds.
  5. `SmartDonorRecommendationEngine.test.ts`: Multi-factor donor ranking accuracy.
  6. `EmergencyResponseEngine.test.ts`: End-to-end critical request workflow simulation.
