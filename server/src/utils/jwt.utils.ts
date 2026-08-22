import jwt from 'jsonwebtoken';
import { AuthUserPayload } from '../types/auth.types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'bloodbank_default_jwt_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a signed JWT token containing the user's essential payload
 */
export const generateToken = (payload: AuthUserPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

/**
 * Verify and decode a JWT token
 */
export const verifyTokenSecret = (token: string): AuthUserPayload => {
  return jwt.verify(token, JWT_SECRET) as AuthUserPayload;
};
