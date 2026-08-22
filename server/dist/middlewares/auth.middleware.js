import { Role } from '../types/enums.js';
import { verifyTokenSecret } from '../utils/jwt.utils.js';
/**
 * Middleware: verifyToken
 * Validates JWT token from the Authorization header and attaches the user payload to req.user.
 */
export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            message: 'Access denied. No authentication token provided or malformed authorization header.',
        });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = verifyTokenSecret(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid, expired, or corrupted authentication token.',
            error: error instanceof Error ? error.message : 'Unknown token verification error',
        });
        return;
    }
};
/**
 * Middleware: isAdmin
 * Ensures the authenticated user has the ADMIN role.
 */
export const isAdmin = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required. Please log in first.',
        });
        return;
    }
    if (req.user.role !== Role.ADMIN) {
        res.status(403).json({
            success: false,
            message: 'Forbidden. Access restricted to Administrator accounts only.',
        });
        return;
    }
    next();
};
/**
 * Middleware: isDonor
 * Ensures the authenticated user has the DONOR role.
 */
export const isDonor = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required. Please log in first.',
        });
        return;
    }
    if (req.user.role !== Role.DONOR && req.user.role !== Role.ADMIN) {
        res.status(403).json({
            success: false,
            message: 'Forbidden. Access restricted to Donor accounts.',
        });
        return;
    }
    next();
};
/**
 * Middleware: isPatient
 * Ensures the authenticated user has the PATIENT role.
 */
export const isPatient = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required. Please log in first.',
        });
        return;
    }
    if (req.user.role !== Role.PATIENT && req.user.role !== Role.ADMIN) {
        res.status(403).json({
            success: false,
            message: 'Forbidden. Access restricted to Patient/Requester accounts.',
        });
        return;
    }
    next();
};
/**
 * Higher-order middleware to authorize any specified list of roles
 */
export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required. Please log in first.',
            });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: `Forbidden. Requires one of the following roles: [${allowedRoles.join(', ')}].`,
            });
            return;
        }
        next();
    };
};
