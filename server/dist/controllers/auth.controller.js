import bcrypt from 'bcryptjs';
import { Role, BloodGroup } from '../types/enums.js';
import prisma from '../config/db.js';
import { generateToken } from '../utils/jwt.utils.js';
const SALT_ROUNDS = 10;
/**
 * Controller: Register a new user (Admin, Donor, or Patient)
 * Route: POST /api/auth/register
 */
export const register = async (req, res) => {
    try {
        const { name, email, password, role, phone, blood_group } = req.body;
        // 1. Validation
        if (!name || !email || !password) {
            res.status(400).json({
                success: false,
                message: 'Validation failed. Name, email, and password are required fields.',
            });
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({
                success: false,
                message: 'Please provide a valid email address.',
            });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long.',
            });
            return;
        }
        const normalizedEmail = email.toLowerCase().trim();
        // 2. Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: 'A user with this email address already exists.',
            });
            return;
        }
        // 3. Validate Role if provided
        let userRole = Role.PATIENT;
        if (role) {
            if (Object.values(Role).includes(role)) {
                userRole = role;
            }
            else {
                res.status(400).json({
                    success: false,
                    message: `Invalid role specified. Valid roles are: ${Object.values(Role).join(', ')}`,
                });
                return;
            }
        }
        // 4. Validate Blood Group if provided
        let userBloodGroup = undefined;
        if (blood_group) {
            if (Object.values(BloodGroup).includes(blood_group)) {
                userBloodGroup = blood_group;
            }
            else {
                res.status(400).json({
                    success: false,
                    message: `Invalid blood group specified. Valid blood groups are: ${Object.values(BloodGroup).join(', ')}`,
                });
                return;
            }
        }
        // 5. Hash password
        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
        // 6. Create user record
        const newUser = await prisma.user.create({
            data: {
                name: name.trim(),
                email: normalizedEmail,
                password_hash,
                role: userRole,
                phone: phone ? phone.trim() : null,
                blood_group: userBloodGroup || null,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                blood_group: true,
                created_at: true,
                updated_at: true,
            },
        });
        // 7. Generate JWT token
        const token = generateToken({
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
            name: newUser.name,
            blood_group: newUser.blood_group,
        });
        res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            token,
            user: newUser,
        });
    }
    catch (error) {
        console.error('Error in register controller:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during user registration.',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
/**
 * Controller: Authenticate and log in an existing user
 * Route: POST /api/auth/login
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // 1. Validation
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: 'Email and password are required to log in.',
            });
            return;
        }
        const normalizedEmail = email.toLowerCase().trim();
        // 2. Find user by email
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid email address or password.',
            });
            return;
        }
        // 3. Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: 'Invalid email address or password.',
            });
            return;
        }
        // 4. Generate JWT token
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            blood_group: user.blood_group,
        });
        // 5. Exclude password hash from response
        const { password_hash: _, ...userProfile } = user;
        res.status(200).json({
            success: true,
            message: 'Login successful.',
            token,
            user: userProfile,
        });
    }
    catch (error) {
        console.error('Error in login controller:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during authentication.',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
/**
 * Controller: Get authenticated user profile (/me)
 * Route: GET /api/auth/me
 */
export const getProfile = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required.',
            });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                blood_group: true,
                created_at: true,
                updated_at: true,
            },
        });
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User profile not found.',
            });
            return;
        }
        res.status(200).json({
            success: true,
            user,
        });
    }
    catch (error) {
        console.error('Error in getProfile controller:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user profile.',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
