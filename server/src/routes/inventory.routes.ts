import { Router } from 'express';
import { getInventory } from '../controllers/inventory.controller.js';
import {
  getBloodUnits,
  createBloodUnits,
  getExpiringUnits,
  getExpiredUnits,
  getWastageAnalytics,
  allocateUnitsFEFO,
} from '../controllers/unit.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// GET /api/inventory - Current aggregate stock grouped by blood group
router.get('/', verifyToken, getInventory);

// GET /api/inventory/units - Traceable blood units breakdown
router.get('/units', verifyToken, getBloodUnits);

// POST /api/inventory/units - Create traceable blood unit batch (Admin only)
router.post('/units', verifyToken, isAdmin, createBloodUnits);

// GET /api/inventory/expiring - Expiring units (<= 10 days)
router.get('/expiring', verifyToken, getExpiringUnits);

// GET /api/inventory/expired - Expired units
router.get('/expired', verifyToken, getExpiredUnits);

// GET /api/inventory/analytics/wastage - Wastage and expiry analytics
router.get('/analytics/wastage', verifyToken, getWastageAnalytics);

// POST /api/inventory/allocate - FEFO allocation check
router.post('/allocate', verifyToken, allocateUnitsFEFO);

export default router;
