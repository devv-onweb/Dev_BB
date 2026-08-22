import { Router } from 'express';
import { createDonation, updateDonationStatus, getAllDonations, getMyDonations, getDonationById, } from '../controllers/donation.controller.js';
import { verifyToken, isAdmin, isDonor } from '../middlewares/auth.middleware.js';
const router = Router();
// GET /api/donations/my-donations - Logged-in donor donation history
router.get('/my-donations', verifyToken, isDonor, getMyDonations);
// GET /api/donations/:id - Single donation details
router.get('/:id', verifyToken, getDonationById);
// GET /api/donations - All donations (Admin sees all; Donors see own)
router.get('/', verifyToken, getAllDonations);
// POST /api/donations - Submit new donation log (Donors only)
router.post('/', verifyToken, isDonor, createDonation);
// PUT /api/donations/:id/status - Approve/Reject donation (Admin only)
router.put('/:id/status', verifyToken, isAdmin, updateDonationStatus);
export default router;
