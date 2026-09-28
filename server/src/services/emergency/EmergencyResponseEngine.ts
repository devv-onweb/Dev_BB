/**
 * ================================================================================
 * EMERGENCY RESPONSE ENGINE
 * ================================================================================
 * Phase 8 - Orchestrates complete emergency blood request workflow:
 * 1. Emergency Classification
 * 2. Blood Compatibility Check (BloodCompatibilityEngine - Phase 1)
 * 3. Inventory Check & Expiry-aware Allocation (FEFOInventoryEngine - Phase 3)
 * 4. Eligible Donor Search (DonorEligibilityEngine - Phase 2)
 * 5. Geo Matching (GeoDonorMatchingService - Phase 5)
 * 6. Reliability Ranking (DonorReliabilityEngine - Phase 6)
 * 7. Smart Donor Recommendation (SmartDonorRecommendationEngine - Phase 7)
 * 8. Notification Hook (placeholder for Phase 9)
 * 9. Hospital Coordination
 * 10. Blood Fulfillment
 * 11. Audit Logging
 * 
 * Deterministic and explainable. NO LLM medical overrides.
 * ================================================================================
 */

import { prisma } from '../../config/db.js';
import { BloodCompatibilityEngine } from '../BloodCompatibilityEngine.js';
import { DonorEligibilityEngine } from '../donor/DonorEligibilityEngine.js';
import { FEFOInventoryEngine } from '../inventory/FEFOInventoryEngine.js';
import { ExpiryManagementService } from '../inventory/ExpiryManagementService.js';
import { GeoDonorMatchingService } from '../geo/GeoDonorMatchingService.js';
import { DonorReliabilityEngine } from '../donor/DonorReliabilityEngine.js';
import { SmartDonorRecommendationEngine } from '../recommendation/SmartDonorRecommendationEngine.js';
import { AuditLogger } from '../AuditLogger.js';
import { RequestUrgency } from '../../types/enums.js';

export interface EmergencyClassification {
  isEmergency: boolean;
  urgency: string;
  classification: 'STANDARD' | 'EMERGENCY' | 'CRITICAL_EMERGENCY';
  reason: string;
}

export interface InventoryAllocationPlan {
  allocatedUnits: any[];
  shortage: number;
  usedFEFO: boolean;
  bloodGroup: string;
  unitsRequested: number;
  componentType: string;
}

export interface RecommendedDonorItem {
  donorId: string;
  anonymizedName: string;
  bloodGroup: string;
  distanceKm: number;
  distanceRange: string;
  eligible: boolean;
  available: boolean;
  reliabilityScore: number;
  reliabilityStatus: string;
  rankingScore: number;
  reason: string;
}

export interface EmergencyResponsePlan {
  requestId: string;
  urgency: string;
  classification: string;
  inventoryAllocation: InventoryAllocationPlan;
  recommendedDonors: RecommendedDonorItem[];
  shortages: string[];
  nextActions: string[];
  auditId: string;
  success: boolean;
  timestamp: string;
}

export interface EmergencyResponseRequest {
  bloodRequestId?: string;
  bloodGroup: string;
  unitsRequested: number;
  hospitalId?: string;
  latitude?: number;
  longitude?: number;
  urgency?: string;
  componentType?: string;
  radiusKm?: number;
  maxResults?: number;
  requestedBy: string; // userId
}

export class EmergencyResponseEngine {
  private fefoEngine: FEFOInventoryEngine;
  private recommendationEngine: SmartDonorRecommendationEngine;
  private reliabilityEngine: DonorReliabilityEngine;
  private eligibilityEngine: DonorEligibilityEngine;

  constructor() {
    this.fefoEngine = new FEFOInventoryEngine();
    this.recommendationEngine = new SmartDonorRecommendationEngine();
    this.reliabilityEngine = new DonorReliabilityEngine();
    this.eligibilityEngine = new DonorEligibilityEngine();
  }

  /**
   * Classifies the emergency level based on urgency
   */
  private classifyEmergency(urgency: string): EmergencyClassification {
    const normalizedUrgency = urgency.toUpperCase();
    
    if (normalizedUrgency === RequestUrgency.STAT_CRITICAL) {
      return {
        isEmergency: true,
        urgency: RequestUrgency.STAT_CRITICAL,
        classification: 'CRITICAL_EMERGENCY',
        reason: 'STAT_CRITICAL urgency: Immediate life-threatening situation requiring maximum resource allocation.',
      };
    }
    
    if (normalizedUrgency === RequestUrgency.URGENT) {
      return {
        isEmergency: true,
        urgency: RequestUrgency.URGENT,
        classification: 'EMERGENCY',
        reason: 'URGENT urgency: High-priority medical situation requiring expedited blood allocation.',
      };
    }
    
    return {
      isEmergency: false,
      urgency: RequestUrgency.STANDARD,
      classification: 'STANDARD',
      reason: 'STANDARD urgency: Routine blood request with normal processing priority.',
    };
  }

  /**
   * Performs FEFO inventory allocation with expiry awareness
   */
  private async allocateInventory(
    bloodGroup: string,
    unitsRequested: number,
    componentType: string = 'RBC'
  ): Promise<InventoryAllocationPlan> {
    // Fetch all available blood units
    const allUnits = await prisma.bloodUnit.findMany({
      where: {
        blood_group: bloodGroup,
        component_type: componentType,
      },
    });

    // Use FEFO engine for allocation
    const allocationResult = this.fefoEngine.allocateFromPool(
      {
        recipientBloodGroup: bloodGroup,
        unitsRequested,
        componentType,
      },
      allUnits
    );

    return {
      allocatedUnits: allocationResult.allocatedUnits,
      shortage: allocationResult.shortageCount,
      usedFEFO: true,
      bloodGroup: allocationResult.recipientBloodGroup,
      unitsRequested: allocationResult.unitsRequested,
      componentType: allocationResult.componentType,
    };
  }

  /**
   * Generates smart donor recommendations using Phase 7 engine
   */
  private async generateDonorRecommendations(
    bloodGroup: string,
    hospitalId: string | undefined,
    latitude: number | undefined,
    longitude: number | undefined,
    urgency: string,
    radiusKm: number,
    maxResults: number,
    componentType: string
  ): Promise<RecommendedDonorItem[]> {
    const recommendationResult = await this.recommendationEngine.recommendDonors({
      bloodGroup,
      componentType,
      hospitalId,
      latitude,
      longitude,
      urgency,
      radiusKm,
      maxResults,
    });

    return recommendationResult.recommendations;
  }

  /**
   * Identifies shortages and generates next actions
   */
  private generateShortagesAndActions(
    inventoryAllocation: InventoryAllocationPlan,
    recommendedDonors: RecommendedDonorItem[],
    classification: EmergencyClassification
  ): { shortages: string[]; nextActions: string[] } {
    const shortages: string[] = [];
    const nextActions: string[] = [];

    // Check inventory shortage
    if (inventoryAllocation.shortage > 0) {
      shortages.push(
        `Inventory shortage: ${inventoryAllocation.shortage} unit(s) of ${inventoryAllocation.bloodGroup} needed.`
      );
      nextActions.push('notify_nearby_donors');
      nextActions.push('coordinate_with_other_hospitals');
    }

    // Check donor shortage
    if (recommendedDonors.length === 0) {
      shortages.push('No compatible, eligible donors found within specified radius.');
      nextActions.push('expand_search_radius');
      nextActions.push('escalate_to_admin');
    } else if (recommendedDonors.length < 3 && classification.isEmergency) {
      shortages.push('Limited donor availability for emergency request.');
      nextActions.push('prioritize_high_reliability_donors');
    }

    // Standard actions based on classification
    if (inventoryAllocation.allocatedUnits.length > 0) {
      nextActions.push('reserve_units');
    }

    if (recommendedDonors.length > 0) {
      nextActions.push('notify_donors');
    }

    if (classification.isEmergency) {
      nextActions.push('activate_emergency_protocol');
    }

    if (classification.classification === 'CRITICAL_EMERGENCY') {
      nextActions.push('escalate_to_admin');
    }

    return { shortages, nextActions };
  }

  /**
   * Main orchestration method for emergency response
   */
  public async processEmergencyResponse(
    request: EmergencyResponseRequest
  ): Promise<EmergencyResponsePlan> {
    const {
      bloodRequestId,
      bloodGroup,
      unitsRequested,
      hospitalId,
      latitude,
      longitude,
      urgency = RequestUrgency.STANDARD,
      componentType = 'RBC',
      radiusKm = 10,
      maxResults = 50,
      requestedBy,
    } = request;

    // Validate inputs
    if (!bloodGroup || !unitsRequested || !requestedBy) {
      throw new Error('Missing required fields: bloodGroup, unitsRequested, requestedBy');
    }

    const units = Number(unitsRequested);
    if (isNaN(units) || units <= 0) {
      throw new Error('unitsRequested must be a positive number');
    }

    // Step 1: Emergency Classification
    const classification = this.classifyEmergency(urgency);

    // Step 2: Blood Compatibility Check (Phase 1)
    const compatCheck = BloodCompatibilityEngine.getCompatibleDonorGroups(bloodGroup, componentType);
    if (!compatCheck.success) {
      throw new Error(`Compatibility check failed: ${compatCheck.reason}`);
    }

    // Step 3: Inventory Allocation with FEFO (Phase 3)
    const inventoryAllocation = await this.allocateInventory(bloodGroup, units, componentType);

    // Step 4-7: Smart Donor Recommendation (Phase 7 - includes Phase 2, 5, 6)
    const recommendedDonors = await this.generateDonorRecommendations(
      bloodGroup,
      hospitalId,
      latitude,
      longitude,
      urgency,
      radiusKm,
      maxResults,
      componentType
    );

    // Step 8: Generate Shortages and Next Actions
    const { shortages, nextActions } = this.generateShortagesAndActions(
      inventoryAllocation,
      recommendedDonors,
      classification
    );

    // Step 9: Audit Logging
    const auditEntry = await AuditLogger.log(
      'EMERGENCY_RESPONSE_GENERATED',
      requestedBy,
      `Emergency response plan generated for ${bloodGroup} request (${urgency}). Units: ${unitsRequested}, Inventory allocated: ${inventoryAllocation.allocatedUnits.length}, Donors recommended: ${recommendedDonors.length}`
    );

    // Step 10: Notification Hook (placeholder for Phase 9)
    // TODO: Phase 9 will implement actual notification system
    console.log('[NOTIFICATION_HOOK] Placeholder: Phase 9 will implement intelligent notifications');

    // Build response plan
    const responsePlan: EmergencyResponsePlan = {
      requestId: bloodRequestId || 'generated-' + Date.now(),
      urgency: classification.urgency,
      classification: classification.classification,
      inventoryAllocation,
      recommendedDonors,
      shortages,
      nextActions,
      auditId: auditEntry.timestamp.toISOString(),
      success: inventoryAllocation.shortage === 0 || recommendedDonors.length > 0,
      timestamp: new Date().toISOString(),
    };

    return responsePlan;
  }

  /**
   * Processes emergency response from an existing blood request ID
   */
  public async processFromBloodRequestId(
    bloodRequestId: string,
    requestedBy: string
  ): Promise<EmergencyResponsePlan> {
    // Fetch the blood request
    const bloodRequest = await prisma.bloodRequest.findUnique({
      where: { id: bloodRequestId },
      include: {
        hospital: true,
      },
    });

    if (!bloodRequest) {
      throw new Error(`Blood request with ID ${bloodRequestId} not found`);
    }

    // Build emergency request from blood request
    const emergencyRequest: EmergencyResponseRequest = {
      bloodRequestId: bloodRequest.id,
      bloodGroup: bloodRequest.blood_group,
      unitsRequested: bloodRequest.units_requested,
      hospitalId: bloodRequest.hospital_id || undefined,
      latitude: bloodRequest.hospital?.latitude,
      longitude: bloodRequest.hospital?.longitude,
      urgency: bloodRequest.urgency,
      componentType: 'RBC',
      radiusKm: 10,
      maxResults: 50,
      requestedBy,
    };

    return this.processEmergencyResponse(emergencyRequest);
  }
}

export default EmergencyResponseEngine;
