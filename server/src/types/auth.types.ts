import { Request } from 'express';
import { Role, BloodGroup } from './enums.js';

export interface AuthUserPayload {
  id: string;
  email: string;
  role: Role;
  name: string;
  blood_group?: BloodGroup | null;
  hospital_id?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  role?: Role;
  phone?: string;
  blood_group?: BloodGroup | string;
}

export interface UserRegisterDTO {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  dob?: string;
  gender?: string;
  weightKg?: number;
  heightCm?: number;
  bloodGroup: string;
  city?: string;
  address?: string;
  emergencyContact?: string;
  conditions?: string;
  allergies?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}
