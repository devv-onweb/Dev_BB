/**
 * reliability.controller.ts
 * DEV_D - Phase 6 Donor Reliability Score API Controller
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { DonorReliabilityEngine } from '../services/donor/DonorReliabilityEngine.js';
import { AuditLogger } from '../services/AuditLogger.js';
import { prisma } from '../config/db.js';

export class ReliabilityController {
  private static engine = new DonorReliabilityEngine();

  /**
   * GET /api/donors/:id/reliability
   * Retrieves donor reliability score and detailed breakdown.
   * Access: Self (Donor) or Admin only.
   */
  public static async getDonorReliability(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const authUser = req.user;
      if (!authUser) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const targetDonorId = req.params.id;

      // Access control: Donor can view own score; Admin can view any score
      if (authUser.role !== 'ADMIN' && authUser.id !== targetDonorId) {
        res.status(403).json({
          success: false,
          error: 'Access denied: You can only view your own donor reliability score.',
        });
        return;
      }

      const donorUser = await prisma.user.findUnique({ where: { id: targetDonorId } });
      if (!donorUser) {
        res.status(404).json({ success: false, error: `Donor with ID '${targetDonorId}' not found.` });
        return;
      }

      const donations = await prisma.donation.findMany({ where: { donor_id: targetDonorId } });
      const latestApproved = donations
        .filter((d: any) => d.status === 'APPROVED')
        .sort((a: any, b: any) => new Date(b.donation_date).getTime() - new Date(a.donation_date).getTime())[0];

      const result = ReliabilityController.engine.evaluateReliability({
        id: donorUser.id,
        name: donorUser.name,
        total_requests_received: donorUser.total_requests_received,
        total_requests_accepted: donorUser.total_requests_accepted,
        total_completed_donations: donorUser.total_completed_donations || donations.filter((d: any) => d.status === 'APPROVED').length,
        total_no_shows: donorUser.total_no_shows,
        total_cancellations: donorUser.total_cancellations,
        last_donation_date: latestApproved ? latestApproved.donation_date : null,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Error fetching donor reliability score' });
    }
  }

  /**
   * POST /api/donors/:id/reliability/recalculate
   * Forces recalculation and persists updated reliability score in database.
   * Access: Admin only.
   */
  public static async recalculateScore(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const authUser = req.user;
      if (!authUser) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      if (authUser.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Access denied: Only administrators can recalculate donor reliability scores.',
        });
        return;
      }

      const targetDonorId = req.params.id;
      const donorUser = await prisma.user.findUnique({ where: { id: targetDonorId } });
      if (!donorUser) {
        res.status(404).json({ success: false, error: `Donor with ID '${targetDonorId}' not found.` });
        return;
      }

      const donations = await prisma.donation.findMany({ where: { donor_id: targetDonorId } });
      const latestApproved = donations
        .filter((d: any) => d.status === 'APPROVED')
        .sort((a: any, b: any) => new Date(b.donation_date).getTime() - new Date(a.donation_date).getTime())[0];

      const result = ReliabilityController.engine.evaluateReliability({
        id: donorUser.id,
        name: donorUser.name,
        total_requests_received: donorUser.total_requests_received,
        total_requests_accepted: donorUser.total_requests_accepted,
        total_completed_donations: donorUser.total_completed_donations || donations.filter((d: any) => d.status === 'APPROVED').length,
        total_no_shows: donorUser.total_no_shows,
        total_cancellations: donorUser.total_cancellations,
        last_donation_date: latestApproved ? latestApproved.donation_date : null,
      });

      // Persist updated score in DB
      await prisma.user.update({
        where: { id: targetDonorId },
        data: {
          reliability_score: result.score,
          reliability_last_updated: new Date(),
        },
      });

      await AuditLogger.log(
        'DONOR_RELIABILITY_RECALCULATED',
        authUser.id,
        `Recalculated reliability score for donor '${targetDonorId}': ${result.score}/100 (Status: ${result.status})`
      );

      res.status(200).json({
        success: true,
        message: 'Donor reliability score recalculated and saved successfully.',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Error recalculating donor reliability score' });
    }
  }
}
