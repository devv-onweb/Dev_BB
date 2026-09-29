import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Role, BloodGroup } from '../types/enums.js';
import prisma from '../config/db.js';
import { generateToken } from '../utils/jwt.utils.js';
import { AuthenticatedRequest, RegisterDTO, UserRegisterDTO, LoginDTO } from '../types/auth.types.js';

const SALT_ROUNDS = 10;

const VALID_BLOOD_GROUPS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
  'A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'
];

export const normalizeBloodGroup = (bg: string): string => {
  const map: Record<string, string> = {
    'A+': 'A_POS',
    'A-': 'A_NEG',
    'B+': 'B_POS',
    'B-': 'B_NEG',
    'AB+': 'AB_POS',
    'AB-': 'AB_NEG',
    'O+': 'O_POS',
    'O-': 'O_NEG',
    'A_POS': 'A_POS',
    'A_NEG': 'A_NEG',
    'B_POS': 'B_POS',
    'B_NEG': 'B_NEG',
    'AB_POS': 'AB_POS',
    'AB_NEG': 'AB_NEG',
    'O_POS': 'O_POS',
    'O_NEG': 'O_NEG',
  };
  return map[bg.trim().toUpperCase()] || bg;
};

/**
 * Controller: Register a dedicated USER (Patient) with full profile & BMI calculation
 * Route: POST /api/auth/register-user
 */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      dob,
      gender,
      weightKg,
      heightCm,
      bloodGroup,
      city,
      address,
      emergencyContact,
      conditions,
      allergies,
    } = req.body as UserRegisterDTO;

    // 1. Validations
    if (!fullName || !fullName.trim()) {
      res.status(400).json({ success: false, message: 'Full name is required.' });
      return;
    }

    if (!email || !email.trim()) {
      res.status(400).json({ success: false, message: 'Email address is required.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      return;
    }

    if (!password || password.length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
      return;
    }

    if (!bloodGroup || !VALID_BLOOD_GROUPS.includes(bloodGroup.trim().toUpperCase())) {
      res.status(400).json({
        success: false,
        message: 'Blood group must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-.',
      });
      return;
    }

    const numWeight = weightKg !== undefined && weightKg !== null ? Number(weightKg) : undefined;
    const numHeight = heightCm !== undefined && heightCm !== null ? Number(heightCm) : undefined;

    if (numWeight !== undefined && (isNaN(numWeight) || numWeight < 30 || numWeight > 300)) {
      res.status(400).json({ success: false, message: 'Weight must be between 30 and 300 kg.' });
      return;
    }

    if (numHeight !== undefined && (isNaN(numHeight) || numHeight < 50 || numHeight > 250)) {
      res.status(400).json({ success: false, message: 'Height must be between 50 and 250 cm.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
      return;
    }

    // 3. Compute BMI
    let bmi: number | null = null;
    if (numWeight && numHeight && numHeight > 0) {
      const heightInMeters = numHeight / 100;
      bmi = Math.round((numWeight / (heightInMeters * heightInMeters)) * 10) / 10;
    }

    const normalizedBg = normalizeBloodGroup(bloodGroup);
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // 4. Create User and UserProfile in transaction
    const parsedDob = dob ? new Date(dob) : null;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: fullName.trim(),
          email: normalizedEmail,
          password_hash,
          role: 'USER',
          phone: phone ? phone.trim() : null,
          blood_group: normalizedBg,
        },
      });

      const profile = await tx.userProfile.create({
        data: {
          user_id: user.id,
          full_name: fullName.trim(),
          dob: parsedDob && !isNaN(parsedDob.getTime()) ? parsedDob : null,
          gender: gender ? gender.trim() : null,
          weight_kg: numWeight || null,
          height_cm: numHeight || null,
          bmi: bmi || null,
          blood_group: normalizedBg,
          city: city ? city.trim() : null,
          address: address ? address.trim() : null,
          emergency_contact: emergencyContact ? emergencyContact.trim() : null,
          conditions: conditions ? conditions.trim() : null,
          allergies: allergies ? allergies.trim() : null,
        },
      });

      // Also create a welcome health tip notification for the new user
      await tx.notification.create({
        data: {
          user_id: user.id,
          type: 'health_tip',
          title: 'Welcome to Hemocare Health Network',
          message: `Hello ${fullName.trim()}! Your profile has been created. Keep your medical details updated and monitor blood availability directly from your dashboard.`,
        },
      });

      return { user, profile };
    });

    const token = generateToken({
      id: result.user.id,
      email: result.user.email,
      role: Role.USER,
      name: result.user.name,
      blood_group: result.user.blood_group as BloodGroup | null,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully with profile and health notifications initialized.',
      token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        phone: result.user.phone,
        blood_group: result.user.blood_group,
        profile: result.profile,
      },
    });
  } catch (error) {
    console.error('Error in registerUser controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during user registration.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Register a general user (Admin, Donor, Patient, User)
 * Route: POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, phone, blood_group } = req.body as RegisterDTO;

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
    let userRole: string = Role.PATIENT;
    if (role) {
      if (Object.values(Role).includes(role as any)) {
        userRole = role;
      } else {
        res.status(400).json({
          success: false,
          message: `Invalid role specified. Valid roles are: ${Object.values(Role).join(', ')}`,
        });
        return;
      }
    }

    // 4. Validate Blood Group if provided
    let userBloodGroup: string | null = null;
    if (blood_group) {
      userBloodGroup = normalizeBloodGroup(blood_group);
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
        blood_group: userBloodGroup,
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
      role: newUser.role as Role,
      name: newUser.name,
      blood_group: newUser.blood_group as BloodGroup | null,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: newUser,
    });
  } catch (error) {
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
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as LoginDTO;

    // 1. Validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required to log in.',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Find user by email (include user profile and preferred doctor)
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        profile: {
          include: {
            preferred_doctor: true,
          },
        },
      },
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
      role: user.role as Role,
      name: user.name,
      blood_group: user.blood_group as BloodGroup | null,
    });

    // 5. Exclude password hash from response
    const { password_hash: _, ...userProfile } = user;

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: userProfile,
    });
  } catch (error) {
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
export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
        profile: {
          include: {
            preferred_doctor: true,
          },
        },
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
  } catch (error) {
    console.error('Error in getProfile controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Update user profile
 * Route: PUT /api/auth/profile
 */
export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const {
      fullName,
      phone,
      dob,
      gender,
      weightKg,
      heightCm,
      bloodGroup,
      city,
      address,
      emergencyContact,
      conditions,
      allergies,
      preferredDoctorId,
    } = req.body;

    const numWeight = weightKg !== undefined && weightKg !== null ? Number(weightKg) : undefined;
    const numHeight = heightCm !== undefined && heightCm !== null ? Number(heightCm) : undefined;

    let bmi: number | undefined = undefined;
    if (numWeight && numHeight && numHeight > 0) {
      const heightInMeters = numHeight / 100;
      bmi = Math.round((numWeight / (heightInMeters * heightInMeters)) * 10) / 10;
    }

    const normalizedBg = bloodGroup ? normalizeBloodGroup(bloodGroup) : undefined;
    const parsedDob = dob ? new Date(dob) : undefined;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: fullName ? fullName.trim() : undefined,
        phone: phone !== undefined ? (phone ? phone.trim() : null) : undefined,
        blood_group: normalizedBg,
        profile: {
          upsert: {
            create: {
              full_name: (fullName || req.user.name).trim(),
              dob: parsedDob && !isNaN(parsedDob.getTime()) ? parsedDob : null,
              gender: gender ? gender.trim() : null,
              weight_kg: numWeight || null,
              height_cm: numHeight || null,
              bmi: bmi || null,
              blood_group: normalizedBg || null,
              city: city ? city.trim() : null,
              address: address ? address.trim() : null,
              emergency_contact: emergencyContact ? emergencyContact.trim() : null,
              conditions: conditions ? conditions.trim() : null,
              allergies: allergies ? allergies.trim() : null,
              preferred_doctor_id: preferredDoctorId || null,
            },
            update: {
              full_name: fullName ? fullName.trim() : undefined,
              dob: parsedDob && !isNaN(parsedDob.getTime()) ? parsedDob : undefined,
              gender: gender !== undefined ? (gender ? gender.trim() : null) : undefined,
              weight_kg: numWeight !== undefined ? numWeight : undefined,
              height_cm: numHeight !== undefined ? numHeight : undefined,
              bmi: bmi !== undefined ? bmi : undefined,
              blood_group: normalizedBg !== undefined ? normalizedBg : undefined,
              city: city !== undefined ? (city ? city.trim() : null) : undefined,
              address: address !== undefined ? (address ? address.trim() : null) : undefined,
              emergency_contact: emergencyContact !== undefined ? (emergencyContact ? emergencyContact.trim() : null) : undefined,
              conditions: conditions !== undefined ? (conditions ? conditions.trim() : null) : undefined,
              allergies: allergies !== undefined ? (allergies ? allergies.trim() : null) : undefined,
              preferred_doctor_id: preferredDoctorId !== undefined ? (preferredDoctorId || null) : undefined,
            },
          },
        },
      },
      include: {
        profile: {
          include: {
            preferred_doctor: true,
          },
        },
      },
    });

    const { password_hash: _, ...userProfile } = updatedUser;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: userProfile,
    });
  } catch (error) {
    console.error('Error in updateProfile controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
