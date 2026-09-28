/**
 * ================================================================================
 * MEDICAL SAFETY & ADMINISTRATIVE ELIGIBILITY DISCLAIMER
 * ================================================================================
 * This Donor Eligibility Engine evaluates administrative and rule-based criteria
 * (donation intervals, deferral records, and medical review flags).
 * 
 * This software engine does NOT perform medical diagnosis or claim clinical fitness
 * to donate. Donors requiring medical judgment are flagged as REQUIRES_MEDICAL_REVIEW
 * for evaluation by authorized health personnel.
 * ================================================================================
 */

export const DonorEligibilityStatus = {
  ELIGIBLE: 'ELIGIBLE',
  TEMPORARILY_INELIGIBLE: 'TEMPORARILY_INELIGIBLE',
  PERMANENTLY_DEFERRED: 'PERMANENTLY_DEFERRED',
  REQUIRES_MEDICAL_REVIEW: 'REQUIRES_MEDICAL_REVIEW',
} as const;

export type DonorEligibilityStatusType =
  (typeof DonorEligibilityStatus)[keyof typeof DonorEligibilityStatus];

export interface DonorEligibilityRulesConfig {
  minDaysBetweenDonations: number; // Default 56 days (8 weeks)
  minAge?: number;                 // Optional clinical reference (e.g. 18)
  maxAge?: number;                 // Optional clinical reference (e.g. 65)
}

export const DEFAULT_ELIGIBILITY_RULES: DonorEligibilityRulesConfig = {
  minDaysBetweenDonations: 56,
  minAge: 18,
  maxAge: 65,
};

export interface DonorInputData {
  id?: string;
  name?: string;
  email?: string;
  deferral_status?: string | null;
  deferral_reason?: string | null;
  deferral_until?: Date | string | null;
  medical_review_notes?: string | null;
  donations?: Array<{
    id: string;
    donation_date: Date | string;
    status: string; // PENDING | APPROVED | REJECTED
  }>;
}

export interface DonorEligibilityResult {
  donorId?: string;
  donorName?: string;
  status: DonorEligibilityStatusType;
  eligible: boolean;
  reasons: string[];
  warnings: string[];
  lastDonationDate: string | null;
  nextEligibleDate: string | null;
  daysRemaining: number;
  daysElapsed: number | null;
  deferralUntil: string | null;
  medicalReviewNotes: string | null;
}

export class DonorEligibilityEngine {
  private config: DonorEligibilityRulesConfig;

  constructor(customConfig?: Partial<DonorEligibilityRulesConfig>) {
    this.config = {
      ...DEFAULT_ELIGIBILITY_RULES,
      ...customConfig,
    };
  }

  /**
   * Get current rules configuration
   */
  public getConfig(): DonorEligibilityRulesConfig {
    return { ...this.config };
  }

  /**
   * Evaluates eligibility for a donor based on deferrals and donation history
   */
  public evaluate(donor: DonorInputData, currentDate: Date = new Date()): DonorEligibilityResult {
    const reasons: string[] = [];
    const warnings: string[] = [];

    if (!donor || typeof donor !== 'object') {
      return {
        status: DonorEligibilityStatus.REQUIRES_MEDICAL_REVIEW,
        eligible: false,
        reasons: ['Invalid donor record provided.'],
        warnings: [],
        lastDonationDate: null,
        nextEligibleDate: null,
        daysRemaining: 0,
        daysElapsed: null,
        deferralUntil: null,
        medicalReviewNotes: null,
      };
    }

    const donorId = donor.id;
    const donorName = donor.name;

    // --------------------------------------------------------
    // 1. Permanent Deferral Check
    // --------------------------------------------------------
    if (donor.deferral_status === DonorEligibilityStatus.PERMANENTLY_DEFERRED) {
      const reason = donor.deferral_reason || 'Donor is permanently deferred from blood donation by medical authority.';
      reasons.push(reason);
      return {
        donorId,
        donorName,
        status: DonorEligibilityStatus.PERMANENTLY_DEFERRED,
        eligible: false,
        reasons,
        warnings,
        lastDonationDate: null,
        nextEligibleDate: null,
        daysRemaining: 0,
        daysElapsed: null,
        deferralUntil: null,
        medicalReviewNotes: donor.medical_review_notes || null,
      };
    }

    // --------------------------------------------------------
    // 2. Medical Review Check
    // --------------------------------------------------------
    if (donor.deferral_status === DonorEligibilityStatus.REQUIRES_MEDICAL_REVIEW) {
      const reason = donor.deferral_reason || 'Donor requires medical clearance by blood bank health personnel before donating.';
      reasons.push(reason);
      return {
        donorId,
        donorName,
        status: DonorEligibilityStatus.REQUIRES_MEDICAL_REVIEW,
        eligible: false,
        reasons,
        warnings,
        lastDonationDate: null,
        nextEligibleDate: null,
        daysRemaining: 0,
        daysElapsed: null,
        deferralUntil: null,
        medicalReviewNotes: donor.medical_review_notes || null,
      };
    }

    // --------------------------------------------------------
    // 3. Active Temporary Deferral Check
    // --------------------------------------------------------
    let deferralUntilStr: string | null = null;
    if (donor.deferral_until) {
      const deferralUntilDate = new Date(donor.deferral_until);
      if (!isNaN(deferralUntilDate.getTime()) && deferralUntilDate > currentDate) {
        deferralUntilStr = deferralUntilDate.toISOString().split('T')[0];
        const reason = donor.deferral_reason || `Donor is under temporary deferral until ${deferralUntilStr}.`;
        reasons.push(reason);

        const diffMs = deferralUntilDate.getTime() - currentDate.getTime();
        const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        return {
          donorId,
          donorName,
          status: DonorEligibilityStatus.TEMPORARILY_INELIGIBLE,
          eligible: false,
          reasons,
          warnings,
          lastDonationDate: null,
          nextEligibleDate: deferralUntilStr,
          daysRemaining,
          daysElapsed: null,
          deferralUntil: deferralUntilStr,
          medicalReviewNotes: donor.medical_review_notes || null,
        };
      }
    }

    // If deferral_status is TEMPORARILY_INELIGIBLE without deferral_until date
    if (donor.deferral_status === DonorEligibilityStatus.TEMPORARILY_INELIGIBLE && !deferralUntilStr) {
      const reason = donor.deferral_reason || 'Donor is temporarily ineligible to donate.';
      reasons.push(reason);
      return {
        donorId,
        donorName,
        status: DonorEligibilityStatus.TEMPORARILY_INELIGIBLE,
        eligible: false,
        reasons,
        warnings,
        lastDonationDate: null,
        nextEligibleDate: null,
        daysRemaining: 0,
        daysElapsed: null,
        deferralUntil: null,
        medicalReviewNotes: donor.medical_review_notes || null,
      };
    }

    // --------------------------------------------------------
    // 4. Donation Interval Check (56-Day Rule)
    // --------------------------------------------------------
    const approvedDonations = (donor.donations || [])
      .filter((d) => d.status === 'APPROVED' && d.donation_date)
      .map((d) => ({ ...d, date: new Date(d.donation_date) }))
      .filter((d) => !isNaN(d.date.getTime()))
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    let lastDonationDateStr: string | null = null;
    let nextEligibleDateStr: string | null = null;
    let daysElapsed: number | null = null;

    if (approvedDonations.length > 0) {
      const latestDonation = approvedDonations[0];
      const lastDate = latestDonation.date;
      lastDonationDateStr = lastDate.toISOString().split('T')[0];

      const diffMs = currentDate.getTime() - lastDate.getTime();
      daysElapsed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      const minInterval = this.config.minDaysBetweenDonations;
      if (daysElapsed < minInterval) {
        const daysRemaining = minInterval - daysElapsed;
        const nextEligible = new Date(lastDate);
        nextEligible.setDate(nextEligible.getDate() + minInterval);
        nextEligibleDateStr = nextEligible.toISOString().split('T')[0];

        const reason = `Minimum donation interval of ${minInterval} days has not elapsed since your last approved donation on ${lastDonationDateStr}.`;
        reasons.push(reason);

        return {
          donorId,
          donorName,
          status: DonorEligibilityStatus.TEMPORARILY_INELIGIBLE,
          eligible: false,
          reasons,
          warnings,
          lastDonationDate: lastDonationDateStr,
          nextEligibleDate: nextEligibleDateStr,
          daysRemaining,
          daysElapsed,
          deferralUntil: null,
          medicalReviewNotes: donor.medical_review_notes || null,
        };
      }
    }

    // --------------------------------------------------------
    // 5. Eligible Baseline
    // --------------------------------------------------------
    return {
      donorId,
      donorName,
      status: DonorEligibilityStatus.ELIGIBLE,
      eligible: true,
      reasons: [],
      warnings,
      lastDonationDate: lastDonationDateStr,
      nextEligibleDate: null,
      daysRemaining: 0,
      daysElapsed,
      deferralUntil: null,
      medicalReviewNotes: donor.medical_review_notes || null,
    };
  }
}

export default DonorEligibilityEngine;
