import { Response } from 'express';
import { EmergencyResponseEngine, EmergencyResponseRequest } from '../services/emergency/EmergencyResponseEngine.js';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { Role } from '../types/enums.js';

const emergencyEngine = new EmergencyResponseEngine();

/**
 * Controller: Process emergency blood request response
 * Route: POST /api/emergency/respond
 * Access: Admin, Hospital staff only
 */
export const processEmergencyResponse = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    // Role-based access control
    if (req.user.role !== Role.ADMIN && req.user.role !== Role.HOSPITAL) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Emergency response processing is restricted to Admin and Hospital staff.',
      });
      return;
    }

    const emergencyRequest: EmergencyResponseRequest = {
      ...req.body,
      requestedBy: req.user.id,
    };

    // Validate required fields
    if (!emergencyRequest.bloodGroup || !emergencyRequest.unitsRequested) {
      res.status(400).json({
        success: false,
        message: 'Validation failed. bloodGroup and unitsRequested are required.',
      });
      return;
    }

    // Process emergency response
    const responsePlan = await emergencyEngine.processEmergencyResponse(emergencyRequest);

    res.status(200).json({
      success: true,
      message: 'Emergency response plan generated successfully.',
      data: responsePlan,
    });
  } catch (error) {
    console.error('Error processing emergency response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process emergency response.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Process emergency response from existing blood request ID
 * Route: POST /api/emergency/respond/:bloodRequestId
 * Access: Admin, Hospital staff only
 */
export const processEmergencyFromRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    // Role-based access control
    if (req.user.role !== Role.ADMIN && req.user.role !== Role.HOSPITAL) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Emergency response processing is restricted to Admin and Hospital staff.',
      });
      return;
    }

    const { bloodRequestId } = req.params;

    if (!bloodRequestId) {
      res.status(400).json({
        success: false,
        message: 'Blood request ID is required.',
      });
      return;
    }

    // Process emergency response from blood request
    const responsePlan = await emergencyEngine.processFromBloodRequestId(bloodRequestId, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Emergency response plan generated successfully from blood request.',
      data: responsePlan,
    });
  } catch (error) {
    console.error('Error processing emergency response from request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process emergency response from blood request.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
