import { DonationStatus, BloodGroup, Role } from '../types/enums.js';
import prisma from '../config/db.js';
/**
 * Controller: Submit a new donation log
 * Route: POST /api/donations
 * Access: Donors only (verifyToken, isDonor)
 */
export const createDonation = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required.' });
            return;
        }
        const { units_donated = 1, donation_date, blood_group } = req.body;
        // 1. Validation
        const units = Number(units_donated);
        if (isNaN(units) || units <= 0 || units > 2) {
            res.status(400).json({
                success: false,
                message: 'Invalid units donated. Units must be between 1 and 2 per donation session.',
            });
            return;
        }
        // 2. Fetch Donor Profile to check Blood Group
        const donor = await prisma.user.findUnique({
            where: { id: req.user.id },
        });
        if (!donor) {
            res.status(404).json({ success: false, message: 'Donor account not found.' });
            return;
        }
        let donorBloodGroup = donor.blood_group;
        // If blood group is provided in body and donor doesn't have one set, update it
        if (blood_group && Object.values(BloodGroup).includes(blood_group)) {
            if (!donorBloodGroup) {
                await prisma.user.update({
                    where: { id: donor.id },
                    data: { blood_group },
                });
                donorBloodGroup = blood_group;
            }
        }
        if (!donorBloodGroup) {
            res.status(400).json({
                success: false,
                message: 'Please specify your blood group in your profile or in this donation request.',
            });
            return;
        }
        // 3. Create Donation record
        const donation = await prisma.donation.create({
            data: {
                donor_id: donor.id,
                units_donated: units,
                donation_date: donation_date ? new Date(donation_date) : new Date(),
                status: DonationStatus.PENDING,
            },
            include: {
                donor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        blood_group: true,
                        phone: true,
                    },
                },
            },
        });
        res.status(201).json({
            success: true,
            message: 'Donation log submitted successfully. It is currently PENDING administrative review.',
            data: donation,
        });
    }
    catch (error) {
        console.error('Error creating donation:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while logging donation.',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
/**
 * Controller: Update donation status (Approve or Reject)
 * Route: PUT /api/donations/:id/status
 * Access: Admin only (verifyToken, isAdmin)
 * If APPROVED: Atomically increments BloodInventory.units_available via transaction
 */
export const updateDonationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        // 1. Validation
        if (!status || (status !== DonationStatus.APPROVED && status !== DonationStatus.REJECTED)) {
            res.status(400).json({
                success: false,
                message: 'Invalid status. Allowed values are "APPROVED" or "REJECTED".',
            });
            return;
        }
        // 2. Fetch existing donation with donor details
        const existingDonation = await prisma.donation.findUnique({
            where: { id },
            include: {
                donor: true,
            },
        });
        if (!existingDonation) {
            res.status(404).json({
                success: false,
                message: `Donation with ID ${id} not found.`,
            });
            return;
        }
        // Idempotency check: prevent duplicate stock increment if already approved
        if (existingDonation.status === DonationStatus.APPROVED) {
            res.status(400).json({
                success: false,
                message: 'This donation has already been APPROVED and blood inventory has already been credited.',
            });
            return;
        }
        const donorBloodGroup = existingDonation.donor.blood_group;
        if (status === DonationStatus.APPROVED && !donorBloodGroup) {
            res.status(400).json({
                success: false,
                message: 'Cannot approve donation: Donor profile is missing a registered blood group.',
            });
            return;
        }
        // 3. Execute atomic transaction
        const result = await prisma.$transaction(async (tx) => {
            // 3a. Update donation status
            const updatedDonation = await tx.donation.update({
                where: { id },
                data: { status },
                include: {
                    donor: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            blood_group: true,
                            phone: true,
                        },
                    },
                },
            });
            let updatedInventory = null;
            // 3b. If APPROVED, atomically increment inventory
            if (status === DonationStatus.APPROVED && donorBloodGroup) {
                updatedInventory = await tx.bloodInventory.upsert({
                    where: { blood_group: donorBloodGroup },
                    update: {
                        units_available: { increment: existingDonation.units_donated },
                        last_updated: new Date(),
                    },
                    create: {
                        blood_group: donorBloodGroup,
                        units_available: existingDonation.units_donated,
                        last_updated: new Date(),
                    },
                });
            }
            return { updatedDonation, updatedInventory };
        });
        res.status(200).json({
            success: true,
            message: status === DonationStatus.APPROVED
                ? `Donation approved successfully! Credited ${existingDonation.units_donated} unit(s) to ${donorBloodGroup} inventory.`
                : 'Donation status updated to REJECTED.',
            data: {
                donation: result.updatedDonation,
                inventory: result.updatedInventory,
            },
        });
    }
    catch (error) {
        console.error('Error updating donation status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update donation status.',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
/**
 * Controller: Get all donations (Admin sees all; Donors see their own)
 * Route: GET /api/donations
 * Access: Authenticated users (verifyToken)
 */
export const getAllDonations = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required.' });
            return;
        }
        const { status, limit = 50, page = 1 } = req.query;
        const take = Math.min(Number(limit) || 50, 100);
        const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
        const whereClause = {};
        // Filter by role: Donors only see their own
        if (req.user.role === Role.DONOR) {
            whereClause.donor_id = req.user.id;
        }
        // Optional status filter
        if (status && Object.values(DonationStatus).includes(status)) {
            whereClause.status = status;
        }
        const [donations, totalCount] = await Promise.all([
            prisma.donation.findMany({
                where: whereClause,
                include: {
                    donor: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            blood_group: true,
                            phone: true,
                        },
                    },
                },
                orderBy: { donation_date: 'desc' },
                take,
                skip,
            }),
            prisma.donation.count({ where: whereClause }),
        ]);
        res.status(200).json({
            success: true,
            data: {
                total: totalCount,
                page: Number(page) || 1,
                limit: take,
                donations,
            },
        });
    }
    catch (error) {
        console.error('Error fetching donations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve donations.',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
/**
 * Controller: Get logged-in donor's donation history
 * Route: GET /api/donations/my-donations
 * Access: Donors only (verifyToken, isDonor)
 */
export const getMyDonations = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required.' });
            return;
        }
        const donations = await prisma.donation.findMany({
            where: { donor_id: req.user.id },
            include: {
                donor: {
                    select: {
                        name: true,
                        email: true,
                        blood_group: true,
                    },
                },
            },
            orderBy: { donation_date: 'desc' },
        });
        res.status(200).json({
            success: true,
            data: {
                total: donations.length,
                donations,
            },
        });
    }
    catch (error) {
        console.error('Error fetching my donations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve your donation history.',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
/**
 * Controller: Get donation details by ID
 * Route: GET /api/donations/:id
 * Access: Admin or the Donor who created it
 */
export const getDonationById = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required.' });
            return;
        }
        const { id } = req.params;
        const donation = await prisma.donation.findUnique({
            where: { id },
            include: {
                donor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        blood_group: true,
                        phone: true,
                    },
                },
            },
        });
        if (!donation) {
            res.status(404).json({ success: false, message: 'Donation record not found.' });
            return;
        }
        // Access control: only Admin or the donor can view
        if (req.user.role !== Role.ADMIN && donation.donor_id !== req.user.id) {
            res.status(403).json({ success: false, message: 'Forbidden: Access to this donation record is denied.' });
            return;
        }
        res.status(200).json({
            success: true,
            data: donation,
        });
    }
    catch (error) {
        console.error('Error fetching donation by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve donation details.',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
