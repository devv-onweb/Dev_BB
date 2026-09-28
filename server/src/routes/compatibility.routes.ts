import { Router } from 'express';
import {
  checkCompatibility,
  getCompatibleDonors,
  getCompatibleRecipients,
} from '../controllers/compatibility.controller.js';

const router = Router();

// Route: POST /api/compatibility/check
router.post('/check', checkCompatibility);

// Route: GET /api/compatibility/donors/:recipientGroup
router.get('/donors/:recipientGroup', getCompatibleDonors);

// Route: GET /api/compatibility/recipients/:donorGroup
router.get('/recipients/:donorGroup', getCompatibleRecipients);

export default router;
