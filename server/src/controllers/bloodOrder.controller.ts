import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types.js';
import prisma from '../config/db.js';
import { normalizeBloodGroup } from './auth.controller.js';

/**
 * Controller: Create a new Blood Order (USER role)
 * Route: POST /api/user/orders
 */
export const createBloodOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { bloodGroup, units, hospitalName, hospitalId, urgency, reason, neededBy } = req.body;

    if (!bloodGroup) {
      res.status(400).json({ success: false, message: 'Blood group is required.' });
      return;
    }

    const numUnits = Number(units);
    if (isNaN(numUnits) || numUnits < 1 || numUnits > 50) {
      res.status(400).json({ success: false, message: 'Units must be a number between 1 and 50.' });
      return;
    }

    if (!hospitalName || !hospitalName.trim()) {
      res.status(400).json({ success: false, message: 'Hospital name is required.' });
      return;
    }

    const normalizedBg = normalizeBloodGroup(bloodGroup);
    const parsedNeededBy = neededBy ? new Date(neededBy) : null;

    const order = await prisma.bloodOrder.create({
      data: {
        user_id: req.user.id,
        blood_group: normalizedBg,
        units: numUnits,
        hospital_name: hospitalName.trim(),
        hospital_id: hospitalId || null,
        urgency: urgency || 'STANDARD',
        reason: reason ? reason.trim() : null,
        needed_by: parsedNeededBy && !isNaN(parsedNeededBy.getTime()) ? parsedNeededBy : null,
        status: 'Pending',
      },
      include: {
        hospital: true,
      },
    });

    // Create a notification for the user confirming order receipt
    await prisma.notification.create({
      data: {
        user_id: req.user.id,
        type: 'order_status',
        title: `Blood Order Submitted (#${order.id.slice(0, 8)})`,
        message: `Your request for ${numUnits} unit(s) of ${bloodGroup} at ${hospitalName.trim()} is currently Pending approval.`,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Blood order placed successfully.',
      order,
    });
  } catch (error) {
    console.error('Error in createBloodOrder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create blood order.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Get logged-in user's blood orders
 * Route: GET /api/user/orders
 */
export const getUserBloodOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const orders = await prisma.bloodOrder.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
      include: {
        hospital: true,
      },
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error('Error in getUserBloodOrders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve blood orders.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Get all blood orders (for Admin and Hospital staff)
 * Route: GET /api/user/orders/all
 */
export const getAllBloodOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orders = await prisma.bloodOrder.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            blood_group: true,
            profile: true,
          },
        },
        hospital: true,
      },
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error('Error in getAllBloodOrders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve all blood orders.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Update blood order status (Admin / Hospital)
 * Route: PATCH /api/user/orders/:id/status
 */
export const updateBloodOrderStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const validStatuses = ['Pending', 'Approved', 'Fulfilled', 'Rejected'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
      return;
    }

    const order = await prisma.bloodOrder.update({
      where: { id },
      data: {
        status,
        admin_notes: adminNotes || undefined,
      },
      include: {
        user: true,
        hospital: true,
      },
    });

    // Notify user about status change
    await prisma.notification.create({
      data: {
        user_id: order.user_id,
        type: 'order_status',
        title: `Blood Order ${status}: ${order.units} unit(s) of ${order.blood_group}`,
        message: `Your order (#${order.id.slice(0, 8)}) for ${order.hospital_name} has been marked as ${status}.${adminNotes ? ` Note: ${adminNotes}` : ''}`,
      },
    });

    res.status(200).json({
      success: true,
      message: `Blood order status updated to ${status}.`,
      order,
    });
  } catch (error) {
    console.error('Error in updateBloodOrderStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update blood order status.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
