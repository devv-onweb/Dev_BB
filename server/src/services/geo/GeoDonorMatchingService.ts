/**
 * GeoDonorMatchingService.ts
 * DEV_D - Phase 5 Geo-Location Donor Matching
 *
 * Combines:
 * 1. BloodCompatibilityEngine (Phase 1)
 * 2. DonorEligibilityEngine (Phase 2)
 * 3. GeoLocationService (Phase 5 Haversine Distance)
 *
 * Privacy-Preserving: Does NOT expose exact donor coordinates or addresses to requestors.
 * Does NOT rank by reliability or AI (reserved for Phase 7 & 8).
 */

import { prisma } from '../../config/db.js';
import { BloodCompatibilityEngine } from '../BloodCompatibilityEngine.js';
import { DonorEligibilityEngine } from '../donor/DonorEligibilityEngine.js';
import { GeoLocationService, DistanceRangeCategory } from './GeoLocationService.js';

export interface GeoDonorMatchQuery {
  bloodGroup: string;
  componentType?: string;
  hospitalId?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  maxResults?: number;
}

export interface MatchedDonorResult {
  donor_id: string;
  anonymized_name: string;
  blood_group: string;
  approximate_distance_km: number;
  distance_range: DistanceRangeCategory;
  eligibility_status: string;
  location_permission_active: boolean;
  location_updated_at?: Date | null;
}

export interface GeoDonorMatchResponse {
  success: boolean;
  target_location: {
    hospital_id?: string;
    hospital_name?: string;
    latitude: number;
    longitude: number;
  };
  radius_km: number;
  recipient_blood_group: string;
  component_type: string;
  total_donors_evaluated: number;
  total_compatible: number;
  total_eligible: number;
  total_matched_in_radius: number;
  matched_donors: MatchedDonorResult[];
}

export class GeoDonorMatchingService {
  private static eligibilityEngine = new DonorEligibilityEngine();

  /**
   * Anonymizes a full name to protect donor identity.
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
   * Matches compatible, eligible nearby donors for a blood request or target location.
   */
  public static async findNearbyDonors(query: GeoDonorMatchQuery): Promise<GeoDonorMatchResponse> {
    const radiusKm = query.radiusKm && query.radiusKm > 0 ? query.radiusKm : 10;
    const maxResults = query.maxResults && query.maxResults > 0 ? query.maxResults : 50;
    const componentType = query.componentType || 'RBC';

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
      throw new Error(`Invalid target coordinates: (${targetLat}, ${targetLon})`);
    }

    // 2. Fetch all donors in system with active location permissions
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

    let compatibleCount = 0;
    let eligibleCount = 0;
    const matchedList: MatchedDonorResult[] = [];

    // 3. Evaluate each potential donor
    for (const donor of potentialDonors) {
      if (!donor.blood_group) continue;

      // Compatibility Check (Phase 1 Engine)
      const compat = BloodCompatibilityEngine.isCompatible(
        donor.blood_group,
        query.bloodGroup,
        componentType
      );

      if (!compat.compatible) continue;
      compatibleCount++;

      // Eligibility Check (Phase 2 Engine)
      const donorDonations = await prisma.donation.findMany({ where: { donor_id: donor.id } });
      const donorInput = { ...donor, donations: donorDonations };
      const eligibilityResult = this.eligibilityEngine.evaluate(donorInput);

      if (!eligibilityResult.eligible) continue;
      eligibleCount++;

      // Distance Check (Phase 5 Haversine Engine)
      const distance = GeoLocationService.calculateHaversineDistance(
        donor.latitude!,
        donor.longitude!,
        targetLat,
        targetLon
      );

      if (distance <= radiusKm) {
        matchedList.push({
          donor_id: donor.id,
          anonymized_name: this.anonymizeName(donor.name),
          blood_group: donor.blood_group,
          approximate_distance_km: Math.round(distance * 10) / 10,
          distance_range: GeoLocationService.categorizeDistanceRange(distance),
          eligibility_status: eligibilityResult.status,
          location_permission_active: true,
          location_updated_at: donor.location_updated_at || donor.updated_at,
        });
      }
    }

    // Sort by distance ascending (closest first)
    matchedList.sort((a, b) => a.approximate_distance_km - b.approximate_distance_km);

    const paginatedMatches = matchedList.slice(0, maxResults);

    return {
      success: true,
      target_location: {
        hospital_id: query.hospitalId,
        hospital_name: hospitalName,
        latitude: targetLat,
        longitude: targetLon,
      },
      radius_km: radiusKm,
      recipient_blood_group: query.bloodGroup,
      component_type: componentType,
      total_donors_evaluated: potentialDonors.length,
      total_compatible: compatibleCount,
      total_eligible: eligibleCount,
      total_matched_in_radius: matchedList.length,
      matched_donors: paginatedMatches,
    };
  }
}
