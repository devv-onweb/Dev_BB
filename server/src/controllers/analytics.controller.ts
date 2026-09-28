/**
 * analytics.controller.ts
 * DEV_D - Phase 10 Blood Demand Analytics Controller
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { DemandAnalyticsService, AnalyticsFilter } from '../services/analytics/DemandAnalyticsService.js';
import { AuditLogger } from '../services/AuditLogger.js';

export class AnalyticsController {
  /**
   * Helper to build and validate user permissions & filter parameters
   */
  private static extractFilter(req: AuthenticatedRequest): { error?: string; filter?: AnalyticsFilter } {
    const user = req.user;
    if (!user) {
      return { error: 'Authentication required' };
    }

    if (user.role !== 'ADMIN' && user.role !== 'HOSPITAL') {
      return { error: 'Access denied: Demand analytics is restricted to authorized hospital staff and administrators.' };
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
   * GET /api/analytics/demand/summary
   */
  public static async getSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { error, filter } = AnalyticsController.extractFilter(req);
      if (error) {
        res.status(req.user ? 403 : 401).json({ success: false, error });
        return;
      }

      const data = await DemandAnalyticsService.getSummaryAnalytics(filter);
      await AuditLogger.log('DEMAND_ANALYTICS_VIEWED', req.user!.id, 'Viewed demand summary analytics');
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Error computing demand summary analytics' });
    }
  }

  /**
   * GET /api/analytics/demand/by-blood-group
   */
  public static async getByBloodGroup(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { error, filter } = AnalyticsController.extractFilter(req);
      if (error) {
        res.status(req.user ? 403 : 401).json({ success: false, error });
        return;
      }

      const data = await DemandAnalyticsService.getByBloodGroupAnalytics(filter);
      await AuditLogger.log('DEMAND_ANALYTICS_VIEWED', req.user!.id, 'Viewed demand by blood group analytics');
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Error computing blood group demand analytics' });
    }
  }

  /**
   * GET /api/analytics/demand/by-hospital
   */
  public static async getByHospital(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { error, filter } = AnalyticsController.extractFilter(req);
      if (error) {
        res.status(req.user ? 403 : 401).json({ success: false, error });
        return;
      }

      const data = await DemandAnalyticsService.getByHospitalAnalytics(filter);
      await AuditLogger.log('DEMAND_ANALYTICS_VIEWED', req.user!.id, 'Viewed demand by hospital analytics');
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Error computing hospital demand analytics' });
    }
  }

  /**
   * GET /api/analytics/demand/fulfillment
   */
  public static async getFulfillment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { error, filter } = AnalyticsController.extractFilter(req);
      if (error) {
        res.status(req.user ? 403 : 401).json({ success: false, error });
        return;
      }

      const data = await DemandAnalyticsService.getFulfillmentAnalytics(filter);
      await AuditLogger.log('DEMAND_ANALYTICS_VIEWED', req.user!.id, 'Viewed fulfillment analytics');
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Error computing fulfillment analytics' });
    }
  }

  /**
   * GET /api/analytics/demand/shortages
   */
  public static async getShortages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { error, filter } = AnalyticsController.extractFilter(req);
      if (error) {
        res.status(req.user ? 403 : 401).json({ success: false, error });
        return;
      }

      const data = await DemandAnalyticsService.getShortageAnalytics(filter);
      await AuditLogger.log('DEMAND_ANALYTICS_VIEWED', req.user!.id, 'Viewed shortage analytics');
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Error computing shortage analytics' });
    }
  }

  /**
   * GET /api/analytics/demand/wastage
   */
  public static async getWastage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { error, filter } = AnalyticsController.extractFilter(req);
      if (error) {
        res.status(req.user ? 403 : 401).json({ success: false, error });
        return;
      }

      const data = await DemandAnalyticsService.getWastageAndUtilizationAnalytics(filter);
      await AuditLogger.log('DEMAND_ANALYTICS_VIEWED', req.user!.id, 'Viewed wastage & utilization analytics');
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Error computing wastage analytics' });
    }
  }
}
