import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always resolve to server/prisma/dev_db.json regardless of process.cwd()
const serverRoot = path.resolve(__dirname, '../../');
const prismaDirectory = path.join(serverRoot, 'prisma');
if (!fs.existsSync(prismaDirectory)) {
  fs.mkdirSync(prismaDirectory, { recursive: true });
}
const DB_FILE_PATH = path.join(prismaDirectory, 'dev_db.json');

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  phone?: string | null;
  blood_group?: string | null;
  hospital_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  location_updated_at?: Date | null;
  location_permission?: boolean | null;
  service_radius_km?: number | null;
  reliability_score?: number | null;
  reliability_last_updated?: Date | null;
  total_requests_received?: number;
  total_requests_accepted?: number;
  total_completed_donations?: number;
  total_no_shows?: number;
  total_cancellations?: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfileRecord {
  id: string;
  user_id: string;
  full_name: string;
  dob?: Date | null;
  gender?: string | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  bmi?: number | null;
  blood_group?: string | null;
  city?: string | null;
  address?: string | null;
  emergency_contact?: string | null;
  conditions?: string | null;
  allergies?: string | null;
  preferred_doctor_id?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface BloodInventoryRecord {
  id: string;
  blood_group: string;
  units_available: number;
  last_updated: Date;
}

export interface DonationRecord {
  id: string;
  donor_id: string;
  units_donated: number;
  donation_date: Date;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface BloodRequestRecord {
  id: string;
  requester_id: string;
  blood_group: string;
  units_requested: number;
  hospital_name: string;
  hospital_id?: string | null;
  urgency: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface BloodUnitRecord {
  id: string;
  unit_number: string;
  blood_group: string;
  component_type: string;
  collection_date: Date;
  expiry_date: Date;
  volume_ml: number;
  donation_id?: string | null;
  storage_location: string;
  status: string;
  reserved_for_id?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface HospitalRecord {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  contact_number: string;
  emergency_contact: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface BloodOrderRecord {
  id: string;
  user_id: string;
  blood_group: string;
  units: number;
  hospital_name: string;
  hospital_id?: string | null;
  urgency: string;
  reason?: string | null;
  needed_by?: Date | null;
  status: string;
  admin_notes?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ReportRecord {
  id: string;
  user_id: string;
  file_name: string;
  file_url?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  extracted_text?: string | null;
  summary?: string | null;
  abnormal_values?: string | null;
  risk_flags?: string | null;
  suggested_step?: string | null;
  is_flagged: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DoctorRecord {
  id: string;
  name: string;
  specialty: string;
  hospital_name: string;
  hospital_id?: string | null;
  phone: string;
  email: string;
  qualification?: string | null;
  experience_yrs?: number | null;
  avatar_url?: string | null;
  is_available: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DoctorMessageRecord {
  id: string;
  user_id: string;
  doctor_id: string;
  sender: string;
  message: string;
  read_at?: Date | null;
  created_at: Date;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  scheduled_at: Date;
  read_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

const DEFAULT_HOSPITALS: HospitalRecord[] = [
  {
    id: 'hosp-aiims',
    name: 'AIIMS New Delhi - Emergency Trauma Bay',
    address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi, Delhi 110029',
    latitude: 28.5672,
    longitude: 77.2100,
    contact_number: '+91-11-26588500',
    emergency_contact: '+91-11-26588700',
    is_verified: true,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'hosp-apollo',
    name: 'Apollo Hospitals Chennai',
    address: 'Greams Lane, 21 Greams Rd, Thousand Lights, Chennai, Tamil Nadu 600006',
    latitude: 13.0604,
    longitude: 80.2496,
    contact_number: '+91-44-28290200',
    emergency_contact: '+91-44-28293333',
    is_verified: true,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'hosp-fortis',
    name: 'Fortis Memorial Research Institute',
    address: 'Sector 44, Opposite HUDA City Centre, Gurugram, Haryana 122002',
    latitude: 28.4595,
    longitude: 77.0725,
    contact_number: '+91-124-4921021',
    emergency_contact: '+91-124-105711',
    is_verified: true,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'hosp-tata',
    name: 'Tata Memorial Hospital Mumbai',
    address: 'Dr. Ernest Borges Road, Parel, Mumbai, Maharashtra 400012',
    latitude: 19.0033,
    longitude: 72.8427,
    contact_number: '+91-22-24177000',
    emergency_contact: '+91-22-24177001',
    is_verified: true,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
];

const DEFAULT_DOCTORS: DoctorRecord[] = [
  {
    id: 'doc-priya-01',
    name: 'Dr. Priya Nambiar, MD',
    specialty: 'Hematology & Transfusion Medicine',
    hospital_name: 'AIIMS New Delhi',
    hospital_id: 'hosp-aiims',
    phone: '+91-98111-44556',
    email: 'dr.priya.nambiar@aiims.edu',
    qualification: 'MBBS, MD (Hematology), FACP',
    experience_yrs: 14,
    avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    is_available: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'doc-vikram-02',
    name: 'Dr. Vikramaditya Sen, MS',
    specialty: 'Cardiac Surgery & Critical Blood Care',
    hospital_name: 'Apollo Hospitals Chennai',
    hospital_id: 'hosp-apollo',
    phone: '+91-98222-66778',
    email: 'dr.vsen@apollohospitals.com',
    qualification: 'MBBS, MS (General Surgery), MCh (CTVS)',
    experience_yrs: 18,
    avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    is_available: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'doc-ananya-03',
    name: 'Dr. Ananya Mukherjee, DNB',
    specialty: 'Transfusion Medicine & Immunohematology',
    hospital_name: 'Tata Memorial Hospital Mumbai',
    hospital_id: 'hosp-tata',
    phone: '+91-98333-88990',
    email: 'dr.ananya.m@tatamemorial.org',
    qualification: 'MBBS, DNB (Pathology & Transfusion)',
    experience_yrs: 10,
    avatar_url: 'https://images.unsplash.com/photo-1594824813589-32e6525997d4?auto=format&fit=crop&q=80&w=300',
    is_available: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'doc-rahul-04',
    name: 'Dr. Rahul Deshmukh, MD',
    specialty: 'Emergency Medicine & Trauma Resuscitation',
    hospital_name: 'Fortis Memorial Research Institute Gurugram',
    hospital_id: 'hosp-fortis',
    phone: '+91-98444-11223',
    email: 'dr.deshmukh@fortishealthcare.com',
    qualification: 'MBBS, MD (Emergency Medicine)',
    experience_yrs: 12,
    avatar_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    is_available: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'doc-sunita-05',
    name: 'Dr. Sunita Kulkarni, MD',
    specialty: 'General Internal Medicine & Preventive Care',
    hospital_name: 'Manipal Hospital Bengaluru',
    hospital_id: null,
    phone: '+91-98555-33445',
    email: 'dr.sunita.k@manipalhospitals.com',
    qualification: 'MBBS, MD (Internal Medicine)',
    experience_yrs: 16,
    avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    is_available: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
];

interface DatabaseSchema {
  users: UserRecord[];
  user_profiles: UserProfileRecord[];
  blood_inventory: BloodInventoryRecord[];
  donations: DonationRecord[];
  blood_requests: BloodRequestRecord[];
  blood_units: BloodUnitRecord[];
  hospitals: HospitalRecord[];
  blood_orders: BloodOrderRecord[];
  reports: ReportRecord[];
  doctors: DoctorRecord[];
  doctor_messages: DoctorMessageRecord[];
  notifications: NotificationRecord[];
}

class LocalDatabaseEngine {
  private dbFilePath: string = DB_FILE_PATH;
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        const loadedHospitals = (parsed.hospitals || []).map((h: any) => ({
          ...h,
          created_at: new Date(h.created_at),
          updated_at: new Date(h.updated_at),
        }));
        const loadedDoctors = (parsed.doctors || []).map((d: any) => ({
          ...d,
          created_at: new Date(d.created_at),
          updated_at: new Date(d.updated_at),
        }));

        return {
          users: (parsed.users || []).map((u: any) => ({
            ...u,
            created_at: new Date(u.created_at),
            updated_at: new Date(u.updated_at),
          })),
          user_profiles: (parsed.user_profiles || []).map((p: any) => ({
            ...p,
            dob: p.dob ? new Date(p.dob) : null,
            created_at: new Date(p.created_at),
            updated_at: new Date(p.updated_at),
          })),
          blood_inventory: (parsed.blood_inventory || []).map((i: any) => ({
            ...i,
            last_updated: new Date(i.last_updated),
          })),
          donations: (parsed.donations || []).map((d: any) => ({
            ...d,
            donation_date: new Date(d.donation_date),
            created_at: new Date(d.created_at),
            updated_at: new Date(d.updated_at),
          })),
          blood_requests: (parsed.blood_requests || []).map((r: any) => ({
            ...r,
            created_at: new Date(r.created_at),
            updated_at: new Date(r.updated_at),
          })),
          blood_units: (parsed.blood_units || []).map((bu: any) => ({
            ...bu,
            collection_date: new Date(bu.collection_date),
            expiry_date: new Date(bu.expiry_date),
            created_at: new Date(bu.created_at),
            updated_at: new Date(bu.updated_at),
          })),
          hospitals: loadedHospitals.length > 0 ? loadedHospitals : DEFAULT_HOSPITALS,
          blood_orders: (parsed.blood_orders || []).map((bo: any) => ({
            ...bo,
            needed_by: bo.needed_by ? new Date(bo.needed_by) : null,
            created_at: new Date(bo.created_at),
            updated_at: new Date(bo.updated_at),
          })),
          reports: (parsed.reports || []).map((rep: any) => ({
            ...rep,
            created_at: new Date(rep.created_at),
            updated_at: new Date(rep.updated_at),
          })),
          doctors: loadedDoctors.length > 0 ? loadedDoctors : DEFAULT_DOCTORS,
          doctor_messages: (parsed.doctor_messages || []).map((dm: any) => ({
            ...dm,
            read_at: dm.read_at ? new Date(dm.read_at) : null,
            created_at: new Date(dm.created_at),
          })),
          notifications: (parsed.notifications || []).map((n: any) => ({
            ...n,
            scheduled_at: new Date(n.scheduled_at),
            read_at: n.read_at ? new Date(n.read_at) : null,
            created_at: new Date(n.created_at),
            updated_at: new Date(n.updated_at),
          })),
        };
      }
    } catch (e) {
      console.warn('Error reading dev_db.json from disk:', e);
    }

    return {
      users: [],
      user_profiles: [],
      blood_inventory: [],
      donations: [],
      blood_requests: [],
      blood_units: [],
      hospitals: DEFAULT_HOSPITALS,
      blood_orders: [],
      reports: [],
      doctors: DEFAULT_DOCTORS,
      doctor_messages: [],
      notifications: [],
    };
  }

  public persist(): void {
    try {
      fs.writeFileSync(this.dbFilePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database to disk:', err);
    }
  }

  private filterBySelect(obj: any, select?: Record<string, boolean>) {
    if (!select) return obj;
    const result: any = {};
    for (const key of Object.keys(select)) {
      if (select[key] && key in obj) {
        result[key] = obj[key];
      }
    }
    return result;
  }

  // --------------------------------------------------------------------------
  // USER TABLE OPERATIONS
  // --------------------------------------------------------------------------
  public user = {
    findUnique: async ({ where, select, include }: { where: { id?: string; email?: string }; select?: any; include?: any }) => {
      this.data = this.loadData();
      const match = this.data.users.find(
        (u) =>
          (where.id && u.id === where.id) ||
          (where.email && u.email.toLowerCase() === where.email.toLowerCase())
      );
      if (!match) return null;

      const res: any = { ...match };
      if (include?.profile || select?.profile) {
        const profile = this.data.user_profiles.find((p) => p.user_id === match.id);
        if (profile) {
          const profObj: any = { ...profile };
          if (include?.profile?.include?.preferred_doctor || select?.profile?.include?.preferred_doctor) {
            profObj.preferred_doctor = this.data.doctors.find((d) => d.id === profile.preferred_doctor_id) || null;
          }
          res.profile = profObj;
        } else {
          res.profile = null;
        }
      }

      if (select) {
        const selected = this.filterBySelect(res, select);
        if (select.profile) selected.profile = res.profile;
        return selected;
      }
      return res;
    },

    findMany: async (args?: { where?: any; select?: any; include?: any }) => {
      this.data = this.loadData();
      let list = this.data.users;
      if (args?.where) {
        list = list.filter((u) => {
          for (const key in args.where) {
            if (key === 'role' && typeof args.where[key] === 'object' && Array.isArray(args.where[key].in)) {
              if (!args.where[key].in.includes(u.role)) return false;
            } else if ((u as any)[key] !== args.where[key]) {
              return false;
            }
          }
          return true;
        });
      }
      return list.map((u) => {
        const res: any = { ...u };
        if (args?.include?.profile) {
          res.profile = this.data.user_profiles.find((p) => p.user_id === u.id) || null;
        }
        return args?.select ? this.filterBySelect(res, args.select) : res;
      });
    },

    create: async ({ data, select }: { data: any; select?: any }) => {
      this.data = this.loadData();
      const now = new Date();
      const newId = data.id || crypto.randomUUID();
      const existingIndex = this.data.users.findIndex((u) => u.id === newId);

      const newUser: UserRecord = {
        id: newId,
        name: data.name,
        email: data.email.toLowerCase().trim(),
        password_hash: data.password_hash,
        role: data.role || 'PATIENT',
        phone: data.phone || null,
        blood_group: data.blood_group || null,
        hospital_id: data.hospital_id || null,
        latitude: data.latitude !== undefined ? data.latitude : null,
        longitude: data.longitude !== undefined ? data.longitude : null,
        location_updated_at: data.location_updated_at || (data.latitude ? now : null),
        location_permission: data.location_permission !== undefined ? data.location_permission : true,
        service_radius_km: data.service_radius_km || 10.0,
        reliability_score: data.reliability_score !== undefined ? data.reliability_score : 75.0,
        reliability_last_updated: data.reliability_last_updated || null,
        total_requests_received: Number(data.total_requests_received) || 0,
        total_requests_accepted: Number(data.total_requests_accepted) || 0,
        total_completed_donations: Number(data.total_completed_donations) || 0,
        total_no_shows: Number(data.total_no_shows) || 0,
        total_cancellations: Number(data.total_cancellations) || 0,
        created_at: data.created_at || now,
        updated_at: data.updated_at || now,
      };

      if (existingIndex !== -1) {
        this.data.users[existingIndex] = newUser;
      } else {
        this.data.users.push(newUser);
      }
      this.persist();
      return select ? this.filterBySelect(newUser, select) : { ...newUser };
    },

    update: async ({ where, data, select, include }: { where: { id: string }; data: any; select?: any; include?: any }) => {
      this.data = this.loadData();
      const index = this.data.users.findIndex((u) => u.id === where.id);
      if (index === -1) throw new Error(`User with id ${where.id} not found`);
      const existing = this.data.users[index];

      const { profile: profileData, ...cleanUserData } = data;

      const updated: UserRecord = {
        ...existing,
        ...cleanUserData,
        updated_at: new Date(),
      };
      this.data.users[index] = updated;

      // Handle profile upsert/update if passed
      if (profileData?.upsert) {
        const { create: pCreate, update: pUpdate } = profileData.upsert;
        const profIdx = this.data.user_profiles.findIndex((p) => p.user_id === where.id);
        const now = new Date();
        if (profIdx !== -1) {
          this.data.user_profiles[profIdx] = {
            ...this.data.user_profiles[profIdx],
            ...pUpdate,
            updated_at: now,
          };
        } else {
          this.data.user_profiles.push({
            id: crypto.randomUUID(),
            user_id: where.id,
            full_name: pCreate.full_name || updated.name,
            dob: pCreate.dob || null,
            gender: pCreate.gender || null,
            weight_kg: pCreate.weight_kg || null,
            height_cm: pCreate.height_cm || null,
            bmi: pCreate.bmi || null,
            blood_group: pCreate.blood_group || updated.blood_group || null,
            city: pCreate.city || null,
            address: pCreate.address || null,
            emergency_contact: pCreate.emergency_contact || null,
            conditions: pCreate.conditions || null,
            allergies: pCreate.allergies || null,
            preferred_doctor_id: pCreate.preferred_doctor_id || null,
            created_at: now,
            updated_at: now,
          });
        }
      }

      this.persist();

      const res: any = { ...updated };
      if (include?.profile) {
        const prof = this.data.user_profiles.find((p) => p.user_id === where.id);
        if (prof) {
          const profObj: any = { ...prof };
          if (include?.profile?.include?.preferred_doctor) {
            profObj.preferred_doctor = this.data.doctors.find((d) => d.id === prof.preferred_doctor_id) || null;
          }
          res.profile = profObj;
        } else {
          res.profile = null;
        }
      }

      return select ? this.filterBySelect(res, select) : res;
    },

    deleteMany: async () => {
      this.data = this.loadData();
      const count = this.data.users.length;
      this.data.users = [];
      this.persist();
      return { count };
    },

    count: async () => {
      this.data = this.loadData();
      return this.data.users.length;
    },
  };

  // --------------------------------------------------------------------------
  // USER PROFILE OPERATIONS
  // --------------------------------------------------------------------------
  public userProfile = {
    findUnique: async ({ where, include }: { where: { user_id?: string; id?: string }; include?: any }) => {
      this.data = this.loadData();
      const match = this.data.user_profiles.find(
        (p) => (where.user_id && p.user_id === where.user_id) || (where.id && p.id === where.id)
      );
      if (!match) return null;
      const res: any = { ...match };
      if (include?.preferred_doctor) {
        res.preferred_doctor = this.data.doctors.find((d) => d.id === match.preferred_doctor_id) || null;
      }
      return res;
    },

    create: async ({ data }: { data: any }) => {
      this.data = this.loadData();
      const now = new Date();
      const newProfile: UserProfileRecord = {
        id: data.id || crypto.randomUUID(),
        user_id: data.user_id,
        full_name: data.full_name,
        dob: data.dob ? new Date(data.dob) : null,
        gender: data.gender || null,
        weight_kg: Number(data.weight_kg) || null,
        height_cm: Number(data.height_cm) || null,
        bmi: Number(data.bmi) || null,
        blood_group: data.blood_group || null,
        city: data.city || null,
        address: data.address || null,
        emergency_contact: data.emergency_contact || null,
        conditions: data.conditions || null,
        allergies: data.allergies || null,
        preferred_doctor_id: data.preferred_doctor_id || null,
        created_at: now,
        updated_at: now,
      };
      this.data.user_profiles.push(newProfile);
      this.persist();
      return { ...newProfile };
    },

    update: async ({ where, data, include }: { where: { user_id?: string; id?: string }; data: any; include?: any }) => {
      this.data = this.loadData();
      const index = this.data.user_profiles.findIndex(
        (p) => (where.user_id && p.user_id === where.user_id) || (where.id && p.id === where.id)
      );
      if (index === -1) throw new Error(`UserProfile not found`);
      const existing = this.data.user_profiles[index];
      const updated: UserProfileRecord = {
        ...existing,
        ...data,
        updated_at: new Date(),
      };
      this.data.user_profiles[index] = updated;
      this.persist();
      const res: any = { ...updated };
      if (include?.preferred_doctor) {
        res.preferred_doctor = this.data.doctors.find((d) => d.id === updated.preferred_doctor_id) || null;
      }
      return res;
    },

    upsert: async ({
      where,
      update,
      create,
      include,
    }: {
      where: { user_id?: string; id?: string };
      update: any;
      create: any;
      include?: any;
    }) => {
      this.data = this.loadData();
      const existing = await this.userProfile.findUnique({ where });
      if (existing) {
        return this.userProfile.update({ where, data: update, include });
      } else {
        const created = await this.userProfile.create({ data: create });
        const res: any = { ...created };
        if (include?.preferred_doctor) {
          res.preferred_doctor = this.data.doctors.find((d) => d.id === created.preferred_doctor_id) || null;
        }
        return res;
      }
    },

    deleteMany: async () => {
      this.data = this.loadData();
      const count = this.data.user_profiles.length;
      this.data.user_profiles = [];
      this.persist();
      return { count };
    },
  };

  // --------------------------------------------------------------------------
  // BLOOD INVENTORY OPERATIONS
  // --------------------------------------------------------------------------
  public bloodInventory = {
    findUnique: async ({ where }: { where: { id?: string; blood_group?: string } }) => {
      this.data = this.loadData();
      const match = this.data.blood_inventory.find(
        (i) => (where.id && i.id === where.id) || (where.blood_group && i.blood_group === where.blood_group)
      );
      return match ? { ...match } : null;
    },

    findMany: async (args?: { orderBy?: any }) => {
      this.data = this.loadData();
      let list = [...this.data.blood_inventory];
      if (args?.orderBy?.blood_group) {
        list.sort((a, b) => a.blood_group.localeCompare(b.blood_group));
      }
      return list.map((i) => ({ ...i }));
    },

    create: async ({ data }: { data: any }) => {
      this.data = this.loadData();
      const now = new Date();
      const newItem: BloodInventoryRecord = {
        id: data.id || crypto.randomUUID(),
        blood_group: data.blood_group,
        units_available: Number(data.units_available) || 0,
        last_updated: data.last_updated || now,
      };
      this.data.blood_inventory.push(newItem);
      this.persist();
      return { ...newItem };
    },

    update: async ({ where, data }: { where: { id?: string; blood_group?: string }; data: any }) => {
      this.data = this.loadData();
      const index = this.data.blood_inventory.findIndex(
        (i) => (where.id && i.id === where.id) || (where.blood_group && i.blood_group === where.blood_group)
      );
      if (index === -1) throw new Error(`Inventory item not found`);
      const existing = this.data.blood_inventory[index];

      let newUnits = existing.units_available;
      if (typeof data.units_available === 'number') {
        newUnits = data.units_available;
      } else if (data.units_available?.increment) {
        newUnits += data.units_available.increment;
      } else if (data.units_available?.decrement) {
        newUnits -= data.units_available.decrement;
      }

      const updated: BloodInventoryRecord = {
        ...existing,
        units_available: Math.max(0, newUnits),
        last_updated: new Date(),
      };
      this.data.blood_inventory[index] = updated;
      this.persist();
      return { ...updated };
    },

    upsert: async ({
      where,
      update,
      create,
    }: {
      where: { blood_group: string };
      update: any;
      create: any;
    }) => {
      this.data = this.loadData();
      const existing = await this.bloodInventory.findUnique({ where });
      if (existing) {
        return this.bloodInventory.update({ where, data: update });
      } else {
        return this.bloodInventory.create({ data: create });
      }
    },

    deleteMany: async () => {
      this.data = this.loadData();
      const count = this.data.blood_inventory.length;
      this.data.blood_inventory = [];
      this.persist();
      return { count };
    },
  };

  // --------------------------------------------------------------------------
  // DONATIONS OPERATIONS
  // --------------------------------------------------------------------------
  public donation = {
    findUnique: async ({ where, include }: { where: { id: string }; include?: any }) => {
      this.data = this.loadData();
      const match = this.data.donations.find((d) => d.id === where.id);
      if (!match) return null;
      const res: any = { ...match };
      if (include?.donor) {
        const donor = this.data.users.find((u) => u.id === match.donor_id);
        const donorSelect = typeof include.donor === 'object' && include.donor.select ? include.donor.select : null;
        res.donor = donor ? (donorSelect ? this.filterBySelect(donor, donorSelect) : { ...donor }) : null;
      }
      return res;
    },

    findMany: async (args?: {
      where?: any;
      include?: any;
      orderBy?: any;
      take?: number;
      skip?: number;
    }) => {
      this.data = this.loadData();
      let list = [...this.data.donations];
      if (args?.where) {
        list = list.filter((d) => {
          if (args.where.donor_id && d.donor_id !== args.where.donor_id) return false;
          if (args.where.status && d.status !== args.where.status) return false;
          return true;
        });
      }

      if (args?.orderBy?.donation_date) {
        list.sort((a, b) =>
          args.orderBy.donation_date === 'desc'
            ? b.donation_date.getTime() - a.donation_date.getTime()
            : a.donation_date.getTime() - b.donation_date.getTime()
        );
      }

      const skip = args?.skip || 0;
      const take = args?.take ? skip + args.take : list.length;
      const paginated = list.slice(skip, take);

      return paginated.map((d) => {
        const item: any = { ...d };
        if (args?.include?.donor) {
          const donor = this.data.users.find((u) => u.id === d.donor_id);
          if (donor) {
            const donorSelect =
              typeof args.include.donor === 'object' && args.include.donor.select
                ? args.include.donor.select
                : null;
            item.donor = donorSelect ? this.filterBySelect(donor, donorSelect) : { ...donor };
          } else {
            item.donor = null;
          }
        }
        return item;
      });
    },

    create: async ({ data, include }: { data: any; include?: any }) => {
      this.data = this.loadData();
      const now = new Date();
      const newDonation: DonationRecord = {
        id: data.id || crypto.randomUUID(),
        donor_id: data.donor_id,
        units_donated: Number(data.units_donated) || 1,
        donation_date: data.donation_date ? new Date(data.donation_date) : now,
        status: data.status || 'PENDING',
        created_at: now,
        updated_at: now,
      };
      this.data.donations.push(newDonation);
      this.persist();

      const item: any = { ...newDonation };
      if (include?.donor) {
        const donor = this.data.users.find((u) => u.id === newDonation.donor_id);
        item.donor = donor ? { ...donor } : null;
      }
      return item;
    },

    createMany: async ({ data }: { data: any[] }) => {
      this.data = this.loadData();
      for (const d of data) {
        const now = new Date();
        const newDonation: DonationRecord = {
          id: d.id || crypto.randomUUID(),
          donor_id: d.donor_id,
          units_donated: Number(d.units_donated) || 1,
          donation_date: d.donation_date ? new Date(d.donation_date) : now,
          status: d.status || 'PENDING',
          created_at: now,
          updated_at: now,
        };
        this.data.donations.push(newDonation);
      }
      this.persist();
      return { count: data.length };
    },

    update: async ({ where, data, include }: { where: { id: string }; data: any; include?: any }) => {
      this.data = this.loadData();
      const index = this.data.donations.findIndex((d) => d.id === where.id);
      if (index === -1) throw new Error(`Donation with id ${where.id} not found`);
      const existing = this.data.donations[index];
      const updated: DonationRecord = {
        ...existing,
        ...data,
        updated_at: new Date(),
      };
      this.data.donations[index] = updated;
      this.persist();

      const item: any = { ...updated };
      if (include?.donor) {
        const donor = this.data.users.find((u) => u.id === updated.donor_id);
        item.donor = donor ? { ...donor } : null;
      }
      return item;
    },

    deleteMany: async () => {
      this.data = this.loadData();
      const count = this.data.donations.length;
      this.data.donations = [];
      this.persist();
      return { count };
    },

    count: async (args?: { where?: any }) => {
      this.data = this.loadData();
      if (!args?.where) return this.data.donations.length;
      return this.data.donations.filter((d) => {
        if (args.where.donor_id && d.donor_id !== args.where.donor_id) return false;
        if (args.where.status && d.status !== args.where.status) return false;
        return true;
      }).length;
    },
  };

  // --------------------------------------------------------------------------
  // BLOOD REQUESTS OPERATIONS
  // --------------------------------------------------------------------------
  public bloodRequest = {
    findUnique: async ({ where, include }: { where: { id: string }; include?: any }) => {
      this.data = this.loadData();
      const match = this.data.blood_requests.find((r) => r.id === where.id);
      if (!match) return null;
      const res: any = { ...match };
      if (include?.requester) {
        const requester = this.data.users.find((u) => u.id === match.requester_id);
        const reqSelect =
          typeof include.requester === 'object' && include.requester.select ? include.requester.select : null;
        res.requester = requester
          ? reqSelect
            ? this.filterBySelect(requester, reqSelect)
            : { ...requester }
          : {
              id: match.requester_id,
              name: 'Hospital Requester',
              email: 'hospital@health.org',
              phone: '+1-555-0100',
              blood_group: match.blood_group,
            };
      }
      return res;
    },

    findMany: async (args?: {
      where?: any;
      include?: any;
      orderBy?: any;
      take?: number;
      skip?: number;
    }) => {
      this.data = this.loadData();
      let list = [...this.data.blood_requests];
      if (args?.where) {
        list = list.filter((r) => {
          if (args.where.requester_id && r.requester_id !== args.where.requester_id) return false;
          if (args.where.status && r.status !== args.where.status) return false;
          if (args.where.urgency && r.urgency !== args.where.urgency) return false;
          if (args.where.blood_group && r.blood_group !== args.where.blood_group) return false;
          if (args.where.hospital_id && r.hospital_id !== args.where.hospital_id) return false;
          return true;
        });
      }

      list.sort((a, b) => {
        if (a.urgency !== b.urgency) {
          return a.urgency === 'URGENT' ? -1 : 1;
        }
        return b.created_at.getTime() - a.created_at.getTime();
      });

      const skip = args?.skip || 0;
      const take = args?.take ? skip + args.take : list.length;
      const paginated = list.slice(skip, take);

      return paginated.map((r) => {
        const item: any = { ...r };
        if (args?.include?.requester) {
          const reqUser = this.data.users.find((u) => u.id === r.requester_id);
          if (reqUser) {
            const reqSelect =
              typeof args.include.requester === 'object' && args.include.requester.select
                ? args.include.requester.select
                : null;
            item.requester = reqSelect ? this.filterBySelect(reqUser, reqSelect) : { ...reqUser };
          } else {
            item.requester = {
              id: r.requester_id,
              name: 'Hospital Requester',
              email: 'hospital@health.org',
              phone: '+1-555-0100',
              blood_group: r.blood_group,
            };
          }
        }
        return item;
      });
    },

    create: async ({ data, include }: { data: any; include?: any }) => {
      this.data = this.loadData();
      const now = new Date();
      const newReq: BloodRequestRecord = {
        id: data.id || crypto.randomUUID(),
        requester_id: data.requester_id,
        blood_group: data.blood_group,
        units_requested: Number(data.units_requested),
        hospital_name: data.hospital_name,
        hospital_id: data.hospital_id || null,
        urgency: data.urgency || 'NORMAL',
        status: data.status || 'PENDING',
        created_at: data.created_at ? new Date(data.created_at) : now,
        updated_at: data.updated_at ? new Date(data.updated_at) : now,
      };
      this.data.blood_requests.push(newReq);
      this.persist();

      const item: any = { ...newReq };
      if (include?.requester) {
        const reqUser = this.data.users.find((u) => u.id === newReq.requester_id);
        item.requester = reqUser ? { ...reqUser } : null;
      }
      return item;
    },

    createMany: async ({ data }: { data: any[] }) => {
      this.data = this.loadData();
      for (const r of data) {
        const now = new Date();
        const newReq: BloodRequestRecord = {
          id: r.id || crypto.randomUUID(),
          requester_id: r.requester_id,
          blood_group: r.blood_group,
          units_requested: Number(r.units_requested),
          hospital_name: r.hospital_name,
          urgency: r.urgency || 'NORMAL',
          status: r.status || 'PENDING',
          created_at: now,
          updated_at: now,
        };
        this.data.blood_requests.push(newReq);
      }
      this.persist();
      return { count: data.length };
    },

    update: async ({ where, data, include }: { where: { id: string }; data: any; include?: any }) => {
      this.data = this.loadData();
      const index = this.data.blood_requests.findIndex((r) => r.id === where.id);
      if (index === -1) throw new Error(`BloodRequest with id ${where.id} not found`);
      const existing = this.data.blood_requests[index];
      const updated: BloodRequestRecord = {
        ...existing,
        ...data,
        updated_at: new Date(),
      };
      this.data.blood_requests[index] = updated;
      this.persist();

      const item: any = { ...updated };
      if (include?.requester) {
        const reqUser = this.data.users.find((u) => u.id === updated.requester_id);
        item.requester = reqUser ? { ...reqUser } : null;
      }
      return item;
    },

    deleteMany: async () => {
      this.data = this.loadData();
      const count = this.data.blood_requests.length;
      this.data.blood_requests = [];
      this.persist();
      return { count };
    },

    count: async (args?: { where?: any }) => {
      this.data = this.loadData();
      if (!args?.where) return this.data.blood_requests.length;
      return this.data.blood_requests.filter((r) => {
        if (args.where.requester_id && r.requester_id !== args.where.requester_id) return false;
        if (args.where.status && r.status !== args.where.status) return false;
        return true;
      }).length;
    },
  };

  // --------------------------------------------------------------------------
  // BLOOD UNITS OPERATIONS
  // --------------------------------------------------------------------------
  public bloodUnit = {
    findUnique: async ({ where }: { where: { id?: string; unit_number?: string } }) => {
      this.data = this.loadData();
      const match = this.data.blood_units.find(
        (bu) => (where.id && bu.id === where.id) || (where.unit_number && bu.unit_number === where.unit_number)
      );
      return match ? { ...match } : null;
    },

    findMany: async (args?: { where?: any; orderBy?: any; take?: number; skip?: number }) => {
      this.data = this.loadData();
      let list = [...this.data.blood_units];
      if (args?.where) {
        list = list.filter((bu) => {
          if (args.where.blood_group) {
            if (typeof args.where.blood_group === 'object' && Array.isArray(args.where.blood_group.in)) {
              if (!args.where.blood_group.in.includes(bu.blood_group)) return false;
            } else if (bu.blood_group !== args.where.blood_group) return false;
          }
          if (args.where.status) {
            if (typeof args.where.status === 'object' && Array.isArray(args.where.status.in)) {
              if (!args.where.status.in.includes(bu.status)) return false;
            } else if (bu.status !== args.where.status) return false;
          }
          if (args.where.component_type && bu.component_type !== args.where.component_type) return false;
          return true;
        });
      }

      if (args?.orderBy?.expiry_date) {
        list.sort((a, b) =>
          args.orderBy.expiry_date === 'desc'
            ? b.expiry_date.getTime() - a.expiry_date.getTime()
            : a.expiry_date.getTime() - b.expiry_date.getTime()
        );
      }

      const skip = args?.skip || 0;
      const take = args?.take ? skip + args.take : list.length;
      return list.slice(skip, take).map((bu) => ({ ...bu }));
    },

    create: async ({ data }: { data: any }) => {
      this.data = this.loadData();
      const now = new Date();
      const newUnit: BloodUnitRecord = {
        id: data.id || crypto.randomUUID(),
        unit_number: data.unit_number,
        blood_group: data.blood_group,
        component_type: data.component_type || 'RBC',
        collection_date: data.collection_date ? new Date(data.collection_date) : now,
        expiry_date: data.expiry_date ? new Date(data.expiry_date) : new Date(now.getTime() + 35 * 86400000),
        volume_ml: Number(data.volume_ml) || 450,
        donation_id: data.donation_id || null,
        storage_location: data.storage_location || 'Vault A - Main Cold Storage',
        status: data.status || 'AVAILABLE',
        reserved_for_id: data.reserved_for_id || null,
        created_at: now,
        updated_at: now,
      };
      this.data.blood_units.push(newUnit);
      this.persist();
      return { ...newUnit };
    },

    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      this.data = this.loadData();
      const index = this.data.blood_units.findIndex((bu) => bu.id === where.id);
      if (index === -1) throw new Error(`BloodUnit with id ${where.id} not found`);
      const existing = this.data.blood_units[index];
      const updated: BloodUnitRecord = {
        ...existing,
        ...data,
        updated_at: new Date(),
      };
      this.data.blood_units[index] = updated;
      this.persist();
      return { ...updated };
    },

    deleteMany: async () => {
      this.data = this.loadData();
      const count = this.data.blood_units.length;
      this.data.blood_units = [];
      this.persist();
      return { count };
    },

    count: async (args?: { where?: any }) => {
      this.data = this.loadData();
      if (!args?.where) return this.data.blood_units.length;
      return (await this.bloodUnit.findMany(args)).length;
    },
  };

  // --------------------------------------------------------------------------
  // HOSPITAL OPERATIONS
  // --------------------------------------------------------------------------
  public hospital = {
    findUnique: async ({ where }: { where: { id?: string; name?: string } }) => {
      this.data = this.loadData();
      const match = this.data.hospitals.find(
        (h) => (where.id && h.id === where.id) || (where.name && h.name.toLowerCase() === where.name.toLowerCase())
      );
      return match ? { ...match } : null;
    },

    findMany: async (args?: { where?: any; orderBy?: any; take?: number; skip?: number }) => {
      this.data = this.loadData();
      let list = [...this.data.hospitals];
      if (args?.where) {
        list = list.filter((h) => {
          if (args.where.is_verified !== undefined && h.is_verified !== args.where.is_verified) return false;
          if (args.where.is_active !== undefined && h.is_active !== args.where.is_active) return false;
          if (args.where.name && !h.name.toLowerCase().includes(String(args.where.name).toLowerCase())) return false;
          return true;
        });
      }

      if (args?.orderBy?.name) {
        list.sort((a, b) =>
          args.orderBy.name === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
        );
      }

      const skip = args?.skip || 0;
      const take = args?.take ? skip + args.take : list.length;
      return list.slice(skip, take).map((h) => ({ ...h }));
    },

    create: async ({ data }: { data: any }) => {
      this.data = this.loadData();
      const now = new Date();
      const newId = data.id || crypto.randomUUID();
      const existingIndex = this.data.hospitals.findIndex((h) => h.id === newId);

      const newHospital: HospitalRecord = {
        id: newId,
        name: String(data.name).trim(),
        address: String(data.address || 'Medical Ward').trim(),
        latitude: Number(data.latitude) || 28.6139,
        longitude: Number(data.longitude) || 77.2090,
        contact_number: String(data.contact_number || '+91-11-26588500').trim(),
        emergency_contact: String(data.emergency_contact || '+91-11-26588700').trim(),
        is_verified: data.is_verified !== undefined ? Boolean(data.is_verified) : true,
        is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
        created_at: now,
        updated_at: now,
      };

      if (existingIndex !== -1) {
        this.data.hospitals[existingIndex] = newHospital;
      } else {
        this.data.hospitals.push(newHospital);
      }
      this.persist();
      return { ...newHospital };
    },

    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      this.data = this.loadData();
      const index = this.data.hospitals.findIndex((h) => h.id === where.id);
      if (index === -1) throw new Error(`Hospital with id ${where.id} not found`);
      const existing = this.data.hospitals[index];
      const updated: HospitalRecord = {
        ...existing,
        ...data,
        updated_at: new Date(),
      };
      this.data.hospitals[index] = updated;
      this.persist();
      return { ...updated };
    },

    deleteMany: async () => {
      this.data = this.loadData();
      const count = this.data.hospitals.length;
      this.data.hospitals = [];
      this.persist();
      return { count };
    },

    count: async (args?: { where?: any }) => {
      this.data = this.loadData();
      if (!args?.where) return this.data.hospitals.length;
      return (await this.hospital.findMany(args)).length;
    },
  };

  // --------------------------------------------------------------------------
  // BLOOD ORDERS (FEATURE 1)
  // --------------------------------------------------------------------------
  public bloodOrder = {
    findUnique: async ({ where, include }: { where: { id: string }; include?: any }) => {
      this.data = this.loadData();
      const match = this.data.blood_orders.find((bo) => bo.id === where.id);
      if (!match) return null;
      const res: any = { ...match };
      if (include?.hospital) {
        res.hospital = this.data.hospitals.find((h) => h.id === match.hospital_id) || null;
      }
      if (include?.user) {
        res.user = this.data.users.find((u) => u.id === match.user_id) || null;
      }
      return res;
    },

    findMany: async (args?: { where?: any; include?: any; orderBy?: any }) => {
      this.data = this.loadData();
      let list = [...this.data.blood_orders];
      if (args?.where) {
        list = list.filter((bo) => {
          if (args.where.user_id && bo.user_id !== args.where.user_id) return false;
          if (args.where.status && bo.status !== args.where.status) return false;
          return true;
        });
      }

      list.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

      return list.map((bo) => {
        const item: any = { ...bo };
        if (args?.include?.hospital) {
          item.hospital = this.data.hospitals.find((h) => h.id === bo.hospital_id) || null;
        }
        if (args?.include?.user) {
          const u = this.data.users.find((u) => u.id === bo.user_id);
          if (u) {
            item.user = {
              id: u.id,
              name: u.name,
              email: u.email,
              phone: u.phone,
              blood_group: u.blood_group,
              profile: this.data.user_profiles.find((p) => p.user_id === u.id) || null,
            };
          } else {
            item.user = null;
          }
        }
        return item;
      });
    },

    create: async ({ data, include }: { data: any; include?: any }) => {
      this.data = this.loadData();
      const now = new Date();
      const newOrder: BloodOrderRecord = {
        id: data.id || crypto.randomUUID(),
        user_id: data.user_id,
        blood_group: data.blood_group,
        units: Number(data.units) || 1,
        hospital_name: data.hospital_name,
        hospital_id: data.hospital_id || null,
        urgency: data.urgency || 'STANDARD',
        reason: data.reason || null,
        needed_by: data.needed_by ? new Date(data.needed_by) : null,
        status: data.status || 'Pending',
        admin_notes: data.admin_notes || null,
        created_at: now,
        updated_at: now,
      };
      this.data.blood_orders.push(newOrder);
      this.persist();

      const item: any = { ...newOrder };
      if (include?.hospital) {
        item.hospital = this.data.hospitals.find((h) => h.id === newOrder.hospital_id) || null;
      }
      return item;
    },

    update: async ({ where, data, include }: { where: { id: string }; data: any; include?: any }) => {
      this.data = this.loadData();
      const index = this.data.blood_orders.findIndex((bo) => bo.id === where.id);
      if (index === -1) throw new Error(`BloodOrder with id ${where.id} not found`);
      const existing = this.data.blood_orders[index];
      const updated: BloodOrderRecord = {
        ...existing,
        ...data,
        updated_at: new Date(),
      };
      this.data.blood_orders[index] = updated;
      this.persist();

      const item: any = { ...updated };
      if (include?.hospital) {
        item.hospital = this.data.hospitals.find((h) => h.id === updated.hospital_id) || null;
      }
      if (include?.user) {
        item.user = this.data.users.find((u) => u.id === updated.user_id) || null;
      }
      return item;
    },

    deleteMany: async () => {
      this.data = this.loadData();
      const count = this.data.blood_orders.length;
      this.data.blood_orders = [];
      this.persist();
      return { count };
    },

    count: async () => {
      this.data = this.loadData();
      return this.data.blood_orders.length;
    },
  };

  // --------------------------------------------------------------------------
  // REPORTS (FEATURE 2)
  // --------------------------------------------------------------------------
  public report = {
    findUnique: async ({ where }: { where: { id: string } }) => {
      this.data = this.loadData();
      const match = this.data.reports.find((r) => r.id === where.id);
      return match ? { ...match } : null;
    },

    findFirst: async ({ where }: { where: any }) => {
      this.data = this.loadData();
      const match = this.data.reports.find((r) => {
        if (where.id && r.id !== where.id) return false;
        if (where.user_id && r.user_id !== where.user_id) return false;
        return true;
      });
      return match ? { ...match } : null;
    },

    findMany: async (args?: { where?: any; include?: any; orderBy?: any }) => {
      this.data = this.loadData();
      let list = [...this.data.reports];
      if (args?.where) {
        list = list.filter((r) => {
          if (args.where.user_id && r.user_id !== args.where.user_id) return false;
          if (args.where.is_flagged !== undefined && r.is_flagged !== args.where.is_flagged) return false;
          if (args.where.created_at?.gte && r.created_at < args.where.created_at.gte) return false;
          return true;
        });
      }

      list.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

      return list.map((r) => {
        const item: any = { ...r };
        if (args?.include?.user) {
          item.user = this.data.users.find((u) => u.id === r.user_id) || null;
        }
        return item;
      });
    },

    create: async ({ data }: { data: any }) => {
      this.data = this.loadData();
      const now = new Date();
      const newReport: ReportRecord = {
        id: data.id || crypto.randomUUID(),
        user_id: data.user_id,
        file_name: data.file_name,
        file_url: data.file_url || null,
        file_type: data.file_type || null,
        file_size: Number(data.file_size) || null,
        extracted_text: data.extracted_text || null,
        summary: data.summary || null,
        abnormal_values: data.abnormal_values || null,
        risk_flags: data.risk_flags || null,
        suggested_step: data.suggested_step || null,
        is_flagged: Boolean(data.is_flagged),
        created_at: now,
        updated_at: now,
      };
      this.data.reports.push(newReport);
      this.persist();
      return { ...newReport };
    },

    delete: async ({ where }: { where: { id: string } }) => {
      this.data = this.loadData();
      const idx = this.data.reports.findIndex((r) => r.id === where.id);
      if (idx === -1) throw new Error(`Report not found`);
      const deleted = this.data.reports.splice(idx, 1)[0];
      this.persist();
      return deleted;
    },

    deleteMany: async () => {
      this.data = this.loadData();
      const count = this.data.reports.length;
      this.data.reports = [];
      this.persist();
      return { count };
    },
  };

  // --------------------------------------------------------------------------
  // DOCTORS & MESSAGES (FEATURE 3 & 4)
  // --------------------------------------------------------------------------
  public doctor = {
    findUnique: async ({ where }: { where: { id: string } }) => {
      this.data = this.loadData();
      const match = this.data.doctors.find((d) => d.id === where.id);
      return match ? { ...match } : null;
    },

    findMany: async (args?: { where?: any; include?: any; orderBy?: any }) => {
      this.data = this.loadData();
      let list = [...this.data.doctors];
      if (args?.where) {
        list = list.filter((d) => {
          if (args.where.is_available !== undefined && d.is_available !== args.where.is_available) return false;
          return true;
        });
      }

      if (args?.orderBy?.experience_yrs) {
        list.sort((a, b) => (b.experience_yrs || 0) - (a.experience_yrs || 0));
      }

      return list.map((d) => {
        const item: any = { ...d };
        if (args?.include?.hospital) {
          item.hospital = this.data.hospitals.find((h) => h.id === d.hospital_id) || null;
        }
        return item;
      });
    },

    create: async ({ data }: { data: any }) => {
      this.data = this.loadData();
      const now = new Date();
      const newDoctor: DoctorRecord = {
        id: data.id || crypto.randomUUID(),
        name: data.name,
        specialty: data.specialty,
        hospital_name: data.hospital_name,
        hospital_id: data.hospital_id || null,
        phone: data.phone,
        email: data.email,
        qualification: data.qualification || null,
        experience_yrs: Number(data.experience_yrs) || 5,
        avatar_url: data.avatar_url || null,
        is_available: data.is_available !== undefined ? Boolean(data.is_available) : true,
        created_at: now,
        updated_at: now,
      };
      this.data.doctors.push(newDoctor);
      this.persist();
      return { ...newDoctor };
    },

    count: async () => {
      this.data = this.loadData();
      return this.data.doctors.length;
    },

    deleteMany: async () => {
      this.data = this.loadData();
      const count = this.data.doctors.length;
      this.data.doctors = [];
      this.persist();
      return { count };
    },
  };

  public doctorMessage = {
    findMany: async (args?: { where?: any; orderBy?: any }) => {
      this.data = this.loadData();
      let list = [...this.data.doctor_messages];
      if (args?.where) {
        list = list.filter((m) => {
          if (args.where.user_id && m.user_id !== args.where.user_id) return false;
          if (args.where.doctor_id && m.doctor_id !== args.where.doctor_id) return false;
          return true;
        });
      }

      list.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
      return list.map((m) => ({ ...m }));
    },

    create: async ({ data }: { data: any }) => {
      this.data = this.loadData();
      const now = new Date();
      const newMsg: DoctorMessageRecord = {
        id: data.id || crypto.randomUUID(),
        user_id: data.user_id,
        doctor_id: data.doctor_id,
        sender: data.sender || 'USER',
        message: data.message,
        read_at: data.read_at ? new Date(data.read_at) : null,
        created_at: now,
      };
      this.data.doctor_messages.push(newMsg);
      this.persist();
      return { ...newMsg };
    },

    deleteMany: async () => {
      this.data = this.loadData();
      const count = this.data.doctor_messages.length;
      this.data.doctor_messages = [];
      this.persist();
      return { count };
    },
  };

  // --------------------------------------------------------------------------
  // NOTIFICATIONS (FEATURE 5 - Phase 9)
  // --------------------------------------------------------------------------
  public notification = {
    findFirst: async ({ where }: { where: any }) => {
      this.data = this.loadData();
      const match = this.data.notifications.find((n) => {
        if (where.user_id && n.user_id !== where.user_id) return false;
        if (where.type && n.type !== where.type) return false;
        if (where.created_at?.gte && n.created_at < where.created_at.gte) return false;
        if (where.title?.contains && !n.title.toLowerCase().includes(where.title.contains.toLowerCase())) return false;
        return true;
      });
      return match ? { ...match } : null;
    },

    findMany: async (args?: { where?: any; orderBy?: any }) => {
      this.data = this.loadData();
      let list = [...this.data.notifications];
      if (args?.where) {
        list = list.filter((n) => {
          if (args.where.user_id && n.user_id !== args.where.user_id) return false;
          if (args.where.type && n.type !== args.where.type) return false;
          if (args.where.read_at === null && n.read_at !== null) return false;
          return true;
        });
      }

      list.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
      return list.map((n) => ({ ...n }));
    },

    create: async ({ data }: { data: any }) => {
      this.data = this.loadData();
      const now = new Date();
      const newNotif: NotificationRecord = {
        id: data.id || crypto.randomUUID(),
        user_id: data.user_id,
        type: data.type || 'health_tip',
        title: data.title,
        message: data.message,
        scheduled_at: data.scheduled_at ? new Date(data.scheduled_at) : now,
        read_at: data.read_at ? new Date(data.read_at) : null,
        created_at: now,
        updated_at: now,
      };
      this.data.notifications.push(newNotif);
      this.persist();
      return { ...newNotif };
    },

    updateMany: async ({ where, data }: { where: any; data: any }) => {
      this.data = this.loadData();
      let count = 0;
      for (const n of this.data.notifications) {
        if (where.id && n.id !== where.id) continue;
        if (where.user_id && n.user_id !== where.user_id) continue;
        if (where.read_at === null && n.read_at !== null) continue;

        if (data.read_at !== undefined) n.read_at = data.read_at ? new Date(data.read_at) : null;
        n.updated_at = new Date();
        count++;
      }
      this.persist();
      return { count };
    },

    deleteMany: async (args?: { where?: any }) => {
      this.data = this.loadData();
      if (!args?.where) {
        const count = this.data.notifications.length;
        this.data.notifications = [];
        this.persist();
        return { count };
      }

      const initialCount = this.data.notifications.length;
      this.data.notifications = this.data.notifications.filter((n) => {
        if (args.where.id && n.id === args.where.id) return false;
        if (args.where.user_id && n.user_id === args.where.user_id) return false;
        return true;
      });
      const count = initialCount - this.data.notifications.length;
      this.persist();
      return { count };
    },
  };

  // --------------------------------------------------------------------------
  // TRANSACTION & UTILITY
  // --------------------------------------------------------------------------
  public async $transaction<T>(fn: (tx: LocalDatabaseEngine) => Promise<T>): Promise<T> {
    return await fn(this);
  }

  public async $queryRaw(_query: any): Promise<any[]> {
    return [{ health: 1 }];
  }

  public async $disconnect(): Promise<void> {
    this.persist();
  }
}

// Singleton Instance
export const prisma = new LocalDatabaseEngine();
export default prisma;
