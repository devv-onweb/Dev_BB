/**
 * chatbot.routes.ts
 * DEV_D - Phase 12 AI Chatbot Routes
 */

import { Router, Response, NextFunction } from 'express';
import { handleChatMessage } from '../controllers/chatbot.controller.js';
import { verifyTokenSecret } from '../utils/jwt.utils.js';
import { AuthenticatedRequest } from '../types/auth.types.js';

const router = Router();

/**
 * Optional Auth Middleware:
 * If Bearer token is provided, decodes and attaches req.user.
 * If omitted, allows guest access as PATIENT role.
 */
const optionalAuth = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = verifyTokenSecret(token);
    } catch {
      // Ignore token decode error for optional auth
    }
  }
  next();
};

// POST /api/chatbot/message - Send chatbot prompt and receive role-aware response
router.post('/message', optionalAuth, handleChatMessage);

export default router;
