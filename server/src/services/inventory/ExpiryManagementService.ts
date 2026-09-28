/**
 * ================================================================================
 * EXPIRY MANAGEMENT SERVICE
 * ================================================================================
 * Deterministic service to evaluate shelf-life status of traceable blood units,
 * detect expiring and expired blood stock, calculate wastage analytics,
 * and enforce non-allocation of expired blood inventory.
 * ================================================================================
 */

export const BloodUnitStatus = {
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  EXPIRING_SOON: 'EXPIRING_SOON',
  EXPIRED: 'EXPIRED',
  USED: 'USED',
  DISCARDED: 'DISCARDED',
} as const;

export type BloodUnitStatusType = (typeof BloodUnitStatus)[keyof typeof BloodUnitStatus];

export interface ExpiryThresholdConfig {
  expiringSoonDays: number; // Default 10 days
  highPriorityDays: number; // Default 3 days
}

export const DEFAULT_EXPIRY_CONFIG: ExpiryThresholdConfig = {
  expiringSoonDays: 10,
  highPriorityDays: 3,
};

export interface ExpiryEvaluation {
  unitId?: string;
  unitNumber?: string;
  bloodGroup?: string;
  expiryDate: string;
  daysRemaining: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
  isHighPriority: boolean;
  category: 'NORMAL' | 'EXPIRING_SOON' | 'HIGH_PRIORITY' | 'EXPIRED';
  recommendedStatus?: BloodUnitStatusType;
}

export interface WastageAnalyticsResult {
  totalUnits: number;
  availableUnits: number;
  reservedUnits: number;
  usedUnits: number;
  expiredUnits: number;
  discardedUnits: number;
  expiringSoonUnits: number;
  totalWastedUnits: number;
  wastageRatePercent: number;
  utilizationRatePercent: number;
  wastageByBloodGroup: Record<string, { expired: number; discarded: number; totalWasted: number }>;
}

export class ExpiryManagementService {
  private config: ExpiryThresholdConfig;

  constructor(customConfig?: Partial<ExpiryThresholdConfig>) {
    this.config = {
      ...DEFAULT_EXPIRY_CONFIG,
      ...customConfig,
    };
  }

  /**
   * Evaluates shelf-life and expiry status of a single blood unit date.
   */
  public evaluate(expiryDateInput: Date | string, currentDate: Date = new Date()): ExpiryEvaluation {
    const expiryDate = new Date(expiryDateInput);

    if (isNaN(expiryDate.getTime())) {
      return {
        expiryDate: String(expiryDateInput),
        daysRemaining: 0,
        isExpired: true,
        isExpiringSoon: false,
        isHighPriority: false,
        category: 'EXPIRED',
        recommendedStatus: BloodUnitStatus.EXPIRED,
      };
    }

    const expiryDateStr = expiryDate.toISOString().split('T')[0];

    // Compute difference in full days
    const diffMs = expiryDate.getTime() - currentDate.getTime();
    const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0 || expiryDate <= currentDate) {
      return {
        expiryDate: expiryDateStr,
        daysRemaining: Math.min(0, daysRemaining),
        isExpired: true,
        isExpiringSoon: false,
        isHighPriority: false,
        category: 'EXPIRED',
        recommendedStatus: BloodUnitStatus.EXPIRED,
      };
    }

    if (daysRemaining <= this.config.highPriorityDays) {
      return {
        expiryDate: expiryDateStr,
        daysRemaining,
        isExpired: false,
        isExpiringSoon: true,
        isHighPriority: true,
        category: 'HIGH_PRIORITY',
        recommendedStatus: BloodUnitStatus.EXPIRING_SOON,
      };
    }

    if (daysRemaining <= this.config.expiringSoonDays) {
      return {
        expiryDate: expiryDateStr,
        daysRemaining,
        isExpired: false,
        isExpiringSoon: true,
        isHighPriority: false,
        category: 'EXPIRING_SOON',
        recommendedStatus: BloodUnitStatus.EXPIRING_SOON,
      };
    }

    return {
      expiryDate: expiryDateStr,
      daysRemaining,
      isExpired: false,
      isExpiringSoon: false,
      isHighPriority: false,
      category: 'NORMAL',
      recommendedStatus: BloodUnitStatus.AVAILABLE,
    };
  }

  /**
   * Calculates wastage and inventory utilization analytics across all blood units.
   */
  public calculateWastageAnalytics(units: any[], currentDate: Date = new Date()): WastageAnalyticsResult {
    const totalUnits = units.length;
    let availableUnits = 0;
    let reservedUnits = 0;
    let usedUnits = 0;
    let expiredUnits = 0;
    let discardedUnits = 0;
    let expiringSoonUnits = 0;

    const wastageByBloodGroup: Record<string, { expired: number; discarded: number; totalWasted: number }> = {};

    for (const unit of units) {
      const group = unit.blood_group || 'UNKNOWN';
      if (!wastageByBloodGroup[group]) {
        wastageByBloodGroup[group] = { expired: 0, discarded: 0, totalWasted: 0 };
      }

      const evalResult = this.evaluate(unit.expiry_date, currentDate);

      if (unit.status === BloodUnitStatus.USED) {
        usedUnits++;
      } else if (unit.status === BloodUnitStatus.DISCARDED) {
        discardedUnits++;
        wastageByBloodGroup[group].discarded++;
        wastageByBloodGroup[group].totalWasted++;
      } else if (unit.status === BloodUnitStatus.RESERVED) {
        reservedUnits++;
      } else if (evalResult.isExpired || unit.status === BloodUnitStatus.EXPIRED) {
        expiredUnits++;
        wastageByBloodGroup[group].expired++;
        wastageByBloodGroup[group].totalWasted++;
      } else if (evalResult.isExpiringSoon || unit.status === BloodUnitStatus.EXPIRING_SOON) {
        expiringSoonUnits++;
        availableUnits++;
      } else {
        availableUnits++;
      }
    }

    const totalWastedUnits = expiredUnits + discardedUnits;
    const wastageRatePercent = totalUnits > 0 ? Number(((totalWastedUnits / totalUnits) * 100).toFixed(2)) : 0;
    const utilizationRatePercent = totalUnits > 0 ? Number(((usedUnits / totalUnits) * 100).toFixed(2)) : 0;

    return {
      totalUnits,
      availableUnits,
      reservedUnits,
      usedUnits,
      expiredUnits,
      discardedUnits,
      expiringSoonUnits,
      totalWastedUnits,
      wastageRatePercent,
      utilizationRatePercent,
      wastageByBloodGroup,
    };
  }
}

export default ExpiryManagementService;
