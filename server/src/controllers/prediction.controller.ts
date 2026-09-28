/**
 * prediction.controller.ts
 * DEV_D - Phase 11 Blood Demand Prediction Controller
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { DemandPredictionService, PredictionFilter } from '../services/prediction/DemandPredictionService.js';
import { AuditLogger } from '../services/AuditLogger.js';

export class PredictionController {
  /**
   * Helper to validate permissions & extract prediction filter parameters
   */
  private static extractFilter(req: AuthenticatedRequest): { error?: string; filter?: PredictionFilter } {
    const user = req.user;
    if (!user) {
      return { error: 'Authentication required' };
    }

    if (user.role !== 'ADMIN' && user.role !== 'HOSPITAL') {
      return { error: 'Access denied: Demand predictions are restricted to authorized hospital staff and administrators.' };
    }

    const { hospitalId, startDate, endDate } = req.query;

    let targetHospitalId = typeof hospitalId === 'string' ? hospitalId : undefined;
    if (user.role === 'HOSPITAL' && user.hospital_id) {
      targetHospitalId = user.hospital_id;
    }

    return {
      filter: {
        hospitalId: targetHospitalId,
        startDate: typeof startDate === 'string' ? startDate : undefined,
        endDate: typeof endDate === 'string' ? endDate : undefined,
      },
    };
  }

  /**
   * GET /api/prediction/demand/7-day
   */
  public static async get7DayForecast(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { error, filter } = PredictionController.extractFilter(req);
      if (error) {
        res.status(req.user ? 403 : 401).json({ success: false, error });
        return;
      }

      const data = await DemandPredictionService.getForecast(7, filter);
      await AuditLogger.log('DEMAND_PREDICTION_VIEWED', req.user!.id, `Viewed 7-day demand forecast (Confidence: ${data.confidenceLevel})`);
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Error generating 7-day demand forecast' });
    }
  }

  /**
   * GET /api/prediction/demand/30-day
   */
  public static async get30DayForecast(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { error, filter } = PredictionController.extractFilter(req);
      if (error) {
        res.status(req.user ? 403 : 401).json({ success: false, error });
        return;
      }

      const data = await DemandPredictionService.getForecast(30, filter);
      await AuditLogger.log('DEMAND_PREDICTION_VIEWED', req.user!.id, `Viewed 30-day demand forecast (Confidence: ${data.confidenceLevel})`);
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Error generating 30-day demand forecast' });
    }
  }

  /**
   * GET /api/prediction/demand/by-blood-group
   */
  public static async getByBloodGroupForecast(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { error, filter } = PredictionController.extractFilter(req);
      if (error) {
        res.status(req.user ? 403 : 401).json({ success: false, error });
        return;
      }

      const data = await DemandPredictionService.getBloodGroupForecast(filter);
      await AuditLogger.log('DEMAND_PREDICTION_VIEWED', req.user!.id, 'Viewed blood group demand predictions');
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Error generating blood group predictions' });
    }
  }

  /**
   * GET /api/prediction/demand/shortages
   */
  public static async getShortageWarnings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { error, filter } = PredictionController.extractFilter(req);
      if (error) {
        res.status(req.user ? 403 : 401).json({ success: false, error });
        return;
      }

      const data = await DemandPredictionService.getShortageWarnings(filter);
      await AuditLogger.log('DEMAND_PREDICTION_VIEWED', req.user!.id, 'Viewed predicted shortage warnings');
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Error generating shortage warning predictions' });
    }
  }
}
