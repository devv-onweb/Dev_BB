/**
 * prediction.routes.ts
 * DEV_D - Phase 11 Blood Demand Prediction Routes
 */

import { Router } from 'express';
import { verifyToken, isHospital } from '../middlewares/auth.middleware.js';
import { PredictionController } from '../controllers/prediction.controller.js';

const router = Router();

// GET /api/prediction/demand/7-day - 7-Day Forecast
router.get('/demand/7-day', verifyToken, isHospital, PredictionController.get7DayForecast);

// GET /api/prediction/demand/30-day - 30-Day Forecast
router.get('/demand/30-day', verifyToken, isHospital, PredictionController.get30DayForecast);

// GET /api/prediction/demand/by-blood-group - Forecast by Blood Group
router.get('/demand/by-blood-group', verifyToken, isHospital, PredictionController.getByBloodGroupForecast);

// GET /api/prediction/demand/shortages - Predicted Shortage Warnings
router.get('/demand/shortages', verifyToken, isHospital, PredictionController.getShortageWarnings);

export default router;
