export const Role = {
  ADMIN: 'ADMIN',
  DONOR: 'DONOR',
  PATIENT: 'PATIENT',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const BloodGroup = {
  A_POS: 'A_POS',
  A_NEG: 'A_NEG',
  B_POS: 'B_POS',
  B_NEG: 'B_NEG',
  AB_POS: 'AB_POS',
  AB_NEG: 'AB_NEG',
  O_POS: 'O_POS',
  O_NEG: 'O_NEG',
} as const;
export type BloodGroup = (typeof BloodGroup)[keyof typeof BloodGroup];

export const DonationStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type DonationStatus = (typeof DonationStatus)[keyof typeof DonationStatus];

export const RequestUrgency = {
  NORMAL: 'NORMAL',
  URGENT: 'URGENT',
} as const;
export type RequestUrgency = (typeof RequestUrgency)[keyof typeof RequestUrgency];

export const RequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  FULFILLED: 'FULFILLED',
  REJECTED: 'REJECTED',
} as const;
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];
