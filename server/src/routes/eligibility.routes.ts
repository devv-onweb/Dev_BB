import { Router } from 'express';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';
import {
  getMyEligibility,
  getDonorEligibilityById,
  updateDonorEligibility,
} from '../controllers/eligibility.controller.js';
import { ReliabilityController } from '../controllers/reliability.controller.js';

const router = Router();

// Route: GET /api/donors/my-eligibility (Logged-in donor)
router.get('/my-eligibility', verifyToken, getMyEligibility);

// Route: GET /api/donors/:id/eligibility (Admin or self)
router.get('/:id/eligibility', verifyToken, getDonorEligibilityById);

// Route: PUT /api/donors/:id/eligibility (Admin only)
router.put('/:id/eligibility', verifyToken, isAdmin, updateDonorEligibility);

// Route: GET /api/donors/:id/reliability (Admin or self)
router.get('/:id/reliability', verifyToken, ReliabilityController.getDonorReliability);

// Route: POST /api/donors/:id/reliability/recalculate (Admin only)
router.post('/:id/reliability/recalculate', verifyToken, isAdmin, ReliabilityController.recalculateScore);

export default router;
