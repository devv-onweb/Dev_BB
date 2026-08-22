import { Router } from 'express';
import { register, login, getProfile } from '../controllers/auth.controller.js';
import { verifyToken, isAdmin, isDonor, isPatient } from '../middlewares/auth.middleware.js';
const router = Router();
// Public Authentication Endpoints
router.post('/register', register);
router.post('/login', login);
// Protected Profile Endpoint
router.get('/me', verifyToken, getProfile);
// Role Middleware Verification / Test Endpoints
router.get('/test/admin', verifyToken, isAdmin, (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Authorized: You have access to Admin resources.',
        user: req.user,
    });
});
router.get('/test/donor', verifyToken, isDonor, (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Authorized: You have access to Donor resources.',
        user: req.user,
    });
});
router.get('/test/patient', verifyToken, isPatient, (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Authorized: You have access to Patient resources.',
        user: req.user,
    });
});
export default router;
