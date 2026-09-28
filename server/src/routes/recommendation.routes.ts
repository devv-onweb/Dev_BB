/**
 * recommendation.routes.ts
 * DEV_D - Phase 7 Smart Donor Recommendation Routes
 */

import { Router } from 'express';
import { verifyToken, isHospital } from '../middlewares/auth.middleware.js';
import { RecommendationController } from '../controllers/recommendation.controller.js';

const router = Router();

// POST /api/recommendations/donors - Get ranked donor recommendations (Hospital / Admin only)
router.post('/recommendations/donors', verifyToken, isHospital, RecommendationController.getRecommendations);

export default router;
