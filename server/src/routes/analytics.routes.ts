/**
 * analytics.routes.ts
 * DEV_D - Phase 10 Blood Demand Analytics Routes
 */

import { Router } from 'express';
import { verifyToken, isHospital } from '../middlewares/auth.middleware.js';
import { AnalyticsController } from '../controllers/analytics.controller.js';

const router = Router();

// GET /api/analytics/demand/summary - Demand Summary
router.get('/demand/summary', verifyToken, isHospital, AnalyticsController.getSummary);

// GET /api/analytics/demand/by-blood-group - Demand by Blood Group
router.get('/demand/by-blood-group', verifyToken, isHospital, AnalyticsController.getByBloodGroup);

// GET /api/analytics/demand/by-hospital - Demand by Hospital
router.get('/demand/by-hospital', verifyToken, isHospital, AnalyticsController.getByHospital);

// GET /api/analytics/demand/fulfillment - Fulfillment Metrics
router.get('/demand/fulfillment', verifyToken, isHospital, AnalyticsController.getFulfillment);

// GET /api/analytics/demand/shortages - Shortage & Supply vs Demand Metrics
router.get('/demand/shortages', verifyToken, isHospital, AnalyticsController.getShortages);

// GET /api/analytics/demand/wastage - Wastage & Inventory Utilization Metrics
router.get('/demand/wastage', verifyToken, isHospital, AnalyticsController.getWastage);

export default router;
