import { Request, Response } from 'express';
import prisma from '../config/db.js';
import { AuthenticatedRequest } from '../types/auth.types.js';
import BloodCompatibilityEngine from '../services/BloodCompatibilityEngine.js';
import ExpiryManagementService, { BloodUnitStatus } from '../services/inventory/ExpiryManagementService.js';
import FEFOInventoryEngine from '../services/inventory/FEFOInventoryEngine.js';

const expiryService = new ExpiryManagementService();
const fefoEngine = new FEFOInventoryEngine();

/**
 * Controller: Get all traceable blood units
 * Route: GET /api/inventory/units
 */
export const getBloodUnits = async (req: Request, res: Response): Promise<void> => {
  try {
    const { blood_group, status, component_type = 'RBC', limit = 100 } = req.query;
    const take = Math.min(Number(limit) || 100, 200);

    const whereClause: any = {};

    if (blood_group) {
      const norm = BloodCompatibilityEngine.normalizeBloodGroup(blood_group);
      if (norm) {
        whereClause.blood_group = { in: [norm.canonical, norm.enumVal] };
      }
    }

    if (status && Object.values(BloodUnitStatus).includes(status as any)) {
      whereClause.status = status as string;
    }

    if (component_type) {
      whereClause.component_type = String(component_type).toUpperCase();
    }

    const rawUnits = await prisma.bloodUnit.findMany({
      where: whereClause,
      orderBy: { expiry_date: 'asc' }, // FEFO order
      take,
    });

    const currentDate = new Date();
    const evaluatedUnits = rawUnits.map((unit: any) => {
      const evalResult = expiryService.evaluate(unit.expiry_date, currentDate);
      return {
        ...unit,
        days_remaining: evalResult.daysRemaining,
        is_expired: evalResult.isExpired,
        is_expiring_soon: evalResult.isExpiringSoon,
        category: evalResult.category,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        total: evaluatedUnits.length,
        units: evaluatedUnits,
      },
    });
  } catch (error) {
    console.error('Error fetching blood units:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve blood units.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Add a new traceable blood unit batch
 * Route: POST /api/inventory/units
 * Access: Admin only
 */
export const createBloodUnits = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      blood_group,
      component_type = 'RBC',
      collection_date,
      expiry_date,
      volume_ml = 450,
      storage_location = 'Vault A - Main Cold Storage',
      units_count = 1,
      donation_id,
    } = req.body;

    const normGroup = BloodCompatibilityEngine.normalizeBloodGroup(blood_group);
    if (!normGroup) {
      res.status(400).json({
        success: false,
        message: 'Invalid blood group specified.',
      });
      return;
    }

    const count = Math.max(1, Math.min(Number(units_count) || 1, 50));
    const colDate = collection_date ? new Date(collection_date) : new Date();

    // Default shelf life for RBC is 35-42 days if expiry_date not explicitly provided
    let expDate: Date;
    if (expiry_date) {
      expDate = new Date(expiry_date);
    } else {
      expDate = new Date(colDate);
      expDate.setDate(expDate.getDate() + 35);
    }

    const createdUnits: any[] = [];
    const timestamp = Date.now();

    await prisma.$transaction(async (tx: any) => {
      for (let i = 0; i < count; i++) {
        const randomHex = Math.floor(1000 + Math.random() * 9000);
        const unitNumber = `UNIT-${timestamp.toString().slice(-6)}-${i + 1}${randomHex}`;

        const unit = await tx.bloodUnit.create({
          data: {
            unit_number: unitNumber,
            blood_group: normGroup.enumVal,
            component_type: String(component_type).toUpperCase(),
            collection_date: colDate,
            expiry_date: expDate,
            volume_ml: Number(volume_ml) || 450,
            storage_location: String(storage_location).trim(),
            donation_id: donation_id || null,
            status: BloodUnitStatus.AVAILABLE,
          },
        });
        createdUnits.push(unit);
      }

      // Atomically increment aggregate blood_inventory stock
      await tx.bloodInventory.upsert({
        where: { blood_group: normGroup.enumVal },
        update: {
          units_available: { increment: count },
          last_updated: new Date(),
        },
        create: {
          blood_group: normGroup.enumVal,
          units_available: count,
          last_updated: new Date(),
        },
      });
    });

    res.status(201).json({
      success: true,
      message: `Successfully created ${count} traceable ${normGroup.canonical} blood unit(s).`,
      data: {
        units_created: count,
        units: createdUnits,
      },
    });
  } catch (error) {
    console.error('Error creating blood units:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create blood units.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Get expiring blood units (<= 10 days)
 * Route: GET /api/inventory/expiring
 */
export const getExpiringUnits = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rawUnits = await prisma.bloodUnit.findMany({
      where: {
        status: { in: [BloodUnitStatus.AVAILABLE, BloodUnitStatus.EXPIRING_SOON] },
      },
      orderBy: { expiry_date: 'asc' },
    });

    const currentDate = new Date();
    const expiringUnits = rawUnits
      .map((unit: any) => {
        const evalRes = expiryService.evaluate(unit.expiry_date, currentDate);
        return { ...unit, evaluation: evalRes };
      })
      .filter((u: any) => u.evaluation.isExpiringSoon && !u.evaluation.isExpired);

    res.status(200).json({
      success: true,
      data: {
        total: expiringUnits.length,
        expiring_units: expiringUnits,
      },
    });
  } catch (error) {
    console.error('Error fetching expiring units:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve expiring blood units.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Get expired blood units
 * Route: GET /api/inventory/expired
 */
export const getExpiredUnits = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rawUnits = await prisma.bloodUnit.findMany({
      orderBy: { expiry_date: 'asc' },
    });

    const currentDate = new Date();
    const expiredUnits = rawUnits
      .map((unit: any) => {
        const evalRes = expiryService.evaluate(unit.expiry_date, currentDate);
        return { ...unit, evaluation: evalRes };
      })
      .filter((u: any) => u.evaluation.isExpired || u.status === BloodUnitStatus.EXPIRED);

    res.status(200).json({
      success: true,
      data: {
        total: expiredUnits.length,
        expired_units: expiredUnits,
      },
    });
  } catch (error) {
    console.error('Error fetching expired units:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve expired blood units.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Get inventory wastage & utilization analytics
 * Route: GET /api/inventory/analytics/wastage
 */
export const getWastageAnalytics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const allUnits = await prisma.bloodUnit.findMany();
    const analytics = expiryService.calculateWastageAnalytics(allUnits);

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Error calculating wastage analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate inventory wastage analytics.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Perform FEFO blood unit allocation check
 * Route: POST /api/inventory/allocate
 * Access: Admin only
 */
export const allocateUnitsFEFO = async (req: Request, res: Response): Promise<void> => {
  try {
    const { recipientBloodGroup, unitsRequested, componentType = 'RBC' } = req.body;

    const unitsPool = await prisma.bloodUnit.findMany();
    const result = fefoEngine.allocateFromPool(
      { recipientBloodGroup, unitsRequested: Number(unitsRequested), componentType },
      unitsPool
    );

    res.status(200).json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    console.error('Error allocating units via FEFO:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to allocate blood units via FEFO strategy.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
