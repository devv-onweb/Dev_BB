import { Request, Response } from 'express';
import prisma from '../config/db.js';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { Role } from '../types/enums.js';

/**
 * Controller: Get all hospitals
 * Route: GET /api/hospitals
 * Access: Authenticated users
 */
export const getHospitals = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, is_verified, is_active } = req.query;
    const whereClause: any = {};

    if (search && typeof search === 'string') {
      whereClause.name = search.trim();
    }

    if (is_verified !== undefined) {
      whereClause.is_verified = is_verified === 'true';
    }

    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }

    const hospitals = await prisma.hospital.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: {
        total: hospitals.length,
        hospitals,
      },
    });
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve hospital list.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Get single hospital details
 * Route: GET /api/hospitals/:id
 * Access: Authenticated users
 */
export const getHospitalById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const hospital = await prisma.hospital.findUnique({
      where: { id },
    });

    if (!hospital) {
      res.status(404).json({ success: false, message: 'Hospital not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: hospital,
    });
  } catch (error) {
    console.error('Error fetching hospital by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve hospital details.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Register a new hospital
 * Route: POST /api/hospitals
 * Access: Admin only
 */
export const createHospital = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, address, latitude, longitude, contact_number, emergency_contact } = req.body;

    if (!name || !address) {
      res.status(400).json({
        success: false,
        message: 'Hospital name and address are required fields.',
      });
      return;
    }

    const existing = await prisma.hospital.findUnique({
      where: { name: String(name).trim() },
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: `A hospital named '${name}' already exists in the system.`,
      });
      return;
    }

    const newHospital = await prisma.hospital.create({
      data: {
        name: String(name).trim(),
        address: String(address).trim(),
        latitude: Number(latitude) || 28.6139,
        longitude: Number(longitude) || 77.2090,
        contact_number: String(contact_number || '').trim(),
        emergency_contact: String(emergency_contact || '').trim(),
        is_verified: true,
        is_active: true,
      },
    });

    res.status(201).json({
      success: true,
      message: `Hospital '${newHospital.name}' registered successfully.`,
      data: newHospital,
    });
  } catch (error) {
    console.error('Error creating hospital:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register new hospital.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Update hospital details
 * Route: PUT /api/hospitals/:id
 * Access: Admin or assigned Hospital user
 */
export const updateHospital = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { id } = req.params;

    // Role check: Admin or Hospital user assigned to this hospital
    if (req.user.role !== Role.ADMIN && req.user.hospital_id !== id) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You can only manage data for your assigned hospital.',
      });
      return;
    }

    const existing = await prisma.hospital.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Hospital not found.' });
      return;
    }

    const { address, latitude, longitude, contact_number, emergency_contact, is_active } = req.body;

    const updateData: any = {};
    if (address !== undefined) updateData.address = String(address).trim();
    if (latitude !== undefined) updateData.latitude = Number(latitude);
    if (longitude !== undefined) updateData.longitude = Number(longitude);
    if (contact_number !== undefined) updateData.contact_number = String(contact_number).trim();
    if (emergency_contact !== undefined) updateData.emergency_contact = String(emergency_contact).trim();
    if (is_active !== undefined && req.user.role === Role.ADMIN) updateData.is_active = Boolean(is_active);

    const updated = await prisma.hospital.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: 'Hospital details updated successfully.',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating hospital:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update hospital details.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Admin verifies or deactivates hospital
 * Route: PUT /api/hospitals/:id/verify
 * Access: Admin only
 */
export const verifyHospital = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { is_verified, is_active } = req.body;

    const existing = await prisma.hospital.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Hospital not found.' });
      return;
    }

    const updateData: any = {};
    if (is_verified !== undefined) updateData.is_verified = Boolean(is_verified);
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);

    const updated = await prisma.hospital.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: `Hospital verification status set to is_verified=${updated.is_verified}, is_active=${updated.is_active}.`,
      data: updated,
    });
  } catch (error) {
    console.error('Error verifying hospital:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update hospital verification status.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Get blood requests for a specific hospital
 * Route: GET /api/hospitals/:id/requests
 * Access: Admin or assigned Hospital user
 */
export const getHospitalRequests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { id } = req.params;

    if (req.user.role !== Role.ADMIN && req.user.hospital_id !== id) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Access restricted to authorized hospital coordinators.',
      });
      return;
    }

    const hospital = await prisma.hospital.findUnique({ where: { id } });
    if (!hospital) {
      res.status(404).json({ success: false, message: 'Hospital not found.' });
      return;
    }

    // Fetch requests matched by hospital_id OR matching hospital_name
    const allRequests = await prisma.bloodRequest.findMany({
      orderBy: { created_at: 'desc' },
    });

    const hospitalRequests = allRequests.filter(
      (r: any) =>
        r.hospital_id === hospital.id ||
        (r.hospital_name && r.hospital_name.toLowerCase().includes(hospital.name.toLowerCase()))
    );

    res.status(200).json({
      success: true,
      data: {
        hospital_id: hospital.id,
        hospital_name: hospital.name,
        total_requests: hospitalRequests.length,
        requests: hospitalRequests,
      },
    });
  } catch (error) {
    console.error('Error fetching hospital requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve hospital requests.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Get hospital dashboard telemetry and metrics
 * Route: GET /api/hospitals/:id/dashboard
 * Access: Admin or assigned Hospital user
 */
export const getHospitalDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { id } = req.params;

    if (req.user.role !== Role.ADMIN && req.user.hospital_id !== id) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Access restricted to hospital coordinators.',
      });
      return;
    }

    const hospital = await prisma.hospital.findUnique({ where: { id } });
    if (!hospital) {
      res.status(404).json({ success: false, message: 'Hospital not found.' });
      return;
    }

    const allRequests = await prisma.bloodRequest.findMany();
    const hospitalRequests = allRequests.filter(
      (r: any) =>
        r.hospital_id === hospital.id ||
        (r.hospital_name && r.hospital_name.toLowerCase().includes(hospital.name.toLowerCase()))
    );

    const pendingRequests = hospitalRequests.filter((r: any) => r.status === 'PENDING');
    const urgentRequests = pendingRequests.filter((r: any) => r.urgency === 'URGENT' || r.urgency === 'STAT_CRITICAL');
    const fulfilledRequests = hospitalRequests.filter((r: any) => r.status === 'FULFILLED');

    const bloodRequirementsByGroup: Record<string, number> = {};
    for (const reqItem of pendingRequests) {
      const group = reqItem.blood_group;
      bloodRequirementsByGroup[group] = (bloodRequirementsByGroup[group] || 0) + reqItem.units_requested;
    }

    res.status(200).json({
      success: true,
      data: {
        hospital,
        metrics: {
          total_requests_count: hospitalRequests.length,
          pending_requests_count: pendingRequests.length,
          urgent_requests_count: urgentRequests.length,
          fulfilled_requests_count: fulfilledRequests.length,
          blood_requirements_by_group: bloodRequirementsByGroup,
        },
        active_requests: pendingRequests,
      },
    });
  } catch (error) {
    console.error('Error fetching hospital dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve hospital dashboard.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
