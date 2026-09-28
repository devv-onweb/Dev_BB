/**
 * geo.routes.ts
 * DEV_D - Phase 5 Geo-Location Routes
 */

import { Router } from 'express';
import { verifyToken, isHospital } from '../middlewares/auth.middleware.js';
import { GeoController } from '../controllers/geo.controller.js';

const router = Router();

// POST /api/matching/geo - Donor matching by location (Admin / Hospital staff only)
router.post('/matching/geo', verifyToken, isHospital, GeoController.findNearbyDonors);

// PUT /api/donors/location - Update donor location & consent settings
router.put('/donors/location', verifyToken, GeoController.updateLocation);

export default router;
