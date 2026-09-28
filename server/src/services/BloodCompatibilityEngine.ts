/**
 * ================================================================================
 * MEDICAL SAFETY NOTICE & CLINICAL PROTOCOL DISCLAIMER
 * ================================================================================
 * This Blood Compatibility Engine implements deterministic ABO and RhD Red Blood
 * Cell (RBC) compatibility rules based on standard transfusion medicine protocols.
 * 
 * This software engine MUST be reviewed and validated against the blood bank's
 * applicable clinical protocol before production medical use.
 * 
 * Do NOT use LLMs, machine learning models, or probabilistic algorithms to make
 * medical blood compatibility determinations.
 * ================================================================================
 */

import { BloodGroup as BloodGroupEnum } from '../types/enums.js';

export type ComponentType = 'RBC' | 'PLASMA' | 'PLATELETS' | 'WHOLE_BLOOD';

export interface CompatibilityResult {
  compatible: boolean;
  donorBloodGroup?: string;
  recipientBloodGroup?: string;
  donorBloodGroupEnum?: string;
  recipientBloodGroupEnum?: string;
  componentType: ComponentType | string;
  reason: string;
  error?: string;
}

export interface BloodGroupQueryResult {
  success: boolean;
  targetBloodGroup?: string;
  targetBloodGroupEnum?: string;
  componentType: ComponentType | string;
  compatibleGroups: string[];
  compatibleGroupEnums: string[];
  reason: string;
  error?: string;
}

// Canonical display to enum mapping
const GROUP_TO_ENUM_MAP: Record<string, string> = {
  'O-': 'O_NEG',
  'O+': 'O_POS',
  'A-': 'A_NEG',
  'A+': 'A_POS',
  'B-': 'B_NEG',
  'B+': 'B_POS',
  'AB-': 'AB_NEG',
  'AB+': 'AB_POS',
};

// Enum to canonical display mapping
const ENUM_TO_GROUP_MAP: Record<string, string> = {
  'O_NEG': 'O-',
  'O_POS': 'O+',
  'A_NEG': 'A-',
  'A_POS': 'A+',
  'B_NEG': 'B-',
  'B_POS': 'B+',
  'AB_NEG': 'AB-',
  'AB_POS': 'AB+',
};

// All 8 standard blood groups in canonical display format
export const ALL_CANONICAL_BLOOD_GROUPS = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] as const;

/**
 * RBC Compatibility Matrix: Recipient -> List of compatible Donors (Canonical Display Format)
 * 
 * Recipient O-:  Can receive RBC from O-
 * Recipient O+:  Can receive RBC from O-, O+
 * Recipient A-:  Can receive RBC from O-, A-
 * Recipient A+:  Can receive RBC from O-, O+, A-, A+
 * Recipient B-:  Can receive RBC from O-, B-
 * Recipient B+:  Can receive RBC from O-, O+, B-, B+
 * Recipient AB-: Can receive RBC from O-, A-, B-, AB-
 * Recipient AB+: Can receive RBC from O-, O+, A-, A+, B-, B+, AB-, AB+
 */
const RBC_COMPATIBILITY_MATRIX: Record<string, string[]> = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

export class BloodCompatibilityEngine {
  /**
   * Normalizes input blood group string to canonical display format (e.g. "O-", "A+")
   * Accepts both display format ("O-", "a+") and Enum format ("O_NEG", "A_POS").
   */
  public static normalizeBloodGroup(input: unknown): { canonical: string; enumVal: string } | null {
    if (typeof input !== 'string') return null;
    const trimmed = input.trim().toUpperCase();
    if (!trimmed) return null;

    // Direct match with display format
    if (GROUP_TO_ENUM_MAP[trimmed]) {
      return { canonical: trimmed, enumVal: GROUP_TO_ENUM_MAP[trimmed] };
    }

    // Direct match with enum format
    if (ENUM_TO_GROUP_MAP[trimmed]) {
      return { canonical: ENUM_TO_GROUP_MAP[trimmed], enumVal: trimmed };
    }

    return null;
  }

  /**
   * Evaluates RBC compatibility between a donor blood group and a recipient blood group.
   * Direction: DONOR BLOOD GROUP -> RECIPIENT BLOOD GROUP
   */
  public static isCompatible(
    donorInput: unknown,
    recipientInput: unknown,
    componentType: string = 'RBC'
  ): CompatibilityResult {
    const component = (componentType || 'RBC').trim().toUpperCase() as ComponentType;

    // Validate component type (Phase 1 supports RBC only)
    if (component !== 'RBC') {
      return {
        compatible: false,
        donorBloodGroup: typeof donorInput === 'string' ? donorInput : String(donorInput),
        recipientBloodGroup: typeof recipientInput === 'string' ? recipientInput : String(recipientInput),
        componentType,
        reason: `Component type '${componentType}' is not currently supported in Phase 1 (RBC compatibility only).`,
        error: 'UNSUPPORTED_COMPONENT_TYPE',
      };
    }

    // Validate Donor Blood Group
    const donorNorm = this.normalizeBloodGroup(donorInput);
    if (!donorNorm) {
      return {
        compatible: false,
        donorBloodGroup: typeof donorInput === 'string' ? donorInput : String(donorInput),
        recipientBloodGroup: typeof recipientInput === 'string' ? recipientInput : String(recipientInput),
        componentType: 'RBC',
        reason: `Invalid or unsupported donor blood group format: '${donorInput}'`,
        error: 'INVALID_BLOOD_GROUP',
      };
    }

    // Validate Recipient Blood Group
    const recipientNorm = this.normalizeBloodGroup(recipientInput);
    if (!recipientNorm) {
      return {
        compatible: false,
        donorBloodGroup: donorNorm.canonical,
        recipientBloodGroup: typeof recipientInput === 'string' ? recipientInput : String(recipientInput),
        componentType: 'RBC',
        reason: `Invalid or unsupported recipient blood group format: '${recipientInput}'`,
        error: 'INVALID_BLOOD_GROUP',
      };
    }

    const allowedDonors = RBC_COMPATIBILITY_MATRIX[recipientNorm.canonical] || [];
    const compatible = allowedDonors.includes(donorNorm.canonical);

    const reason = compatible
      ? `${donorNorm.canonical} RBC is compatible with ${recipientNorm.canonical} recipient.`
      : `${donorNorm.canonical} RBC is NOT compatible with ${recipientNorm.canonical} recipient.`;

    return {
      compatible,
      donorBloodGroup: donorNorm.canonical,
      recipientBloodGroup: recipientNorm.canonical,
      donorBloodGroupEnum: donorNorm.enumVal,
      recipientBloodGroupEnum: recipientNorm.enumVal,
      componentType: 'RBC',
      reason,
    };
  }

  /**
   * Returns all compatible donor blood groups for a given recipient.
   */
  public static getCompatibleDonorGroups(
    recipientInput: unknown,
    componentType: string = 'RBC'
  ): BloodGroupQueryResult {
    const component = (componentType || 'RBC').trim().toUpperCase() as ComponentType;

    if (component !== 'RBC') {
      return {
        success: false,
        componentType,
        compatibleGroups: [],
        compatibleGroupEnums: [],
        reason: `Component type '${componentType}' is not currently supported in Phase 1 (RBC compatibility only).`,
        error: 'UNSUPPORTED_COMPONENT_TYPE',
      };
    }

    const recipientNorm = this.normalizeBloodGroup(recipientInput);
    if (!recipientNorm) {
      return {
        success: false,
        targetBloodGroup: typeof recipientInput === 'string' ? recipientInput : String(recipientInput),
        componentType: 'RBC',
        compatibleGroups: [],
        compatibleGroupEnums: [],
        reason: `Invalid recipient blood group format: '${recipientInput}'`,
        error: 'INVALID_BLOOD_GROUP',
      };
    }

    const compatibleGroups = RBC_COMPATIBILITY_MATRIX[recipientNorm.canonical] || [];
    const compatibleGroupEnums = compatibleGroups.map((g) => GROUP_TO_ENUM_MAP[g]);

    return {
      success: true,
      targetBloodGroup: recipientNorm.canonical,
      targetBloodGroupEnum: recipientNorm.enumVal,
      componentType: 'RBC',
      compatibleGroups,
      compatibleGroupEnums,
      reason: `Recipient ${recipientNorm.canonical} can safely receive RBC from: ${compatibleGroups.join(', ')}.`,
    };
  }

  /**
   * Returns all compatible recipient blood groups for a given donor.
   */
  public static getCompatibleRecipientGroups(
    donorInput: unknown,
    componentType: string = 'RBC'
  ): BloodGroupQueryResult {
    const component = (componentType || 'RBC').trim().toUpperCase() as ComponentType;

    if (component !== 'RBC') {
      return {
        success: false,
        componentType,
        compatibleGroups: [],
        compatibleGroupEnums: [],
        reason: `Component type '${componentType}' is not currently supported in Phase 1 (RBC compatibility only).`,
        error: 'UNSUPPORTED_COMPONENT_TYPE',
      };
    }

    const donorNorm = this.normalizeBloodGroup(donorInput);
    if (!donorNorm) {
      return {
        success: false,
        targetBloodGroup: typeof donorInput === 'string' ? donorInput : String(donorInput),
        componentType: 'RBC',
        compatibleGroups: [],
        compatibleGroupEnums: [],
        reason: `Invalid donor blood group format: '${donorInput}'`,
        error: 'INVALID_BLOOD_GROUP',
      };
    }

    const compatibleRecipients = ALL_CANONICAL_BLOOD_GROUPS.filter((recGroup) => {
      const allowedDonors = RBC_COMPATIBILITY_MATRIX[recGroup] || [];
      return allowedDonors.includes(donorNorm.canonical);
    });

    const compatibleRecipientEnums = compatibleRecipients.map((g) => GROUP_TO_ENUM_MAP[g]);

    return {
      success: true,
      targetBloodGroup: donorNorm.canonical,
      targetBloodGroupEnum: donorNorm.enumVal,
      componentType: 'RBC',
      compatibleGroups: compatibleRecipients,
      compatibleGroupEnums: compatibleRecipientEnums,
      reason: `Donor ${donorNorm.canonical} RBC can be safely transfused to recipients with: ${compatibleRecipients.join(', ')}.`,
    };
  }
}

export default BloodCompatibilityEngine;
