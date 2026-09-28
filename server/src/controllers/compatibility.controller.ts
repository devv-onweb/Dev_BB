import { Request, Response } from 'express';
import BloodCompatibilityEngine from '../services/BloodCompatibilityEngine.js';

/**
 * Controller: Check compatibility between donor blood group and recipient blood group
 * Route: POST /api/compatibility/check
 * Access: Public / Authenticated
 */
export const checkCompatibility = (req: Request, res: Response): void => {
  try {
    const { donorBloodGroup, recipientBloodGroup, componentType = 'RBC' } = req.body || {};

    if (!donorBloodGroup || !recipientBloodGroup) {
      res.status(400).json({
        compatible: false,
        reason: 'Both donorBloodGroup and recipientBloodGroup are required fields.',
        error: 'INVALID_INPUT',
      });
      return;
    }

    const result = BloodCompatibilityEngine.isCompatible(donorBloodGroup, recipientBloodGroup, componentType);

    if (result.error === 'INVALID_BLOOD_GROUP' || result.error === 'UNSUPPORTED_COMPONENT_TYPE') {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error checking blood compatibility:', error);
    res.status(500).json({
      compatible: false,
      reason: 'Internal server error while evaluating blood compatibility.',
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
};

/**
 * Controller: Get compatible donor blood groups for a given recipient
 * Route: GET /api/compatibility/donors/:recipientGroup
 */
export const getCompatibleDonors = (req: Request, res: Response): void => {
  try {
    const { recipientGroup } = req.params;
    const { componentType = 'RBC' } = req.query;

    const result = BloodCompatibilityEngine.getCompatibleDonorGroups(
      recipientGroup,
      typeof componentType === 'string' ? componentType : 'RBC'
    );

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching compatible donor blood groups:', error);
    res.status(500).json({
      success: false,
      reason: 'Internal server error while querying compatible donor groups.',
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
};

/**
 * Controller: Get compatible recipient blood groups for a given donor
 * Route: GET /api/compatibility/recipients/:donorGroup
 */
export const getCompatibleRecipients = (req: Request, res: Response): void => {
  try {
    const { donorGroup } = req.params;
    const { componentType = 'RBC' } = req.query;

    const result = BloodCompatibilityEngine.getCompatibleRecipientGroups(
      donorGroup,
      typeof componentType === 'string' ? componentType : 'RBC'
    );

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching compatible recipient blood groups:', error);
    res.status(500).json({
      success: false,
      reason: 'Internal server error while querying compatible recipient groups.',
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
};
