export type Role = 'ADMIN' | 'DONOR' | 'PATIENT';

export type BloodGroup =
  | 'A_POS'
  | 'A_NEG'
  | 'B_POS'
  | 'B_NEG'
  | 'AB_POS'
  | 'AB_NEG'
  | 'O_POS'
  | 'O_NEG';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  blood_group?: BloodGroup | null;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token: string;
  user: User;
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
    blood_group?: BloodGroup | null;
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
    blood_group?: BloodGroup | null;
  };
}

/**
 * Helper to display human-readable blood group notation (e.g. A_POS -> A+)
 */
export const formatBloodGroup = (group?: BloodGroup | null): string => {
  if (!group) return 'Unknown';
  const mapping: Record<BloodGroup, string> = {
    A_POS: 'A+',
    A_NEG: 'A-',
    B_POS: 'B+',
    B_NEG: 'B-',
    AB_POS: 'AB+',
    AB_NEG: 'AB-',
    O_POS: 'O+',
    O_NEG: 'O-',
  };
  return mapping[group] || group;
};
