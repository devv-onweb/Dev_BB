/**
 * ================================================================================
 * FEFO (FIRST EXPIRE - FIRST OUT) INVENTORY ALLOCATION ENGINE
 * ================================================================================
 * Centralized, deterministic engine that allocates traceable blood units by:
 * 1. Filtering by ABO/Rh compatibility using BloodCompatibilityEngine
 * 2. Excluding expired or reserved blood units
 * 3. Sorting candidates strictly by expiry date ascending (FEFO strategy)
 * 4. Allocating the earliest-expiring compatible units first to minimize wastage.
 * ================================================================================
 */

import BloodCompatibilityEngine from '../BloodCompatibilityEngine.js';
import ExpiryManagementService, { BloodUnitStatus } from './ExpiryManagementService.js';

export interface AllocationRequestInput {
  recipientBloodGroup: string;
  unitsRequested: number;
  componentType?: string;
  requestId?: string;
}

export interface AllocationResult {
  success: boolean;
  recipientBloodGroup: string;
  recipientBloodGroupEnum: string;
  componentType: string;
  unitsRequested: number;
  unitsAllocatedCount: number;
  shortageCount: number;
  allocatedUnits: any[];
  compatibleDonorGroups: string[];
  reason: string;
  error?: string;
}

export class FEFOInventoryEngine {
  private expiryService: ExpiryManagementService;

  constructor() {
    this.expiryService = new ExpiryManagementService();
  }

  /**
   * Evaluates candidate blood units and performs FEFO allocation.
   */
  public allocateFromPool(
    request: AllocationRequestInput,
    unitsPool: any[],
    currentDate: Date = new Date()
  ): AllocationResult {
    const { recipientBloodGroup, unitsRequested, componentType = 'RBC' } = request;

    if (!recipientBloodGroup || typeof recipientBloodGroup !== 'string') {
      return {
        success: false,
        recipientBloodGroup: String(recipientBloodGroup),
        recipientBloodGroupEnum: '',
        componentType,
        unitsRequested: unitsRequested || 0,
        unitsAllocatedCount: 0,
        shortageCount: unitsRequested || 0,
        allocatedUnits: [],
        compatibleDonorGroups: [],
        reason: 'Invalid or missing recipient blood group.',
        error: 'INVALID_RECIPIENT_BLOOD_GROUP',
      };
    }

    const unitsNeeded = Number(unitsRequested);
    if (isNaN(unitsNeeded) || unitsNeeded <= 0) {
      return {
        success: false,
        recipientBloodGroup,
        recipientBloodGroupEnum: '',
        componentType,
        unitsRequested: 0,
        unitsAllocatedCount: 0,
        shortageCount: 0,
        allocatedUnits: [],
        compatibleDonorGroups: [],
        reason: 'Requested units must be a positive integer greater than 0.',
        error: 'INVALID_UNITS_REQUESTED',
      };
    }

    // 1. Check compatibility using BloodCompatibilityEngine
    const compatResult = BloodCompatibilityEngine.getCompatibleDonorGroups(recipientBloodGroup, componentType);

    if (!compatResult.success) {
      return {
        success: false,
        recipientBloodGroup,
        recipientBloodGroupEnum: '',
        componentType,
        unitsRequested: unitsNeeded,
        unitsAllocatedCount: 0,
        shortageCount: unitsNeeded,
        allocatedUnits: [],
        compatibleDonorGroups: [],
        reason: compatResult.reason,
        error: compatResult.error || 'COMPATIBILITY_CHECK_FAILED',
      };
    }

    const allowedDisplayGroups = new Set(compatResult.compatibleGroups);
    const allowedEnumGroups = new Set(compatResult.compatibleGroupEnums);

    // 2. Filter Candidate Units: Compatible, Non-expired, Available/Expiring Soon
    const candidateUnits = unitsPool.filter((unit) => {
      // Check status
      if (unit.status !== BloodUnitStatus.AVAILABLE && unit.status !== BloodUnitStatus.EXPIRING_SOON) {
        return false;
      }

      // Check Component Type
      const unitComp = (unit.component_type || 'RBC').trim().toUpperCase();
      const reqComp = componentType.trim().toUpperCase();
      if (unitComp !== reqComp) {
        return false;
      }

      // Check Expiry (EXCLUDE EXPIRED UNITS!)
      const expiryEval = this.expiryService.evaluate(unit.expiry_date, currentDate);
      if (expiryEval.isExpired || unit.status === BloodUnitStatus.EXPIRED) {
        return false;
      }

      // Check Blood Group Compatibility
      const unitGroup = (unit.blood_group || '').trim().toUpperCase();
      const isGroupCompatible = allowedDisplayGroups.has(unitGroup) || allowedEnumGroups.has(unitGroup);

      return isGroupCompatible;
    });

    // 3. FEFO Sorting Strategy:
    // Primary sort: expiry_date ASC (earliest expiring unit first!)
    // Secondary sort: exact blood group match preferred over non-exact compatible groups
    const recipientNorm = BloodCompatibilityEngine.normalizeBloodGroup(recipientBloodGroup);
    const recipientCanonical = recipientNorm ? recipientNorm.canonical : '';
    const recipientEnum = recipientNorm ? recipientNorm.enumVal : '';

    candidateUnits.sort((a, b) => {
      const timeA = new Date(a.expiry_date).getTime();
      const timeB = new Date(b.expiry_date).getTime();

      if (timeA !== timeB) {
        return timeA - timeB; // Earliest expiry first (FEFO)
      }

      // Secondary preference: exact match
      const isExactA = a.blood_group === recipientCanonical || a.blood_group === recipientEnum;
      const isExactB = b.blood_group === recipientCanonical || b.blood_group === recipientEnum;

      if (isExactA && !isExactB) return -1;
      if (!isExactA && isExactB) return 1;

      return 0;
    });

    // 4. Select FEFO Units up to requested quantity
    const allocatedUnits = candidateUnits.slice(0, unitsNeeded);
    const unitsAllocatedCount = allocatedUnits.length;
    const shortageCount = Math.max(0, unitsNeeded - unitsAllocatedCount);
    const success = shortageCount === 0;

    let reason = '';
    if (success) {
      reason = `FEFO Allocation successful: Selected ${unitsAllocatedCount} compatible unit(s) expiring earliest.`;
    } else if (unitsAllocatedCount > 0) {
      reason = `Partial FEFO Allocation: Selected ${unitsAllocatedCount} unit(s), but experienced a shortage of ${shortageCount} unit(s).`;
    } else {
      reason = `FEFO Allocation rejected: No non-expired compatible ${componentType} blood units available in inventory for recipient ${recipientCanonical || recipientBloodGroup}.`;
    }

    return {
      success,
      recipientBloodGroup: recipientCanonical || recipientBloodGroup,
      recipientBloodGroupEnum: recipientEnum || recipientBloodGroup,
      componentType,
      unitsRequested: unitsNeeded,
      unitsAllocatedCount,
      shortageCount,
      allocatedUnits,
      compatibleDonorGroups: compatResult.compatibleGroups,
      reason,
    };
  }
}

export default FEFOInventoryEngine;
