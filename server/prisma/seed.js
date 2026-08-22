"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_js_1 = __importDefault(require("../src/config/db.js"));
const enums_js_1 = require("../src/types/enums.js");
async function main() {
    console.log('🌱 Starting SQLite database seeding for Blood Bank Management System...');
    // 1. Clean up existing records
    console.log('🧹 Cleaning existing records...');
    await db_js_1.default.bloodRequest.deleteMany();
    await db_js_1.default.donation.deleteMany();
    await db_js_1.default.bloodInventory.deleteMany();
    await db_js_1.default.user.deleteMany();
    // 2. Hash default passwords
    const saltRounds = 10;
    const adminPasswordHash = await bcryptjs_1.default.hash('AdminPassword123!', saltRounds);
    const donorPasswordHash = await bcryptjs_1.default.hash('DonorPassword123!', saltRounds);
    const patientPasswordHash = await bcryptjs_1.default.hash('PatientPassword123!', saltRounds);
    // 3. Seed Blood Inventory (all 8 standard blood groups)
    console.log('🩸 Seeding blood inventory...');
    const inventoryData = [
        { blood_group: enums_js_1.BloodGroup.A_POS, units_available: 24 },
        { blood_group: enums_js_1.BloodGroup.A_NEG, units_available: 12 },
        { blood_group: enums_js_1.BloodGroup.B_POS, units_available: 30 },
        { blood_group: enums_js_1.BloodGroup.B_NEG, units_available: 8 },
        { blood_group: enums_js_1.BloodGroup.AB_POS, units_available: 15 },
        { blood_group: enums_js_1.BloodGroup.AB_NEG, units_available: 6 },
        { blood_group: enums_js_1.BloodGroup.O_POS, units_available: 45 },
        { blood_group: enums_js_1.BloodGroup.O_NEG, units_available: 18 },
    ];
    for (const item of inventoryData) {
        await db_js_1.default.bloodInventory.create({
            data: item,
        });
    }
    // 4. Seed Users (Admin, Donors, Patients)
    console.log('👥 Seeding users (Admin, Donors, Patients)...');
    // 4a. Admin
    const admin = await db_js_1.default.user.create({
        data: {
            name: 'Dr. Sarah Connor (Admin)',
            email: 'admin@bloodbank.org',
            password_hash: adminPasswordHash,
            role: enums_js_1.Role.ADMIN,
            phone: '+1-555-0100',
            blood_group: enums_js_1.BloodGroup.O_POS,
        },
    });
    // 4b. Donors
    const donor1 = await db_js_1.default.user.create({
        data: {
            name: 'John Doe',
            email: 'donor.john@example.com',
            password_hash: donorPasswordHash,
            role: enums_js_1.Role.DONOR,
            phone: '+1-555-0101',
            blood_group: enums_js_1.BloodGroup.O_POS,
        },
    });
    const donor2 = await db_js_1.default.user.create({
        data: {
            name: 'Sarah Jenkins',
            email: 'donor.sarah@example.com',
            password_hash: donorPasswordHash,
            role: enums_js_1.Role.DONOR,
            phone: '+1-555-0102',
            blood_group: enums_js_1.BloodGroup.A_POS,
        },
    });
    const donor3 = await db_js_1.default.user.create({
        data: {
            name: 'David Miller',
            email: 'donor.david@example.com',
            password_hash: donorPasswordHash,
            role: enums_js_1.Role.DONOR,
            phone: '+1-555-0103',
            blood_group: enums_js_1.BloodGroup.B_NEG,
        },
    });
    const donor4 = await db_js_1.default.user.create({
        data: {
            name: 'Priya Sharma',
            email: 'donor.priya@example.com',
            password_hash: donorPasswordHash,
            role: enums_js_1.Role.DONOR,
            phone: '+1-555-0104',
            blood_group: enums_js_1.BloodGroup.AB_POS,
        },
    });
    // 4c. Patients / Requesters
    const patient1 = await db_js_1.default.user.create({
        data: {
            name: 'Alice Morgan',
            email: 'patient.alice@example.com',
            password_hash: patientPasswordHash,
            role: enums_js_1.Role.PATIENT,
            phone: '+1-555-0201',
            blood_group: enums_js_1.BloodGroup.O_NEG,
        },
    });
    const patient2 = await db_js_1.default.user.create({
        data: {
            name: 'Robert Chen',
            email: 'patient.bob@example.com',
            password_hash: patientPasswordHash,
            role: enums_js_1.Role.PATIENT,
            phone: '+1-555-0202',
            blood_group: enums_js_1.BloodGroup.A_NEG,
        },
    });
    const patient3 = await db_js_1.default.user.create({
        data: {
            name: 'Emily Watson',
            email: 'patient.emily@example.com',
            password_hash: patientPasswordHash,
            role: enums_js_1.Role.PATIENT,
            phone: '+1-555-0203',
            blood_group: enums_js_1.BloodGroup.B_POS,
        },
    });
    // 5. Seed Donations
    console.log('💉 Seeding donations...');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    await db_js_1.default.donation.createMany({
        data: [
            {
                donor_id: donor1.id,
                units_donated: 2,
                donation_date: thirtyDaysAgo,
                status: enums_js_1.DonationStatus.APPROVED,
            },
            {
                donor_id: donor2.id,
                units_donated: 1,
                donation_date: tenDaysAgo,
                status: enums_js_1.DonationStatus.APPROVED,
            },
            {
                donor_id: donor3.id,
                units_donated: 1,
                donation_date: twoDaysAgo,
                status: enums_js_1.DonationStatus.PENDING,
            },
            {
                donor_id: donor4.id,
                units_donated: 1,
                donation_date: yesterday,
                status: enums_js_1.DonationStatus.REJECTED,
            },
            {
                donor_id: donor1.id,
                units_donated: 1,
                donation_date: new Date(),
                status: enums_js_1.DonationStatus.PENDING,
            },
        ],
    });
    // 6. Seed Blood Requests
    console.log('📋 Seeding blood requests...');
    await db_js_1.default.bloodRequest.createMany({
        data: [
            {
                requester_id: patient1.id,
                blood_group: enums_js_1.BloodGroup.O_NEG,
                units_requested: 2,
                hospital_name: 'Metro Trauma General Hospital',
                urgency: enums_js_1.RequestUrgency.URGENT,
                status: enums_js_1.RequestStatus.PENDING,
            },
            {
                requester_id: patient2.id,
                blood_group: enums_js_1.BloodGroup.A_NEG,
                units_requested: 1,
                hospital_name: 'St. Jude Memorial Medical Center',
                urgency: enums_js_1.RequestUrgency.NORMAL,
                status: enums_js_1.RequestStatus.APPROVED,
            },
            {
                requester_id: patient3.id,
                blood_group: enums_js_1.BloodGroup.B_POS,
                units_requested: 3,
                hospital_name: 'City Health Specialized Clinic',
                urgency: enums_js_1.RequestUrgency.URGENT,
                status: enums_js_1.RequestStatus.FULFILLED,
            },
            {
                requester_id: patient1.id,
                blood_group: enums_js_1.BloodGroup.O_NEG,
                units_requested: 5,
                hospital_name: 'Pinecrest Regional Care',
                urgency: enums_js_1.RequestUrgency.NORMAL,
                status: enums_js_1.RequestStatus.REJECTED,
            },
        ],
    });
    console.log('✅ SQLite Seeding completed successfully!');
    console.log('--------------------------------------------------');
    console.log('Credentials Summary:');
    console.log('👑 Admin:   admin@bloodbank.org         | Password: AdminPassword123!');
    console.log('🩸 Donor:   donor.john@example.com      | Password: DonorPassword123!');
    console.log('🩸 Donor:   donor.sarah@example.com     | Password: DonorPassword123!');
    console.log('🏥 Patient: patient.alice@example.com   | Password: PatientPassword123!');
    console.log('🏥 Patient: patient.bob@example.com     | Password: PatientPassword123!');
    console.log('--------------------------------------------------');
}
main()
    .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await db_js_1.default.$disconnect();
});
