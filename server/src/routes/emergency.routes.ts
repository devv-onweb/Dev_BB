import { Router } from 'express';
import {
  processEmergencyResponse,
  processEmergencyFromRequest,
} from '../controllers/emergency.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';
import { Role } from '../types/enums.js';

const router = Router();

// POST /api/emergency/respond - Process emergency blood request response
router.post('/respond', verifyToken, authorizeRoles(Role.ADMIN, Role.HOSPITAL), processEmergencyResponse);

// POST /api/emergency/respond/:bloodRequestId - Process emergency response from existing blood request
router.post('/respond/:bloodRequestId', verifyToken, authorizeRoles(Role.ADMIN, Role.HOSPITAL), processEmergencyFromRequest);

export default router;
