export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';

export type HospitalWard =
  | 'ICU (Intensive Care)'
  | 'Emergency / Trauma'
  | 'Operating Theater (OT)'
  | 'Oncology'
  | 'General Surgical'
  | 'Pediatric ICU (PICU)'
  | string;

export type UrgencyLevel = 'STANDARD' | 'URGENT' | 'STAT_CRITICAL';

export type RequisitionStatus = 'PENDING' | 'FULFILLED' | 'CANCELLED';

export interface BloodInventoryItem {
  bloodGroup: BloodGroup;
  units: number;
  capacity: number;
  minThreshold: number;
  lastUpdated: string;
}

export interface Requisition {
  id: string;
  reqNumber: string;
  patientName: string;
  patientId: string;
  ward: HospitalWard;
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  urgency: UrgencyLevel;
  clinicalNotes?: string;
  status: RequisitionStatus;
  requestedAt: string;
  fulfilledAt?: string;
  fulfilledBy?: string;
  shortageError?: string;
}

export type AuditLogType =
  | 'STOCK_ADJUST'
  | 'REQUISITION_CREATED'
  | 'REQUISITION_FULFILLED'
  | 'SHORTAGE_ALERT'
  | 'SYSTEM_EVENT';

export interface AuditLogItem {
  id: string;
  timestamp: string;
  type: AuditLogType;
  message: string;
  details?: string;
  actor: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
}

export interface DashboardMetrics {
  totalUnits: number;
  criticalShortageCount: number;
  activeRequisitions: number;
  statCriticalCount: number;
  lastUpdated: string;
}
