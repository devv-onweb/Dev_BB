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
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 ${className}`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Admin
        </span>
      );
    case 'DONOR':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 ${className}`}
        >
          <HeartHandshake className="w-3.5 h-3.5" />
          Donor
        </span>
      );
    case 'PATIENT':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 ${className}`}
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
