import { Request } from 'express';
import { Role, BloodGroup } from './enums.js';

export interface AuthUserPayload {
  id: string;
  email: string;
  role: Role;
  name: string;
  blood_group?: BloodGroup | null;
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
  blood_group?: BloodGroup;
}

export interface LoginDTO {
  email: string;
  password: string;
}
