import { Router } from 'express';
import { verifyToken, isAdmin, isHospital } from '../middlewares/auth.middleware.js';
import {
  getHospitals,
  getHospitalById,
  createHospital,
  updateHospital,
  verifyHospital,
  getHospitalRequests,
  getHospitalDashboard,
} from '../controllers/hospital.controller.js';

const router = Router();

// Route: GET /api/hospitals (Authenticated)
router.get('/', verifyToken, getHospitals);

// Route: POST /api/hospitals (Admin only)
router.post('/', verifyToken, isAdmin, createHospital);

// Route: GET /api/hospitals/:id (Authenticated)
router.get('/:id', verifyToken, getHospitalById);

// Route: PUT /api/hospitals/:id (Admin or assigned Hospital user)
router.put('/:id', verifyToken, isHospital, updateHospital);

// Route: PUT /api/hospitals/:id/verify (Admin only)
router.put('/:id/verify', verifyToken, isAdmin, verifyHospital);

// Route: GET /api/hospitals/:id/requests (Admin or assigned Hospital user)
router.get('/:id/requests', verifyToken, isHospital, getHospitalRequests);

// Route: GET /api/hospitals/:id/dashboard (Admin or assigned Hospital user)
router.get('/:id/dashboard', verifyToken, isHospital, getHospitalDashboard);

export default router;
