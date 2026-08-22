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
class LocalDatabaseEngine {
    dbFilePath = DB_FILE_PATH;
    data;
    constructor() {
        this.data = this.loadData();
    }
    loadData() {
        try {
            if (fs.existsSync(this.dbFilePath)) {
                const raw = fs.readFileSync(this.dbFilePath, 'utf-8');
                const parsed = JSON.parse(raw);
                return {
                    users: (parsed.users || []).map((u) => ({
                        ...u,
                        created_at: new Date(u.created_at),
                        updated_at: new Date(u.updated_at),
                    })),
                    blood_inventory: (parsed.blood_inventory || []).map((i) => ({
                        ...i,
                        last_updated: new Date(i.last_updated),
                    })),
                    donations: (parsed.donations || []).map((d) => ({
                        ...d,
                        donation_date: new Date(d.donation_date),
                        created_at: new Date(d.created_at),
                        updated_at: new Date(d.updated_at),
                    })),
                    blood_requests: (parsed.blood_requests || []).map((r) => ({
                        ...r,
                        created_at: new Date(r.created_at),
                        updated_at: new Date(r.updated_at),
                    })),
                };
            }
        }
        catch (e) {
            console.warn('Error reading dev_db.json from disk:', e);
        }
        return {
            users: [],
            blood_inventory: [],
            donations: [],
            blood_requests: [],
        };
    }
    persist() {
        try {
            fs.writeFileSync(this.dbFilePath, JSON.stringify(this.data, null, 2), 'utf-8');
        }
        catch (err) {
            console.error('Failed to persist database to disk:', err);
        }
    }
    filterBySelect(obj, select) {
        if (!select)
            return obj;
        const result = {};
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
    user = {
        findUnique: async ({ where, select }) => {
            this.data = this.loadData();
            const match = this.data.users.find((u) => (where.id && u.id === where.id) ||
                (where.email && u.email.toLowerCase() === where.email.toLowerCase()));
            if (!match)
                return null;
            return select ? this.filterBySelect(match, select) : { ...match };
        },
        findMany: async (args) => {
            this.data = this.loadData();
            let list = this.data.users;
            if (args?.where) {
                list = list.filter((u) => {
                    for (const key in args.where) {
                        if (u[key] !== args.where[key])
                            return false;
                    }
                    return true;
                });
            }
            return list.map((u) => (args?.select ? this.filterBySelect(u, args.select) : { ...u }));
        },
        create: async ({ data, select }) => {
            this.data = this.loadData();
            const now = new Date();
            const newUser = {
                id: data.id || crypto.randomUUID(),
                name: data.name,
                email: data.email.toLowerCase().trim(),
                password_hash: data.password_hash,
                role: data.role || 'PATIENT',
                phone: data.phone || null,
                blood_group: data.blood_group || null,
                created_at: data.created_at || now,
                updated_at: data.updated_at || now,
            };
            this.data.users.push(newUser);
            this.persist();
            return select ? this.filterBySelect(newUser, select) : { ...newUser };
        },
        update: async ({ where, data, select }) => {
            this.data = this.loadData();
            const index = this.data.users.findIndex((u) => u.id === where.id);
            if (index === -1)
                throw new Error(`User with id ${where.id} not found`);
            const existing = this.data.users[index];
            const updated = {
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
    bloodInventory = {
        findUnique: async ({ where }) => {
            this.data = this.loadData();
            const match = this.data.blood_inventory.find((i) => (where.id && i.id === where.id) || (where.blood_group && i.blood_group === where.blood_group));
            return match ? { ...match } : null;
        },
        findMany: async (args) => {
            this.data = this.loadData();
            let list = [...this.data.blood_inventory];
            if (args?.orderBy?.blood_group) {
                list.sort((a, b) => a.blood_group.localeCompare(b.blood_group));
            }
            return list.map((i) => ({ ...i }));
        },
        create: async ({ data }) => {
            this.data = this.loadData();
            const now = new Date();
            const newItem = {
                id: data.id || crypto.randomUUID(),
                blood_group: data.blood_group,
                units_available: Number(data.units_available) || 0,
                last_updated: data.last_updated || now,
            };
            this.data.blood_inventory.push(newItem);
            this.persist();
            return { ...newItem };
        },
        update: async ({ where, data }) => {
            this.data = this.loadData();
            const index = this.data.blood_inventory.findIndex((i) => (where.id && i.id === where.id) || (where.blood_group && i.blood_group === where.blood_group));
            if (index === -1)
                throw new Error(`Inventory item not found`);
            const existing = this.data.blood_inventory[index];
            let newUnits = existing.units_available;
            if (typeof data.units_available === 'number') {
                newUnits = data.units_available;
            }
            else if (data.units_available?.increment) {
                newUnits += data.units_available.increment;
            }
            else if (data.units_available?.decrement) {
                newUnits -= data.units_available.decrement;
            }
            const updated = {
                ...existing,
                units_available: Math.max(0, newUnits),
                last_updated: new Date(),
            };
            this.data.blood_inventory[index] = updated;
            this.persist();
            return { ...updated };
        },
        upsert: async ({ where, update, create, }) => {
            this.data = this.loadData();
            const existing = await this.bloodInventory.findUnique({ where });
            if (existing) {
                return this.bloodInventory.update({ where, data: update });
            }
            else {
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
    donation = {
        findUnique: async ({ where, include }) => {
            this.data = this.loadData();
            const match = this.data.donations.find((d) => d.id === where.id);
            if (!match)
                return null;
            const res = { ...match };
            if (include?.donor) {
                const donor = this.data.users.find((u) => u.id === match.donor_id);
                const donorSelect = typeof include.donor === 'object' && include.donor.select ? include.donor.select : null;
                res.donor = donor ? (donorSelect ? this.filterBySelect(donor, donorSelect) : { ...donor }) : null;
            }
            return res;
        },
        findMany: async (args) => {
            this.data = this.loadData();
            let list = [...this.data.donations];
            if (args?.where) {
                list = list.filter((d) => {
                    if (args.where.donor_id && d.donor_id !== args.where.donor_id)
                        return false;
                    if (args.where.status && d.status !== args.where.status)
                        return false;
                    return true;
                });
            }
            if (args?.orderBy?.donation_date) {
                list.sort((a, b) => args.orderBy.donation_date === 'desc'
                    ? b.donation_date.getTime() - a.donation_date.getTime()
                    : a.donation_date.getTime() - b.donation_date.getTime());
            }
            const skip = args?.skip || 0;
            const take = args?.take ? skip + args.take : list.length;
            const paginated = list.slice(skip, take);
            return paginated.map((d) => {
                const item = { ...d };
                if (args?.include?.donor) {
                    const donor = this.data.users.find((u) => u.id === d.donor_id);
                    if (donor) {
                        const donorSelect = typeof args.include.donor === 'object' && args.include.donor.select
                            ? args.include.donor.select
                            : null;
                        item.donor = donorSelect ? this.filterBySelect(donor, donorSelect) : { ...donor };
                    }
                    else {
                        item.donor = null;
                    }
                }
                return item;
            });
        },
        create: async ({ data, include }) => {
            this.data = this.loadData();
            const now = new Date();
            const newDonation = {
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
            const item = { ...newDonation };
            if (include?.donor) {
                const donor = this.data.users.find((u) => u.id === newDonation.donor_id);
                item.donor = donor ? { ...donor } : null;
            }
            return item;
        },
        createMany: async ({ data }) => {
            this.data = this.loadData();
            for (const d of data) {
                const now = new Date();
                const newDonation = {
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
        update: async ({ where, data, include }) => {
            this.data = this.loadData();
            const index = this.data.donations.findIndex((d) => d.id === where.id);
            if (index === -1)
                throw new Error(`Donation with id ${where.id} not found`);
            const existing = this.data.donations[index];
            const updated = {
                ...existing,
                ...data,
                updated_at: new Date(),
            };
            this.data.donations[index] = updated;
            this.persist();
            const item = { ...updated };
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
        count: async (args) => {
            this.data = this.loadData();
            if (!args?.where)
                return this.data.donations.length;
            return this.data.donations.filter((d) => {
                if (args.where.donor_id && d.donor_id !== args.where.donor_id)
                    return false;
                if (args.where.status && d.status !== args.where.status)
                    return false;
                return true;
            }).length;
        },
    };
    // --------------------------------------------------------------------------
    // BLOOD REQUESTS OPERATIONS
    // --------------------------------------------------------------------------
    bloodRequest = {
        findUnique: async ({ where, include }) => {
            this.data = this.loadData();
            const match = this.data.blood_requests.find((r) => r.id === where.id);
            if (!match)
                return null;
            const res = { ...match };
            if (include?.requester) {
                const requester = this.data.users.find((u) => u.id === match.requester_id);
                const reqSelect = typeof include.requester === 'object' && include.requester.select ? include.requester.select : null;
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
        findMany: async (args) => {
            this.data = this.loadData();
            let list = [...this.data.blood_requests];
            if (args?.where) {
                list = list.filter((r) => {
                    if (args.where.requester_id && r.requester_id !== args.where.requester_id)
                        return false;
                    if (args.where.status && r.status !== args.where.status)
                        return false;
                    if (args.where.urgency && r.urgency !== args.where.urgency)
                        return false;
                    if (args.where.blood_group && r.blood_group !== args.where.blood_group)
                        return false;
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
                const item = { ...r };
                if (args?.include?.requester) {
                    const reqUser = this.data.users.find((u) => u.id === r.requester_id);
                    if (reqUser) {
                        const reqSelect = typeof args.include.requester === 'object' && args.include.requester.select
                            ? args.include.requester.select
                            : null;
                        item.requester = reqSelect ? this.filterBySelect(reqUser, reqSelect) : { ...reqUser };
                    }
                    else {
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
        create: async ({ data, include }) => {
            this.data = this.loadData();
            const now = new Date();
            const newReq = {
                id: data.id || crypto.randomUUID(),
                requester_id: data.requester_id,
                blood_group: data.blood_group,
                units_requested: Number(data.units_requested),
                hospital_name: data.hospital_name,
                urgency: data.urgency || 'NORMAL',
                status: data.status || 'PENDING',
                created_at: now,
                updated_at: now,
            };
            this.data.blood_requests.push(newReq);
            this.persist();
            const item = { ...newReq };
            if (include?.requester) {
                const reqUser = this.data.users.find((u) => u.id === newReq.requester_id);
                item.requester = reqUser ? { ...reqUser } : null;
            }
            return item;
        },
        createMany: async ({ data }) => {
            this.data = this.loadData();
            for (const r of data) {
                const now = new Date();
                const newReq = {
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
        update: async ({ where, data, include }) => {
            this.data = this.loadData();
            const index = this.data.blood_requests.findIndex((r) => r.id === where.id);
            if (index === -1)
                throw new Error(`BloodRequest with id ${where.id} not found`);
            const existing = this.data.blood_requests[index];
            const updated = {
                ...existing,
                ...data,
                updated_at: new Date(),
            };
            this.data.blood_requests[index] = updated;
            this.persist();
            const item = { ...updated };
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
        count: async (args) => {
            this.data = this.loadData();
            if (!args?.where)
                return this.data.blood_requests.length;
            return this.data.blood_requests.filter((r) => {
                if (args.where.requester_id && r.requester_id !== args.where.requester_id)
                    return false;
                if (args.where.status && r.status !== args.where.status)
                    return false;
                return true;
            }).length;
        },
    };
    // --------------------------------------------------------------------------
    // TRANSACTION & UTILITY
    // --------------------------------------------------------------------------
    async $transaction(fn) {
        return await fn(this);
    }
    async $queryRaw(_query) {
        return [{ health: 1 }];
    }
    async $disconnect() {
        this.persist();
    }
}
// Singleton Instance
export const prisma = new LocalDatabaseEngine();
export default prisma;
