/**
 * recommendation.controller.ts
 * DEV_D - Phase 7 Smart Donor Recommendation Controller
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { SmartDonorRecommendationEngine } from '../services/recommendation/SmartDonorRecommendationEngine.js';
import { AuditLogger } from '../services/AuditLogger.js';

export class RecommendationController {
  private static engine = new SmartDonorRecommendationEngine();

  /**
   * POST /api/recommendations/donors
   * Generates ranked, explainable donor recommendations for a blood request or location.
   * Access: Admin or Hospital user only.
   */
  public static async getRecommendations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      // Security check: Only Admin and Hospital roles can request donor recommendations
      if (user.role !== 'ADMIN' && user.role !== 'HOSPITAL') {
        res.status(403).json({
          success: false,
          error: 'Access denied: Smart donor recommendations are restricted to authorized hospital staff and administrators.',
        });
        return;
      }

      const { bloodGroup, componentType, hospitalId, latitude, longitude, urgency, radiusKm, maxResults } = req.body;

      if (!bloodGroup) {
        res.status(400).json({ success: false, error: 'bloodGroup parameter is required.' });
        return;
      }

      // If hospitalId not provided, default to user's linked hospital_id if hospital user
      let targetHospitalId = hospitalId;
      if (!targetHospitalId && user.role === 'HOSPITAL' && user.hospital_id) {
        targetHospitalId = user.hospital_id;
      }

      const result = await RecommendationController.engine.recommendDonors({
        bloodGroup,
        componentType,
        hospitalId: targetHospitalId,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        urgency,
        radiusKm: radiusKm ? Number(radiusKm) : 10,
        maxResults: maxResults ? Number(maxResults) : 50,
      });

      // Audit log
      await AuditLogger.log(
        'DONOR_RECOMMENDATION_REQUESTED',
        user.id,
        `Generated ${result.recommendations.length} donor recommendations for ${bloodGroup} (${urgency || 'NORMAL'}) within ${result.radius_km}km.`
      );

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message || 'Error processing donor recommendations' });
    }
  }
}
