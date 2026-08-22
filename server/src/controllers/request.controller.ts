import { Response } from 'express';
import { RequestStatus, RequestUrgency, BloodGroup, Role } from '../types/enums.js';
import prisma from '../config/db.js';
import { AuthenticatedRequest } from '../types/auth.types.js';

/**
 * Controller: Submit a new blood request
 * Route: POST /api/requests
 * Access: Authenticated users (Patients, Hospitals, Admins)
 */
export const createBloodRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { blood_group, units_requested, hospital_name, urgency = RequestUrgency.NORMAL } = req.body;

    // 1. Validation
    if (!blood_group || !units_requested || !hospital_name) {
      res.status(400).json({
        success: false,
        message: 'Validation failed. Blood group, units requested, and hospital name are required.',
      });
      return;
    }

    if (!Object.values(BloodGroup).includes(blood_group as any)) {
      res.status(400).json({
        success: false,
        message: `Invalid blood group. Supported values: ${Object.values(BloodGroup).join(', ')}`,
      });
      return;
    }

    const units = Number(units_requested);
    if (isNaN(units) || units <= 0 || units > 100) {
      res.status(400).json({
        success: false,
        message: 'Units requested must be a positive integer between 1 and 100.',
      });
      return;
    }

    if (!Object.values(RequestUrgency).includes(urgency as any)) {
      res.status(400).json({
        success: false,
        message: 'Invalid urgency level. Allowed values: "NORMAL" or "URGENT".',
      });
      return;
    }

    // 2. Create blood request record
    const bloodRequest = await prisma.bloodRequest.create({
      data: {
        requester_id: req.user.id,
        blood_group,
        units_requested: units,
        hospital_name: hospital_name.trim(),
        urgency,
        status: RequestStatus.PENDING,
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            blood_group: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Blood request submitted successfully and is PENDING administrative review.',
      data: bloodRequest,
    });
  } catch (error) {
    console.error('Error creating blood request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while submitting blood request.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Get blood requests (Admin views all; Patients view their own)
 * Route: GET /api/requests
 * Access: Authenticated users (verifyToken)
 */
export const getBloodRequests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { status, urgency, blood_group, limit = 50, page = 1 } = req.query;
    const take = Math.min(Number(limit) || 50, 100);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

    const whereClause: any = {};

    // Role-based access control: Non-admins only see their own requests
    if (req.user.role !== Role.ADMIN) {
      whereClause.requester_id = req.user.id;
    }

    // Optional query filters
    if (status && Object.values(RequestStatus).includes(status as any)) {
      whereClause.status = status as string;
    }

    if (urgency && Object.values(RequestUrgency).includes(urgency as any)) {
      whereClause.urgency = urgency as string;
    }

    if (blood_group && Object.values(BloodGroup).includes(blood_group as any)) {
      whereClause.blood_group = blood_group as string;
    }

    const [requests, totalCount] = await Promise.all([
      prisma.bloodRequest.findMany({
        where: whereClause,
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              blood_group: true,
            },
          },
        },
        orderBy: [{ urgency: 'desc' }, { created_at: 'desc' }],
        take,
        skip,
      }),
      prisma.bloodRequest.count({ where: whereClause }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalCount,
        page: Number(page) || 1,
        limit: take,
        requests,
      },
    });
  } catch (error) {
    console.error('Error fetching blood requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve blood requests.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Admin approves and fulfills a blood request
 * Route: PUT /api/requests/:id/fulfill
 * Access: Admin only (verifyToken, isAdmin)
 * Logic: Checks if inventory has sufficient units. If yes, deducts units and marks FULFILLED. If insufficient, returns 400 error.
 */
export const fulfillBloodRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 1. Fetch the blood request
    const bloodRequest = await prisma.bloodRequest.findUnique({
      where: { id },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!bloodRequest) {
      res.status(404).json({
        success: false,
        message: `Blood request with ID ${id} not found.`,
      });
      return;
    }

    if (bloodRequest.status === RequestStatus.FULFILLED) {
      res.status(400).json({
        success: false,
        message: 'This blood request has already been fulfilled.',
      });
      return;
    }

    if (bloodRequest.status === RequestStatus.REJECTED) {
      res.status(400).json({
        success: false,
        message: 'Cannot fulfill a rejected blood request.',
      });
      return;
    }

    // 2. Atomic Transaction for Sufficiency Check & Deduction
    try {
      const transactionResult = await prisma.$transaction(async (tx) => {
        // 2a. Check Inventory level
        const inventory = await tx.bloodInventory.findUnique({
          where: { blood_group: bloodRequest.blood_group },
        });

        const available = inventory ? inventory.units_available : 0;

        if (available < bloodRequest.units_requested) {
          const shortageError: any = new Error('INSUFFICIENT_STOCK');
          shortageError.available = available;
          shortageError.requested = bloodRequest.units_requested;
          shortageError.blood_group = bloodRequest.blood_group;
          throw shortageError;
        }

        // 2b. Deduct stock from inventory
        const updatedInventory = await tx.bloodInventory.update({
          where: { blood_group: bloodRequest.blood_group },
          data: {
            units_available: { decrement: bloodRequest.units_requested },
            last_updated: new Date(),
          },
        });

        // 2c. Mark request status as FULFILLED
        const updatedRequest = await tx.bloodRequest.update({
          where: { id: bloodRequest.id },
          data: {
            status: RequestStatus.FULFILLED,
          },
          include: {
            requester: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        });

        return { updatedRequest, updatedInventory };
      });

      res.status(200).json({
        success: true,
        message: `Blood request fulfilled successfully! Deducted ${bloodRequest.units_requested} unit(s) of ${bloodRequest.blood_group}.`,
        data: {
          request: transactionResult.updatedRequest,
          remaining_inventory: transactionResult.updatedInventory,
        },
      });
    } catch (txError: any) {
      if (txError.message === 'INSUFFICIENT_STOCK') {
        res.status(400).json({
          success: false,
          message: `Insufficient blood inventory. Available: ${txError.available} unit(s), Requested: ${txError.requested} unit(s) for blood group ${txError.blood_group}.`,
          current_available: txError.available,
          units_requested: txError.requested,
          blood_group: txError.blood_group,
        });
        return;
      }
      throw txError;
    }
  } catch (error) {
    console.error('Error fulfilling blood request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fulfill blood request.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Admin rejects a blood request
 * Route: PUT /api/requests/:id/reject
 * Access: Admin only (verifyToken, isAdmin)
 */
export const rejectBloodRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const bloodRequest = await prisma.bloodRequest.findUnique({
      where: { id },
    });

    if (!bloodRequest) {
      res.status(404).json({
        success: false,
        message: `Blood request with ID ${id} not found.`,
      });
      return;
    }

    if (bloodRequest.status === RequestStatus.FULFILLED) {
      res.status(400).json({
        success: false,
        message: 'Cannot reject a request that has already been fulfilled.',
      });
      return;
    }

    const updatedRequest = await prisma.bloodRequest.update({
      where: { id },
      data: { status: RequestStatus.REJECTED },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Blood request status marked as REJECTED.',
      data: updatedRequest,
    });
  } catch (error) {
    console.error('Error rejecting blood request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject blood request.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Get single blood request details by ID
 * Route: GET /api/requests/:id
 * Access: Admin or the Requester
 */
export const getBloodRequestById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { id } = req.params;

    const request = await prisma.bloodRequest.findUnique({
      where: { id },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            blood_group: true,
          },
        },
      },
    });

    if (!request) {
      res.status(404).json({ success: false, message: 'Blood request not found.' });
      return;
    }

    // Access check: Only Admin or the requester can view
    if (req.user.role !== Role.ADMIN && request.requester_id !== req.user.id) {
      res.status(403).json({ success: false, message: 'Forbidden: Access to this blood request is denied.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error('Error fetching blood request by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve blood request details.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
