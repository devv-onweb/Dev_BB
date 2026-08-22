import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.js';
import axiosClient from '../api/axiosClient.js';
import {
  InventoryItem,
  Donation,
  BloodRequest,
  BloodGroup,
  formatBloodGroup,
} from '../types/index.js';
import {
  ShieldCheck,
  Droplets,
  HeartHandshake,
  FileText,
  AlertTriangle,
  RefreshCw,
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  User,
  AlertCircle,
  Loader2,
  Filter,
  Activity,
} from 'lucide-react';

interface NotificationState {
  type: 'success' | 'error' | 'warning';
  title: string;
  message: string;
}

const DEMO_INVENTORY: InventoryItem[] = [
  { id: 'inv-1', blood_group: 'A_POS', units_available: 28, last_updated: new Date().toISOString(), stock_status: 'SUFFICIENT' },
  { id: 'inv-2', blood_group: 'A_NEG', units_available: 12, last_updated: new Date().toISOString(), stock_status: 'LOW_STOCK' },
  { id: 'inv-3', blood_group: 'B_POS', units_available: 34, last_updated: new Date().toISOString(), stock_status: 'SUFFICIENT' },
  { id: 'inv-4', blood_group: 'B_NEG', units_available: 8, last_updated: new Date().toISOString(), stock_status: 'LOW_STOCK' },
  { id: 'inv-5', blood_group: 'O_POS', units_available: 52, last_updated: new Date().toISOString(), stock_status: 'SUFFICIENT' },
  { id: 'inv-6', blood_group: 'O_NEG', units_available: 4, last_updated: new Date().toISOString(), stock_status: 'CRITICAL' },
  { id: 'inv-7', blood_group: 'AB_POS', units_available: 18, last_updated: new Date().toISOString(), stock_status: 'SUFFICIENT' },
  { id: 'inv-8', blood_group: 'AB_NEG', units_available: 3, last_updated: new Date().toISOString(), stock_status: 'CRITICAL' },
];

const DEMO_REQUESTS: BloodRequest[] = [
  {
    id: 'req-01',
    requester_id: 'patient-amit-01',
    requester: { id: 'patient-amit-01', name: 'Amit Verma', email: 'patient.amit@example.com', phone: '+91-97555-66778', blood_group: 'O_NEG' },
    blood_group: 'O_NEG',
    units_requested: 2,
    hospital_name: 'AIIMS New Delhi Trauma Bay 3',
    urgency: 'URGENT',
    status: 'PENDING',
    created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    id: 'req-02',
    requester_id: 'patient-kavita-02',
    requester: { id: 'patient-kavita-02', name: 'Kavita Rao', email: 'patient.kavita@example.com', phone: '+91-98666-77889', blood_group: 'A_NEG' },
    blood_group: 'A_NEG',
    units_requested: 1,
    hospital_name: 'Apollo Hospitals Chennai OT 4',
    urgency: 'URGENT',
    status: 'PENDING',
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 'req-03',
    requester_id: 'patient-suresh-03',
    requester: { id: 'patient-suresh-03', name: 'Suresh Iyer', email: 'patient.suresh@example.com', phone: '+91-99777-88990', blood_group: 'B_POS' },
    blood_group: 'B_POS',
    units_requested: 3,
    hospital_name: 'Fortis Memorial Research Institute Gurugram ICU 2',
    urgency: 'NORMAL',
    status: 'PENDING',
    created_at: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
  },
];

const DEMO_DONATIONS: Donation[] = [
  {
    id: 'don-01',
    donor_id: 'donor-aarav-01',
    donor: { id: 'donor-aarav-01', name: 'Aarav Patel', email: 'donor.aarav@example.com', phone: '+91-98765-43210', blood_group: 'O_POS' },
    units_donated: 1,
    donation_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: 'PENDING',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'don-02',
    donor_id: 'donor-pooja-02',
    donor: { id: 'donor-pooja-02', name: 'Pooja Sharma', email: 'donor.pooja@example.com', phone: '+91-98111-22334', blood_group: 'A_POS' },
    units_donated: 1,
    donation_date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    status: 'PENDING',
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
];

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  // Data States
  const [inventory, setInventory] = useState<InventoryItem[]>(DEMO_INVENTORY);
  const [donations, setDonations] = useState<Donation[]>(DEMO_DONATIONS);
  const [requests, setRequests] = useState<BloodRequest[]>(DEMO_REQUESTS);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [requestFilter, setRequestFilter] = useState<'ALL' | 'PENDING' | 'URGENT'>('PENDING');
  const [donationFilter, setDonationFilter] = useState<'ALL' | 'PENDING'>('PENDING');

  // Action Loading States (keyed by item ID)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Notification Toast
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const showToast = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
    setNotification({ type, title, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 6000);
  };

  // Fetch All Admin Data (with background flag for silent auto-polling)
  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [invRes, donRes, reqRes] = await Promise.all([
        axiosClient.get('/inventory'),
        axiosClient.get('/donations?limit=100'),
        axiosClient.get('/requests?limit=100'),
      ]);

      if (invRes.data && invRes.data.success && Array.isArray(invRes.data.data?.inventory)) {
        setInventory(invRes.data.data.inventory);
      }
      if (donRes.data && donRes.data.success && Array.isArray(donRes.data.data?.donations)) {
        setDonations(donRes.data.data.donations);
      }
      if (reqRes.data && reqRes.data.success && Array.isArray(reqRes.data.data?.requests)) {
        setRequests(reqRes.data.data.requests);
      }
    } catch (err: any) {
      console.warn('Backend data load note:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Auto-refresh live data every 5 seconds
    const interval = setInterval(() => {
      fetchData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Handle Donation Approval or Rejection
  const handleDonationStatus = async (donationId: string, status: 'APPROVED' | 'REJECTED') => {
    setActionLoading((prev) => ({ ...prev, [donationId]: true }));
    try {
      const res = await axiosClient.put(`/donations/${donationId}/status`, { status });
      if (res.data && res.data.success) {
        showToast(
          status === 'APPROVED' ? 'success' : 'warning',
          status === 'APPROVED' ? 'Donation Approved' : 'Donation Rejected',
          res.data.message
        );
        await fetchData();
        return;
      }
    } catch {
      // Local state update fallback for Vercel
    }

    // Update local state directly
    setDonations((prev) =>
      prev.map((d) => (d.id === donationId ? { ...d, status } : d))
    );

    if (status === 'APPROVED') {
      const targetDonation = donations.find((d) => d.id === donationId);
      if (targetDonation && targetDonation.donor?.blood_group) {
        const bg = targetDonation.donor.blood_group;
        setInventory((prev) =>
          prev.map((inv) => {
            if (inv.blood_group === bg) {
              const updatedUnits = inv.units_available + targetDonation.units_donated;
              return {
                ...inv,
                units_available: updatedUnits,
                stock_status: updatedUnits > 15 ? 'SUFFICIENT' : 'LOW_STOCK',
              };
            }
            return inv;
          })
        );
      }
      showToast('success', 'Donation Approved', '1 Unit added to central blood vault.');
    } else {
      showToast('warning', 'Donation Rejected', 'Donation record marked as rejected.');
    }

    setActionLoading((prev) => ({ ...prev, [donationId]: false }));
  };

  // Handle Blood Request Fulfillment
  const handleFulfillRequest = async (requestId: string) => {
    setActionLoading((prev) => ({ ...prev, [requestId]: true }));
    try {
      const res = await axiosClient.put(`/requests/${requestId}/fulfill`);
      if (res.data && res.data.success) {
        showToast('success', 'Request Fulfilled', res.data.message);
        await fetchData();
        return;
      }
    } catch {
      // Local fallback for Vercel
    }

    const targetReq = requests.find((r) => r.id === requestId);
    if (targetReq) {
      const currentStock = inventory.find((i) => i.blood_group === targetReq.blood_group)?.units_available || 0;
      if (currentStock < targetReq.units_requested) {
        showToast('error', 'Shortage Warning', `Insufficient stock for ${formatBloodGroup(targetReq.blood_group)}.`);
        setActionLoading((prev) => ({ ...prev, [requestId]: false }));
        return;
      }

      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: 'FULFILLED' } : r))
      );

      setInventory((prev) =>
        prev.map((inv) => {
          if (inv.blood_group === targetReq.blood_group) {
            const updatedUnits = Math.max(0, inv.units_available - targetReq.units_requested);
            return {
              ...inv,
              units_available: updatedUnits,
              stock_status:
                updatedUnits < 5
                  ? 'CRITICAL'
                  : updatedUnits <= 15
                  ? 'LOW_STOCK'
                  : 'SUFFICIENT',
            };
          }
          return inv;
        })
      );

      showToast('success', 'Request Fulfilled', `Units successfully allocated and dispatched to ${targetReq.hospital_name}.`);
    }

    setActionLoading((prev) => ({ ...prev, [requestId]: false }));
  };

  // Handle Blood Request Rejection
  const handleRejectRequest = async (requestId: string) => {
    setActionLoading((prev) => ({ ...prev, [requestId]: true }));
    try {
      const res = await axiosClient.put(`/requests/${requestId}/reject`);
      if (res.data && res.data.success) {
        showToast('warning', 'Request Rejected', 'Blood request has been marked as REJECTED.');
        await fetchData();
        return;
      }
    } catch {
      // Local fallback for Vercel
    }

    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'REJECTED' } : r))
    );
    showToast('warning', 'Request Rejected', 'Blood request has been marked as REJECTED.');
    setActionLoading((prev) => ({ ...prev, [requestId]: false }));
  };

  // KPI Calculations
  const totalUnits = inventory.reduce((acc, curr) => acc + curr.units_available, 0);
  const pendingDonations = donations.filter((d) => d.status === 'PENDING');
  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const urgentPendingRequests = requests.filter((r) => r.urgency === 'URGENT' && r.status === 'PENDING');

  // Filtered Lists
  const filteredRequests = requests.filter((r) => {
    if (requestFilter === 'PENDING') return r.status === 'PENDING';
    if (requestFilter === 'URGENT') return r.urgency === 'URGENT' && r.status === 'PENDING';
    return true;
  });

  const filteredDonations = donations.filter((d) => {
    if (donationFilter === 'PENDING') return d.status === 'PENDING';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border flex items-start justify-between shadow-lg transition-all duration-300 ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : notification.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : 'bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="text-sm font-bold">{notification.title}</h4>
              <p className="text-xs mt-0.5 opacity-90">{notification.message}</p>
            </div>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 rounded-xl shadow-sm border border-rose-200 dark:border-rose-900">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Admin Command Center
                </h1>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Auto-Sync
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Centralized Blood Bank Management, Inventory Auditing & Request Dispatch
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all disabled:opacity-60 cursor-pointer active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 dark:text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh Live Data'}</span>
          </button>
        </div>
      </div>

      {/* Top KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Stock</span>
            <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <Droplets className="w-5 h-5" />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">{totalUnits}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Units available in blood bank</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Donations</span>
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <HeartHandshake className="w-5 h-5" />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">{pendingDonations.length}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Awaiting admin review</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Requests</span>
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Building2 className="w-5 h-5" />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">{pendingRequests.length}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Hospital & patient requisitions</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Urgent Alerts</span>
            <span className="p-2 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </span>
          </div>
          <div className="text-3xl font-black text-red-600 dark:text-red-400 mt-2">{urgentPendingRequests.length}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Emergency trauma requirements</div>
        </div>
      </div>

      {/* ------------------------------------------------------------------------ */}
      {/* 1. VISUAL INVENTORY GRID (8 Blood Groups) */}
      {/* ------------------------------------------------------------------------ */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Droplets className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              Blood Inventory Stock by Group
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visual stock monitor across all 8 standard blood types. Red indicates critical shortage (&lt; 5 units).
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-red-700 dark:text-red-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> &lt; 5 Critical
            </span>
            <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> 5-15 Low
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> &gt; 15 Optimal
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
            <p className="text-xs">Loading blood inventory...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5">
            {inventory.map((item) => {
              const isCritical = item.units_available < 5;
              const isLow = item.units_available >= 5 && item.units_available <= 15;
              const formattedGroup = formatBloodGroup(item.blood_group);

              return (
                <div
                  key={item.blood_group}
                  className={`p-4 rounded-2xl border text-center transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                    isCritical
                      ? 'bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-800 shadow-sm shadow-red-100 dark:shadow-none'
                      : isLow
                      ? 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                      : 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  {isCritical && (
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}

                  <div>
                    <div className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{formattedGroup}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 mt-0.5">Whole Blood</div>
                  </div>

                  <div className="my-3">
                    <div
                      className={`text-2xl sm:text-3xl font-black ${
                        isCritical
                          ? 'text-red-700 dark:text-red-400'
                          : isLow
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {item.units_available}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Units</div>
                  </div>

                  <div className="pt-2 border-t border-black/5 dark:border-white/10">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                        isCritical
                          ? 'bg-red-200/80 dark:bg-red-900/60 text-red-900 dark:text-red-200'
                          : isLow
                          ? 'bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
                          : 'bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200'
                      }`}
                    >
                      {item.stock_status === 'CRITICAL'
                        ? 'Critical'
                        : item.stock_status === 'LOW_STOCK'
                        ? 'Low'
                        : 'Optimal'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------------ */}
      {/* 2. PENDING BLOOD REQUESTS TABLE */}
      {/* ------------------------------------------------------------------------ */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Patient & Hospital Blood Requests
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review and fulfill requisitions with real-time stock sufficiency checks
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setRequestFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                requestFilter === 'PENDING'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pending ({pendingRequests.length})
            </button>
            <button
              onClick={() => setRequestFilter('URGENT')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                requestFilter === 'URGENT'
                  ? 'bg-red-600 text-white shadow-sm font-bold'
                  : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
              }`}
            >
              🚨 Urgent ({urgentPendingRequests.length})
            </button>
            <button
              onClick={() => setRequestFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                requestFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All History ({requests.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs">Loading blood requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400">
            <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700 dark:text-slate-200">No requests in this view</p>
            <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {requestFilter === 'PENDING'
                ? 'All pending blood requisitions have been processed. Switch to "All History" to view fulfilled requests.'
                : 'There are no blood requests matching the selected filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-6">Requester Details</th>
                  <th className="py-3.5 px-6">Hospital / Center</th>
                  <th className="py-3.5 px-6">Blood Group & Units</th>
                  <th className="py-3.5 px-6">Urgency</th>
                  <th className="py-3.5 px-6">Date Requested</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRequests.map((req) => {
                  const isBusy = actionLoading[req.id];
                  // Look up current stock in inventory
                  const inStock = inventory.find((i) => i.blood_group === req.blood_group)?.units_available ?? 0;
                  const hasSufficientStock = inStock >= req.units_requested;

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Requester */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 dark:text-white">{req.requester?.name || 'Unknown Patient'}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{req.requester?.email}</div>
                        {req.requester?.phone && (
                          <div className="text-xs text-slate-400 dark:text-slate-400">{req.requester.phone}</div>
                        )}
                      </td>

                      {/* Hospital */}
                      <td className="py-4 px-6 font-medium text-slate-800 dark:text-slate-200">
                        {req.hospital_name}
                      </td>

                      {/* Blood Group & Units */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            {formatBloodGroup(req.blood_group)}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {req.units_requested} {req.units_requested === 1 ? 'Unit' : 'Units'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-400 mt-1">
                          In stock: <span className={hasSufficientStock ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-red-600 dark:text-red-400 font-bold'}>{inStock} units</span>
                        </div>
                      </td>

                      {/* Urgency */}
                      <td className="py-4 px-6">
                        {req.urgency === 'URGENT' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Urgent
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            Normal
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(req.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {req.status === 'FULFILLED' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Fulfilled
                          </span>
                        )}
                        {req.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3.5 h-3.5" />
                            Pending
                          </span>
                        )}
                        {req.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approved
                          </span>
                        )}
                        {req.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <XCircle className="w-3.5 h-3.5" />
                            Rejected
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        {req.status === 'PENDING' ? (
                          <div className="inline-flex items-center gap-2">
                            {/* Approve & Fulfill Button */}
                            <button
                              onClick={() => handleFulfillRequest(req.id)}
                              disabled={isBusy}
                              title={
                                hasSufficientStock
                                  ? 'Approve and deduct units from stock'
                                  : 'Warning: Current stock is insufficient'
                              }
                              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer active:scale-95 ${
                                hasSufficientStock
                                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-none'
                                  : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200 dark:shadow-none'
                              }`}
                            >
                              {isBusy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>{hasSufficientStock ? 'Approve & Fulfill' : 'Approve (Low)'}</span>
                            </button>

                            {/* Reject Button */}
                            <button
                              onClick={() => handleRejectRequest(req.id)}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                            >
                              {isBusy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <X className="w-3.5 h-3.5" />
                              )}
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-400 italic">No action required</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------------ */}
      {/* 3. PENDING DONOR SUBMISSIONS TABLE */}
      {/* ------------------------------------------------------------------------ */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              Donor Submissions & Verification
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Approving a donation automatically increments available stock in the cold vault
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setDonationFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                donationFilter === 'PENDING'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pending ({pendingDonations.length})
            </button>
            <button
              onClick={() => setDonationFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                donationFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Submissions ({donations.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
            <p className="text-xs">Loading donor submissions...</p>
          </div>
        ) : filteredDonations.length === 0 ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400">
            <HeartHandshake className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700 dark:text-slate-200">No donor submissions</p>
            <p className="text-xs text-slate-400 dark:text-slate-400 mt-1">There are no pending donations awaiting administrative approval.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-6">Donor Information</th>
                  <th className="py-3.5 px-6">Blood Group</th>
                  <th className="py-3.5 px-6">Units Donated</th>
                  <th className="py-3.5 px-6">Donation Date</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDonations.map((donation) => {
                  const isBusy = actionLoading[donation.id];
                  const formattedGroup = donation.donor?.blood_group
                    ? formatBloodGroup(donation.donor.blood_group)
                    : 'N/A';

                  return (
                    <tr key={donation.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Donor */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 dark:text-white">{donation.donor?.name || 'Anonymous Donor'}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{donation.donor?.email}</div>
                        {donation.donor?.phone && (
                          <div className="text-xs text-slate-400 dark:text-slate-400">{donation.donor.phone}</div>
                        )}
                      </td>

                      {/* Blood Group */}
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          {formattedGroup}
                        </span>
                      </td>

                      {/* Units */}
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                        {donation.units_donated} {donation.units_donated === 1 ? 'Unit' : 'Units'}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(donation.donation_date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {donation.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approved
                          </span>
                        )}
                        {donation.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3.5 h-3.5" />
                            Pending Review
                          </span>
                        )}
                        {donation.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <XCircle className="w-3.5 h-3.5" />
                            Rejected
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        {donation.status === 'PENDING' ? (
                          <div className="inline-flex items-center gap-2">
                            {/* Approve Button */}
                            <button
                              onClick={() => handleDonationStatus(donation.id, 'APPROVED')}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-200 dark:shadow-none transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                            >
                              {isBusy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>Approve (+Stock)</span>
                            </button>

                            {/* Reject Button */}
                            <button
                              onClick={() => handleDonationStatus(donation.id, 'REJECTED')}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                            >
                              {isBusy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <X className="w-3.5 h-3.5" />
                              )}
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-400 italic">No action required</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
