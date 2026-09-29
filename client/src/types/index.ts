export type Role = 'ADMIN' | 'DONOR' | 'PATIENT' | 'HOSPITAL' | 'USER';

export type BloodGroup =
  | 'A_POS'
  | 'A_NEG'
  | 'B_POS'
  | 'B_NEG'
  | 'AB_POS'
  | 'AB_NEG'
  | 'O_POS'
  | 'O_NEG'
  | 'A+'
  | 'A-'
  | 'B+'
  | 'B-'
  | 'AB+'
  | 'AB-'
  | 'O+'
  | 'O-';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital_name: string;
  hospital_id?: string | null;
  phone: string;
  email: string;
  qualification?: string | null;
  experience_yrs?: number | null;
  avatar_url?: string | null;
  is_available: boolean;
  isPreferred?: boolean;
  created_at?: string;
}

export interface DoctorMessage {
  id: string;
  user_id: string;
  doctor_id: string;
  sender: 'USER' | 'DOCTOR';
  message: string;
  read_at?: string | null;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  dob?: string | null;
  gender?: string | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  bmi?: number | null;
  blood_group?: string | null;
  city?: string | null;
  address?: string | null;
  emergency_contact?: string | null;
  conditions?: string | null;
  allergies?: string | null;
  preferred_doctor_id?: string | null;
  preferred_doctor?: Doctor | null;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  blood_group?: BloodGroup | string | null;
  profile?: UserProfile | null;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token: string;
  user: User;
}

export interface BloodOrder {
  id: string;
  user_id: string;
  blood_group: string;
  units: number;
  hospital_name: string;
  hospital_id?: string | null;
  urgency: 'STANDARD' | 'URGENT' | 'STAT_CRITICAL';
  reason?: string | null;
  needed_by?: string | null;
  status: 'Pending' | 'Approved' | 'Fulfilled' | 'Rejected';
  admin_notes?: string | null;
  created_at: string;
  updated_at?: string;
  hospital?: {
    id: string;
    name: string;
    address: string;
    contact_number: string;
  } | null;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    blood_group?: string | null;
    profile?: UserProfile | null;
  } | null;
}

export interface ReportAbnormalValue {
  parameter: string;
  value: string;
  normalRange: string;
  status: 'LOW' | 'HIGH' | 'CRITICAL' | 'NORMAL';
  clinicalImpact: string;
}

export interface Report {
  id: string;
  user_id: string;
  file_name: string;
  file_url?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  extracted_text?: string | null;
  summary?: string | null;
  abnormal_values?: string | null;
  risk_flags?: string | null;
  suggested_step?: string | null;
  is_flagged: boolean;
  abnormalValues?: ReportAbnormalValue[];
  riskFlags?: string[];
  created_at: string;
  updated_at?: string;
}

export type NotificationType =
  | 'medicine_reminder'
  | 'test_due'
  | 'followup'
  | 'order_status'
  | 'health_tip';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  scheduled_at: string;
  read_at?: string | null;
  created_at: string;
}

export interface InventoryItem {
  id: string | null;
  blood_group: BloodGroup;
  units_available: number;
  stock_status: 'CRITICAL' | 'LOW_STOCK' | 'SUFFICIENT';
  last_updated: string;
}

export interface InventoryResponse {
  success: boolean;
  data: {
    total_units: number;
    low_stock_count: number;
    inventory: InventoryItem[];
  };
}

export type DonationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Donation {
  id: string;
  donor_id: string;
  units_donated: number;
  donation_date: string;
  status: DonationStatus;
  created_at: string;
  donor?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    blood_group?: BloodGroup | string | null;
  };
}

export type RequestUrgency = 'NORMAL' | 'URGENT';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'FULFILLED' | 'REJECTED';

export interface BloodRequest {
  id: string;
  requester_id: string;
  blood_group: BloodGroup;
  units_requested: number;
  hospital_name: string;
  urgency: RequestUrgency;
  status: RequestStatus;
  created_at: string;
  requester?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    blood_group?: BloodGroup | string | null;
  };
}

/**
 * Helper to display human-readable blood group notation (e.g. A_POS -> A+)
 */
export const formatBloodGroup = (group?: BloodGroup | string | null): string => {
  if (!group) return 'Unknown';
  const mapping: Record<string, string> = {
    A_POS: 'A+',
    A_NEG: 'A-',
    B_POS: 'B+',
    B_NEG: 'B-',
    AB_POS: 'AB+',
    AB_NEG: 'AB-',
    O_POS: 'O+',
    O_NEG: 'O-',
    'A+': 'A+',
    'A-': 'A-',
    'B+': 'B+',
    'B-': 'B-',
    'AB+': 'AB+',
    'AB-': 'AB-',
    'O+': 'O+',
    'O-': 'O-',
  };
  return mapping[group] || group;
};

/**
 * Calculate Body Mass Index (BMI) and categorization
 */
export const calculateBMI = (weightKg?: number | null, heightCm?: number | null) => {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) {
    return { bmi: null, label: 'N/A', color: 'text-slate-400' };
  }
  const heightM = heightCm / 100;
  const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;

  if (bmi < 18.5) {
    return { bmi, label: 'Underweight', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
  } else if (bmi < 25) {
    return { bmi, label: 'Normal weight', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
  } else if (bmi < 30) {
    return { bmi, label: 'Overweight', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' };
  } else {
    return { bmi, label: 'Obese', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
  }
};
