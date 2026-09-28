/**
 * SmartDonorRecommendationEngine.ts
 * DEV_D - Phase 7 Smart Donor Recommendation Engine
 *
 * Multi-stage pipeline:
 * 1. Blood Compatibility Filter (BloodCompatibilityEngine - Phase 1)
 * 2. Donor Eligibility Filter (DonorEligibilityEngine - Phase 2)
 * 3. Availability & Consent Filter (Phase 5)
 * 4. Geographic Distance (GeoLocationService - Phase 5)
 * 5. Donor Reliability Score (DonorReliabilityEngine - Phase 6)
 * 6. Emergency Priority & Ranking Scoring (Phase 7)
 *
 * Deterministic and explainable scoring model. NO LLM medical overrides.
 */

import { prisma } from '../../config/db.js';
import { BloodCompatibilityEngine } from '../BloodCompatibilityEngine.js';
import { DonorEligibilityEngine } from '../donor/DonorEligibilityEngine.js';
import { GeoLocationService, DistanceRangeCategory } from '../geo/GeoLocationService.js';
import { DonorReliabilityEngine } from '../donor/DonorReliabilityEngine.js';

export interface RecommendationQuery {
  bloodGroup: string;
  componentType?: string;
  hospitalId?: string;
  latitude?: number;
  longitude?: number;
  urgency?: 'NORMAL' | 'URGENT' | 'STAT_CRITICAL' | string;
  radiusKm?: number;
  maxResults?: number;
}

export interface RecommendationWeights {
  distanceWeight: number;    // Default 0.40 (40%)
  reliabilityWeight: number; // Default 0.40 (40%)
  urgencyWeight: number;     // Default 0.20 (20%)
}

export const DEFAULT_RECOMMENDATION_WEIGHTS: RecommendationWeights = {
  distanceWeight: 0.40,
  reliabilityWeight: 0.40,
  urgencyWeight: 0.20,
};

export interface RecommendedDonorItem {
  donorId: string;
  anonymizedName: string;
  bloodGroup: string;
  distanceKm: number;
  distanceRange: DistanceRangeCategory;
  eligible: boolean;
  available: boolean;
  reliabilityScore: number;
  reliabilityStatus: string;
  rankingScore: number; // 0 - 100 composite ranking
  reason: string;
}

export interface RecommendationResponse {
  success: boolean;
  target_location: {
    hospital_id?: string;
    hospital_name?: string;
    latitude: number;
    longitude: number;
  };
  recipient_blood_group: string;
  component_type: string;
  urgency: string;
  radius_km: number;
  total_evaluated: number;
  total_compatible_eligible_in_radius: number;
  recommendations: RecommendedDonorItem[];
}

export class SmartDonorRecommendationEngine {
  private static eligibilityEngine = new DonorEligibilityEngine();
  private static reliabilityEngine = new DonorReliabilityEngine();
  private weights: RecommendationWeights;

  constructor(customWeights?: Partial<RecommendationWeights>) {
    this.weights = {
      ...DEFAULT_RECOMMENDATION_WEIGHTS,
      ...customWeights,
    };
  }

  /**
   * Anonymizes a full name for privacy preservation.
   * e.g., "John Doe" -> "John D."
   */
  private static anonymizeName(fullName?: string | null): string {
    if (!fullName) return 'Donor';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const firstName = parts[0];
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    return `${firstName} ${lastInitial}.`;
  }

  /**
   * Orchestrates the donor recommendation pipeline.
   */
  public async recommendDonors(query: RecommendationQuery): Promise<RecommendationResponse> {
    const radiusKm = query.radiusKm && query.radiusKm > 0 ? query.radiusKm : 10;
    const maxResults = query.maxResults && query.maxResults > 0 ? query.maxResults : 50;
    const componentType = query.componentType || 'RBC';
    const urgency = (query.urgency || 'NORMAL').toUpperCase();

    let targetLat: number | undefined = query.latitude;
    let targetLon: number | undefined = query.longitude;
    let hospitalName: string | undefined;

    // 1. Resolve Target Coordinates (from Hospital if provided)
    if (query.hospitalId) {
      const hospital = await prisma.hospital.findUnique({ where: { id: query.hospitalId } });
      if (!hospital) {
        throw new Error(`Hospital with ID '${query.hospitalId}' not found.`);
      }
      if (!hospital.is_active) {
        throw new Error(`Hospital '${hospital.name}' is inactive.`);
      }
      targetLat = hospital.latitude;
      targetLon = hospital.longitude;
      hospitalName = hospital.name;
    }

    if (targetLat === undefined || targetLon === undefined) {
      throw new Error('Target location coordinates (latitude and longitude or valid hospitalId) must be provided.');
    }

    if (!GeoLocationService.isValidCoordinate(targetLat, targetLon)) {
      throw new Error(`Invalid target location coordinates: (${targetLat}, ${targetLon})`);
    }

    // 2. Fetch potential donors in system with active location permissions
    const allUsers = await prisma.user.findMany();
    const potentialDonors = allUsers.filter(
      (u: any) =>
        (u.role === 'DONOR' || u.role === 'PATIENT') &&
        u.latitude !== null &&
        u.latitude !== undefined &&
        u.longitude !== null &&
        u.longitude !== undefined &&
        u.location_permission !== false
    );

    const recommendedList: RecommendedDonorItem[] = [];

    // 3. Pipeline Filtering & Scoring
    for (const donor of potentialDonors) {
      if (!donor.blood_group) continue;

      // Step A: Compatibility Filter (Phase 1)
      const compatResult = BloodCompatibilityEngine.isCompatible(
        donor.blood_group,
        query.bloodGroup,
        componentType
      );
      if (!compatResult.compatible) continue;

      // Step B: Eligibility Filter (Phase 2)
      const donorDonations = await prisma.donation.findMany({ where: { donor_id: donor.id } });
      const donorInput = { ...donor, donations: donorDonations };
      const eligibilityResult = SmartDonorRecommendationEngine.eligibilityEngine.evaluate(donorInput);
      if (!eligibilityResult.eligible) continue;

      // Step C: Distance Filter (Phase 5)
      const distanceKm = GeoLocationService.calculateHaversineDistance(
        donor.latitude!,
        donor.longitude!,
        targetLat,
        targetLon
      );
      if (distanceKm > radiusKm) continue;

      // Step D: Reliability Score (Phase 6)
      const latestApproved = donorDonations
        .filter((d: any) => d.status === 'APPROVED')
        .sort((a: any, b: any) => new Date(b.donation_date).getTime() - new Date(a.donation_date).getTime())[0];

      const reliabilityResult = SmartDonorRecommendationEngine.reliabilityEngine.evaluateReliability({
        id: donor.id,
        name: donor.name,
        total_requests_received: donor.total_requests_received,
        total_requests_accepted: donor.total_requests_accepted,
        total_completed_donations: donor.total_completed_donations || donorDonations.filter((d: any) => d.status === 'APPROVED').length,
        total_no_shows: donor.total_no_shows,
        total_cancellations: donor.total_cancellations,
        last_donation_date: latestApproved ? latestApproved.donation_date : null,
      });

      // Step E: Compute Composite Ranking Score
      // Distance Sub-Score (closer is higher): 100 * (1 - distance / radius)
      const distanceSubScore = Math.max(0, Math.round(100 * (1 - distanceKm / radiusKm)));
      const reliabilitySubScore = reliabilityResult.score;

      // Urgency Sub-Score
      const isUrgent = urgency === 'URGENT' || urgency === 'STAT_CRITICAL';
      const urgencySubScore = isUrgent ? (reliabilityResult.score >= 80 ? 100 : 50) : 0;

      const w = this.weights;
      const compositeScore =
        distanceSubScore * w.distanceWeight +
        reliabilitySubScore * w.reliabilityWeight +
        urgencySubScore * w.urgencyWeight;

      const rankingScore = Math.round(compositeScore * 10) / 10;
      const distanceRange = GeoLocationService.categorizeDistanceRange(distanceKm);

      // Step F: Build Natural Language Reasoning
      const distanceDesc = `${distanceKm.toFixed(1)} km away (${distanceRange})`;
      const reliabilityDesc = `${reliabilityResult.score}/100 reliability (${reliabilityResult.status.toLowerCase()})`;
      const urgencyDesc = isUrgent ? ', prioritized for urgent request' : '';

      const reason = `Compatible (${donor.blood_group}), eligible, ${distanceDesc}, ${reliabilityDesc}${urgencyDesc}.`;

      recommendedList.push({
        donorId: donor.id,
        anonymizedName: SmartDonorRecommendationEngine.anonymizeName(donor.name),
        bloodGroup: donor.blood_group,
        distanceKm: Math.round(distanceKm * 10) / 10,
        distanceRange,
        eligible: true,
        available: true,
        reliabilityScore: reliabilityResult.score,
        reliabilityStatus: reliabilityResult.status,
        rankingScore,
        reason,
      });
    }

    // Sort by rankingScore descending (highest recommendation first)
    recommendedList.sort((a, b) => b.rankingScore - a.rankingScore);

    const paginated = recommendedList.slice(0, maxResults);

    return {
      success: true,
      target_location: {
        hospital_id: query.hospitalId,
        hospital_name: hospitalName,
        latitude: targetLat,
        longitude: targetLon,
      },
      recipient_blood_group: query.bloodGroup,
      component_type: componentType,
      urgency,
      radius_km: radiusKm,
      total_evaluated: potentialDonors.length,
      total_compatible_eligible_in_radius: recommendedList.length,
      recommendations: paginated,
    };
  }
}
