import { Router } from 'express';
import { createBloodRequest, getBloodRequests, fulfillBloodRequest, rejectBloodRequest, getBloodRequestById, } from '../controllers/request.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';
const router = Router();
// GET /api/requests - List requests (Admin sees all; Patients see own)
router.get('/', verifyToken, getBloodRequests);
// GET /api/requests/:id - Single request details
router.get('/:id', verifyToken, getBloodRequestById);
// POST /api/requests - Submit a blood request
router.post('/', verifyToken, createBloodRequest);
// PUT /api/requests/:id/fulfill - Admin fulfills request (deducts stock atomically)
router.put('/:id/fulfill', verifyToken, isAdmin, fulfillBloodRequest);
// PUT /api/requests/:id/reject - Admin rejects request
router.put('/:id/reject', verifyToken, isAdmin, rejectBloodRequest);
export default router;
