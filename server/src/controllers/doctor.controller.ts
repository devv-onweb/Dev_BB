import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types.js';
import prisma from '../config/db.js';

/**
 * Seed default doctors if none exist in the database
 */
export const ensureDefaultDoctors = async (): Promise<void> => {
  const count = await prisma.doctor.count();
  if (count > 0) return;

  const defaultDoctors = [
    {
      name: 'Dr. Priya Nambiar, MD',
      specialty: 'Hematology & Transfusion Medicine',
      hospital_name: 'AIIMS New Delhi',
      phone: '+91-98111-44556',
      email: 'dr.priya.nambiar@aiims.edu',
      qualification: 'MBBS, MD (Hematology), FACP',
      experience_yrs: 14,
      avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    },
    {
      name: 'Dr. Vikramaditya Sen, MS',
      specialty: 'Cardiac Surgery & Critical Blood Care',
      hospital_name: 'Apollo Hospitals Chennai',
      phone: '+91-98222-66778',
      email: 'dr.vsen@apollohospitals.com',
      qualification: 'MBBS, MS (General Surgery), MCh (CTVS)',
      experience_yrs: 18,
      avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    },
    {
      name: 'Dr. Ananya Mukherjee, DNB',
      specialty: 'Transfusion Medicine & Immunohematology',
      hospital_name: 'Tata Memorial Hospital Mumbai',
      phone: '+91-98333-88990',
      email: 'dr.ananya.m@tatamemorial.org',
      qualification: 'MBBS, DNB (Pathology & Transfusion)',
      experience_yrs: 10,
      avatar_url: 'https://images.unsplash.com/photo-1594824813589-32e6525997d4?auto=format&fit=crop&q=80&w=300',
    },
    {
      name: 'Dr. Rahul Deshmukh, MD',
      specialty: 'Emergency Medicine & Trauma Resuscitation',
      hospital_name: 'Fortis Memorial Research Institute Gurugram',
      phone: '+91-98444-11223',
      email: 'dr.deshmukh@fortishealthcare.com',
      qualification: 'MBBS, MD (Emergency Medicine)',
      experience_yrs: 12,
      avatar_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    },
    {
      name: 'Dr. Sunita Kulkarni, MD',
      specialty: 'General Internal Medicine & Preventive Care',
      hospital_name: 'Manipal Hospital Bengaluru',
      phone: '+91-98555-33445',
      email: 'dr.sunita.k@manipalhospitals.com',
      qualification: 'MBBS, MD (Internal Medicine)',
      experience_yrs: 16,
      avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    },
  ];

  for (const doc of defaultDoctors) {
    await prisma.doctor.create({ data: doc });
  }
};

/**
 * Controller: Get all doctors (preferred doctor pinned to top)
 * Route: GET /api/user/doctors
 */
export const getDoctors = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await ensureDefaultDoctors();

    let preferredDoctorId: string | null = null;
    if (req.user) {
      const userProfile = await prisma.userProfile.findUnique({
        where: { user_id: req.user.id },
      });
      preferredDoctorId = userProfile?.preferred_doctor_id || null;
    }

    const doctors = await prisma.doctor.findMany({
      orderBy: { experience_yrs: 'desc' },
      include: {
        hospital: true,
      },
    });

    // Mark preferred doctor and sort so preferred doctor is first
    const sortedDoctors = doctors.map((doc) => ({
      ...doc,
      isPreferred: doc.id === preferredDoctorId,
    })).sort((a, b) => {
      if (a.isPreferred && !b.isPreferred) return -1;
      if (!a.isPreferred && b.isPreferred) return 1;
      return 0;
    });

    res.status(200).json({
      success: true,
      preferredDoctorId,
      count: sortedDoctors.length,
      doctors: sortedDoctors,
    });
  } catch (error) {
    console.error('Error in getDoctors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve doctors.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Set preferred doctor on UserProfile
 * Route: POST /api/user/doctors/:id/prefer
 */
export const setPreferredDoctor = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
    });

    if (!doctor) {
      res.status(404).json({ success: false, message: 'Doctor not found.' });
      return;
    }

    // Upsert user profile with preferred_doctor_id
    const updatedProfile = await prisma.userProfile.upsert({
      where: { user_id: req.user.id },
      create: {
        user_id: req.user.id,
        full_name: req.user.name,
        preferred_doctor_id: doctor.id,
      },
      update: {
        preferred_doctor_id: doctor.id,
      },
      include: {
        preferred_doctor: true,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        user_id: req.user.id,
        type: 'followup',
        title: `Preferred Doctor Assigned: ${doctor.name}`,
        message: `${doctor.name} (${doctor.specialty} at ${doctor.hospital_name}) has been set as your primary medical contact and emergency liaison.`,
      },
    });

    res.status(200).json({
      success: true,
      message: `${doctor.name} is now your preferred doctor.`,
      profile: updatedProfile,
      preferredDoctor: doctor,
    });
  } catch (error) {
    console.error('Error in setPreferredDoctor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set preferred doctor.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Send message to doctor
 * Route: POST /api/user/doctors/:id/messages
 */
export const sendMessageToDoctor = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { id: doctorId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      res.status(400).json({ success: false, message: 'Message text cannot be empty.' });
      return;
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      res.status(404).json({ success: false, message: 'Doctor not found.' });
      return;
    }

    // 1. Record user's message
    const userMsg = await prisma.doctorMessage.create({
      data: {
        user_id: req.user.id,
        doctor_id: doctorId,
        sender: 'USER',
        message: message.trim(),
      },
    });

    // 2. Generate contextual response from Doctor
    let autoReplyText = `Hello ${req.user.name}, thank you for reaching out. I have received your message regarding "${message.slice(0, 40)}${message.length > 40 ? '...' : ''}". In case of acute blood shortage or urgent vitals drop, please immediately utilize the emergency transfusion request or call the emergency bay at ${doctor.phone}.`;

    const lower = message.toLowerCase();
    if (lower.includes('report') || lower.includes('hemoglobin') || lower.includes('anemia') || lower.includes('test')) {
      autoReplyText = `Hello ${req.user.name}, I reviewed your message regarding your lab findings. Please ensure your latest CBC report is uploaded on your BloodCare portal so I can review the detailed differential parameters. Stay well hydrated and avoid high strain.`;
    } else if (lower.includes('emergency') || lower.includes('urgent') || lower.includes('critical') || lower.includes('bleeding')) {
      autoReplyText = `[URGENT ATTENTION] ${req.user.name}, for acute trauma, severe bleeding, or critical blood requirement, please trigger the Emergency SOS broadcast or contact ${doctor.hospital_name} Emergency directly at ${doctor.phone}. Our team is alerted.`;
    }

    const doctorReply = await prisma.doctorMessage.create({
      data: {
        user_id: req.user.id,
        doctor_id: doctorId,
        sender: 'DOCTOR',
        message: autoReplyText,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Message dispatched successfully.',
      sentMessage: userMsg,
      reply: doctorReply,
    });
  } catch (error) {
    console.error('Error in sendMessageToDoctor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message to doctor.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Get message history with a doctor
 * Route: GET /api/user/doctors/:id/messages
 */
export const getDoctorMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { id: doctorId } = req.params;

    const messages = await prisma.doctorMessage.findMany({
      where: {
        user_id: req.user.id,
        doctor_id: doctorId,
      },
      orderBy: { created_at: 'asc' },
    });

    res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error('Error in getDoctorMessages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve doctor messages.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
