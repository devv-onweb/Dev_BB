import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { Role } from '../types/enums.js';
import { BloodCareAIChatbot } from '../services/chatbot/BloodCareAIChatbot.js';

/**
 * Controller: handleChatMessage
 * POST /api/chatbot/message
 */
export const handleChatMessage = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { message, role: bodyRole, hospitalId, requestId } = req.body;

    if (typeof message !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Message field must be a valid string.',
      });
      return;
    }

    // Determine user role and user ID from authenticated token (preferred) or request body
    const userId = req.user?.id || 'anonymous-user';
    const role = (req.user?.role || bodyRole || Role.PATIENT) as Role;

    const result = await BloodCareAIChatbot.processMessage({
      message,
      userId,
      role,
      hospitalId,
      requestId,
    });

    res.status(200).json({
      success: true,
      reply: result.reply,
      suggestions: result.suggestions,
      safe: result.safe,
      intent: result.intent,
      emergencyRedirect: result.emergencyRedirect || false,
      data: result.data || null,
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chatbot request.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
