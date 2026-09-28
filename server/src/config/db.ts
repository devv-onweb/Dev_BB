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

interface DatabaseSchema {
  users: UserRecord[];
  blood_inventory: BloodInventoryRecord[];
  donations: DonationRecord[];
  blood_requests: BloodRequestRecord[];
  blood_units: BloodUnitRecord[];
  hospitals: HospitalRecord[];
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

        return {
          users: (parsed.users || []).map((u: any) => ({
            ...u,
            created_at: new Date(u.created_at),
            updated_at: new Date(u.updated_at),
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
        };
      }
    } catch (e) {
      console.warn('Error reading dev_db.json from disk:', e);
    }

    return {
      users: [],
      blood_inventory: [],
      donations: [],
      blood_requests: [],
      blood_units: [],
      hospitals: DEFAULT_HOSPITALS,
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
    findUnique: async ({ where, select }: { where: { id?: string; email?: string }; select?: any }) => {
      this.data = this.loadData();
      const match = this.data.users.find(
        (u) =>
          (where.id && u.id === where.id) ||
          (where.email && u.email.toLowerCase() === where.email.toLowerCase())
      );
      if (!match) return null;
      return select ? this.filterBySelect(match, select) : { ...match };
    },

    findMany: async (args?: { where?: any; select?: any }) => {
      this.data = this.loadData();
      let list = this.data.users;
      if (args?.where) {
        list = list.filter((u) => {
          for (const key in args.where) {
            if ((u as any)[key] !== args.where[key]) return false;
          }
          return true;
        });
      }
      return list.map((u) => (args?.select ? this.filterBySelect(u, args.select) : { ...u }));
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

    update: async ({ where, data, select }: { where: { id: string }; data: any; select?: any }) => {
      this.data = this.loadData();
      const index = this.data.users.findIndex((u) => u.id === where.id);
      if (index === -1) throw new Error(`User with id ${where.id} not found`);
      const existing = this.data.users[index];
      const updated: UserRecord = {
        ...existing,
        ...data,
        updated_at: new Date(),
      };
      this.data.users[index] = updated;
      this.persist();
      return select ? this.filterBySelect(updated, select) : { ...updated };
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
