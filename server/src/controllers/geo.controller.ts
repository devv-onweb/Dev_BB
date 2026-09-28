/**
 * geo.controller.ts
 * DEV_D - Phase 5 Geo-Location Donor Matching API Controller
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { GeoDonorMatchingService } from '../services/geo/GeoDonorMatchingService.js';
import { AuditLogger } from '../services/AuditLogger.js';
import { prisma } from '../config/db.js';

export class GeoController {
  /**
   * POST /api/matching/geo
   * Perform geo-location donor matching for a blood request or hospital target location.
   * Access: Admin or Hospital user only.
   */
  public static async findNearbyDonors(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      // Security check: Only Admin and Hospital roles can perform donor matching
      if (user.role !== 'ADMIN' && user.role !== 'HOSPITAL') {
        res.status(403).json({
          success: false,
          error: 'Access denied: Donor geo-matching is restricted to authorized hospital staff and administrators.',
        });
        return;
      }

      const { bloodGroup, componentType, hospitalId, latitude, longitude, radiusKm, maxResults } = req.body;

      if (!bloodGroup) {
        res.status(400).json({ success: false, error: 'bloodGroup parameter is required.' });
        return;
      }

      // If user is a Hospital user, default to their linked hospitalId if not provided
      let targetHospitalId = hospitalId;
      if (!targetHospitalId && user.role === 'HOSPITAL' && user.hospital_id) {
        targetHospitalId = user.hospital_id;
      }

      const result = await GeoDonorMatchingService.findNearbyDonors({
        bloodGroup,
        componentType,
        hospitalId: targetHospitalId,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        radiusKm: radiusKm ? Number(radiusKm) : 10,
        maxResults: maxResults ? Number(maxResults) : 50,
      });

      // Audit Log
      await AuditLogger.log(
        'GEO_DONOR_MATCHING',
        user.id,
        `Performed geo donor matching for blood group ${bloodGroup} within ${result.radius_km}km. Matches found: ${result.total_matched_in_radius}`
      );

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message || 'Error processing donor geo matching' });
    }
  }

  /**
   * PUT /api/donors/location
   * Update donor location coordinates and privacy settings.
   * Access: Authenticated user (self) or Admin.
   */
  public static async updateLocation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { latitude, longitude, location_permission, service_radius_km } = req.body;

      if (latitude === undefined || longitude === undefined) {
        res.status(400).json({ success: false, error: 'latitude and longitude are required.' });
        return;
      }

      const latNum = Number(latitude);
      const lonNum = Number(longitude);

      if (isNaN(latNum) || latNum < -90 || latNum > 90 || isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
        res.status(400).json({ success: false, error: 'Invalid latitude (-90 to 90) or longitude (-180 to 180) values.' });
        return;
      }

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          latitude: latNum,
          longitude: lonNum,
          location_updated_at: new Date(),
          location_permission: location_permission !== undefined ? Boolean(location_permission) : true,
          service_radius_km: service_radius_km ? Number(service_radius_km) : 10.0,
        },
      });

      await AuditLogger.log(
        'DONOR_LOCATION_UPDATED',
        user.id,
        `Updated location coordinates to (${latNum}, ${lonNum}) with permission=${updatedUser.location_permission}`
      );

      res.status(200).json({
        success: true,
        message: 'Location updated successfully',
        location: {
          latitude: updatedUser.latitude,
          longitude: updatedUser.longitude,
          location_updated_at: updatedUser.location_updated_at,
          location_permission: updatedUser.location_permission,
          service_radius_km: updatedUser.service_radius_km,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Error updating location' });
    }
  }
}
