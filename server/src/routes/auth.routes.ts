import { Router, Response } from 'express';
import { register, registerUser, login, getProfile, updateProfile } from '../controllers/auth.controller.js';
import { verifyToken, isAdmin, isDonor, isPatient, isUser } from '../middlewares/auth.middleware.js';
import { AuthenticatedRequest } from '../types/auth.types.js';

const router = Router();

// Public Authentication Endpoints
router.post('/register', register);
router.post('/register-user', registerUser);
router.post('/login', login);

// Protected Profile Endpoints
router.get('/me', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);

// Role Middleware Verification / Test Endpoints
router.get('/test/admin', verifyToken, isAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Authorized: You have access to Admin resources.',
    user: req.user,
  });
});

router.get('/test/donor', verifyToken, isDonor, (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Authorized: You have access to Donor resources.',
    user: req.user,
  });
});

router.get('/test/patient', verifyToken, isPatient, (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Authorized: You have access to Patient resources.',
    user: req.user,
  });
});

export default router;
