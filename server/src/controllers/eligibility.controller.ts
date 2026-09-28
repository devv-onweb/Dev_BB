import { Response } from 'express';
import prisma from '../config/db.js';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { Role } from '../types/enums.js';
import {
  DonorEligibilityEngine,
  DonorEligibilityStatus,
  DonorEligibilityStatusType,
} from '../services/donor/DonorEligibilityEngine.js';

const engine = new DonorEligibilityEngine();

/**
 * Controller: Get logged-in donor's eligibility
 * Route: GET /api/donors/my-eligibility
 * Access: Authenticated users (Donor or Admin)
 */
export const getMyEligibility = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const [donor, donations] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.user.id } }),
      prisma.donation.findMany({
        where: { donor_id: req.user.id },
        orderBy: { donation_date: 'desc' },
      }),
    ]);

    if (!donor) {
      res.status(404).json({ success: false, message: 'Donor profile not found.' });
      return;
    }

    const donorData = {
      ...donor,
      donations,
    };

    const eligibility = engine.evaluate(donorData);

    res.status(200).json({
      success: true,
      data: eligibility,
    });
  } catch (error) {
    console.error('Error fetching donor eligibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve donor eligibility.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Get specified donor's eligibility
 * Route: GET /api/donors/:id/eligibility
 * Access: Admin or the Donor themselves
 */
export const getDonorEligibilityById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { id } = req.params;

    // Access control: only Admin or the donor themselves can view
    if (req.user.role !== Role.ADMIN && req.user.id !== id) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this donor eligibility record.',
      });
      return;
    }

    const [donor, donations] = await Promise.all([
      prisma.user.findUnique({ where: { id } }),
      prisma.donation.findMany({
        where: { donor_id: id },
        orderBy: { donation_date: 'desc' },
      }),
    ]);

    if (!donor) {
      res.status(404).json({ success: false, message: 'Donor account not found.' });
      return;
    }

    const donorData = {
      ...donor,
      donations,
    };

    const eligibility = engine.evaluate(donorData);

    res.status(200).json({
      success: true,
      data: eligibility,
    });
  } catch (error) {
    console.error('Error fetching donor eligibility by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve donor eligibility.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Admin updates donor eligibility / deferral status
 * Route: PUT /api/donors/:id/eligibility
 * Access: Admin only (verifyToken, isAdmin)
 */
export const updateDonorEligibility = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { id } = req.params;
    const { deferral_status, deferral_reason, deferral_until, medical_review_notes } = req.body;

    // Validate status if provided
    if (deferral_status) {
      const validStatuses = Object.values(DonorEligibilityStatus);
      if (!validStatuses.includes(deferral_status as DonorEligibilityStatusType)) {
        res.status(400).json({
          success: false,
          message: `Invalid deferral_status. Allowed values: ${validStatuses.join(', ')}`,
        });
        return;
      }
    }

    const existingDonor = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingDonor) {
      res.status(404).json({ success: false, message: 'Donor account not found.' });
      return;
    }

    // Prepare update data
    const updateData: any = {};
    if (deferral_status !== undefined) updateData.deferral_status = deferral_status;
    if (deferral_reason !== undefined) updateData.deferral_reason = deferral_reason ? String(deferral_reason).trim() : null;
    if (deferral_until !== undefined) updateData.deferral_until = deferral_until ? new Date(deferral_until) : null;
    if (medical_review_notes !== undefined) updateData.medical_review_notes = medical_review_notes ? String(medical_review_notes).trim() : null;

    const updatedDonor = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    const donations = await prisma.donation.findMany({
      where: { donor_id: id },
      orderBy: { donation_date: 'desc' },
    });

    const donorData = {
      ...updatedDonor,
      donations,
    };

    const newEligibility = engine.evaluate(donorData);

    res.status(200).json({
      success: true,
      message: `Donor eligibility record updated successfully to '${newEligibility.status}'.`,
      data: newEligibility,
    });
  } catch (error) {
    console.error('Error updating donor eligibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update donor eligibility.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
