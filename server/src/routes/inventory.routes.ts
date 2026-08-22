import { Router } from 'express';
import { getInventory } from '../controllers/inventory.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

// GET /api/inventory - Accessible to all authenticated users
router.get('/', verifyToken, getInventory);

export default router;
