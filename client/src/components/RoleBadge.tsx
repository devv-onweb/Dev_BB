import React from 'react';
import { Role } from '../types/index.js';
import { ShieldCheck, HeartHandshake, User } from 'lucide-react';

interface RoleBadgeProps {
  role?: Role;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className = '' }) => {
  if (!role) return null;

  switch (role) {
    case 'ADMIN':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 ${className}`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Admin
        </span>
      );
    case 'DONOR':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 ${className}`}
        >
          <HeartHandshake className="w-3.5 h-3.5" />
          Donor
        </span>
      );
    case 'PATIENT':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 ${className}`}
        >
          <User className="w-3.5 h-3.5" />
          Patient / Requester
        </span>
      );
    default:
      return null;
  }
};

export default RoleBadge;
