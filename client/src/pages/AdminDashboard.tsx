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

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  // Data States
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);

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

      if (invRes.data.success) {
        setInventory(invRes.data.data.inventory);
      }
      if (donRes.data.success) {
        setDonations(donRes.data.data.donations);
      }
      if (reqRes.data.success) {
        setRequests(reqRes.data.data.requests);
      }
    } catch (err: any) {
      if (!isBackground) {
        showToast('error', 'Data Load Error', err.response?.data?.message || 'Failed to fetch dashboard data.');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Auto-refresh live data every 3.5 seconds
    const interval = setInterval(() => {
      fetchData(true);
    }, 3500);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Handle Donation Approval or Rejection
  const handleDonationStatus = async (donationId: string, status: 'APPROVED' | 'REJECTED') => {
    setActionLoading((prev) => ({ ...prev, [donationId]: true }));
    try {
      const res = await axiosClient.put(`/donations/${donationId}/status`, { status });
      if (res.data.success) {
        showToast(
          status === 'APPROVED' ? 'success' : 'warning',
          status === 'APPROVED' ? 'Donation Approved' : 'Donation Rejected',
          res.data.message
        );
        // Refresh full data to synchronize inventory
        await fetchData();
      }
    } catch (err: any) {
      showToast(
        'error',
        'Action Failed',
        err.response?.data?.message || 'Failed to update donation status.'
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [donationId]: false }));
    }
  };

  // Handle Blood Request Fulfillment
  const handleFulfillRequest = async (requestId: string) => {
    setActionLoading((prev) => ({ ...prev, [requestId]: true }));
    try {
      const res = await axiosClient.put(`/requests/${requestId}/fulfill`);
      if (res.data.success) {
        showToast('success', 'Request Fulfilled', res.data.message);
        await fetchData();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to fulfill blood request.';
      showToast('error', 'Shortage / Fulfillment Error', msg);
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  // Handle Blood Request Rejection
  const handleRejectRequest = async (requestId: string) => {
    setActionLoading((prev) => ({ ...prev, [requestId]: true }));
    try {
      const res = await axiosClient.put(`/requests/${requestId}/reject`);
      if (res.data.success) {
        showToast('warning', 'Request Rejected', 'Blood request has been marked as REJECTED.');
        await fetchData();
      }
    } catch (err: any) {
      showToast('error', 'Action Failed', err.response?.data?.message || 'Failed to reject blood request.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }));
    }
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
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : notification.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-start gap-3">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="text-sm font-bold">{notification.title}</h4>
              <p className="text-xs mt-0.5 opacity-90">{notification.message}</p>
            </div>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-500 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-rose-100 text-rose-700 rounded-xl shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Admin Command Center
                </h1>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Auto-Sync
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Centralized Blood Bank Management, Inventory Auditing & Request Dispatch
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh Live Data'}</span>
          </button>
        </div>
      </div>

      {/* Top KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Stock</span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Droplets className="w-5 h-5" />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{totalUnits}</div>
          <div className="text-xs text-slate-500 mt-1">Units available in blood bank</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Donations</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <HeartHandshake className="w-5 h-5" />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{pendingDonations.length}</div>
          <div className="text-xs text-slate-500 mt-1">Awaiting admin review</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Requests</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Building2 className="w-5 h-5" />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{pendingRequests.length}</div>
          <div className="text-xs text-slate-500 mt-1">Hospital & patient requisitions</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Urgent Alerts</span>
            <span className="p-2 rounded-xl bg-red-50 text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </span>
          </div>
          <div className="text-3xl font-black text-red-600 mt-2">{urgentPendingRequests.length}</div>
          <div className="text-xs text-slate-500 mt-1">Emergency trauma requirements</div>
        </div>
      </div>

      {/* ------------------------------------------------------------------------ */}
      {/* 1. VISUAL INVENTORY GRID (8 Blood Groups) */}
      {/* ------------------------------------------------------------------------ */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-rose-600" />
              Blood Inventory Stock by Group
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Visual stock monitor across all 8 standard blood types. Red indicates critical shortage (&lt; 5 units).
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-red-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> &lt; 5 Critical
            </span>
            <span className="flex items-center gap-1.5 text-amber-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> 5-15 Low
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
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
                      ? 'bg-red-50/80 border-red-200 shadow-sm shadow-red-100'
                      : isLow
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-emerald-50/60 border-emerald-200'
                  }`}
                >
                  {isCritical && (
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}

                  <div>
                    <div className="text-lg font-black text-slate-900 tracking-tight">{formattedGroup}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">Whole Blood</div>
                  </div>

                  <div className="my-3">
                    <div
                      className={`text-2xl sm:text-3xl font-black ${
                        isCritical
                          ? 'text-red-700'
                          : isLow
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {item.units_available}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500">Units</div>
                  </div>

                  <div className="pt-2 border-t border-black/5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                        isCritical
                          ? 'bg-red-200/80 text-red-900'
                          : isLow
                          ? 'bg-amber-200/80 text-amber-900'
                          : 'bg-emerald-200/80 text-emerald-900'
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
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Patient & Hospital Blood Requests
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and fulfill requisitions with real-time stock sufficiency checks
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setRequestFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                requestFilter === 'PENDING'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({pendingRequests.length})
            </button>
            <button
              onClick={() => setRequestFilter('URGENT')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                requestFilter === 'URGENT'
                  ? 'bg-red-600 text-white shadow-sm font-bold'
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              🚨 Urgent ({urgentPendingRequests.length})
            </button>
            <button
              onClick={() => setRequestFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                requestFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
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
          <div className="py-16 text-center text-slate-500">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No requests in this view</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {requestFilter === 'PENDING'
                ? 'All pending blood requisitions have been processed. Switch to "All History" to view fulfilled requests.'
                : 'There are no blood requests matching the selected filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => {
                  const isBusy = actionLoading[req.id];
                  // Look up current stock in inventory
                  const inStock = inventory.find((i) => i.blood_group === req.blood_group)?.units_available ?? 0;
                  const hasSufficientStock = inStock >= req.units_requested;

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Requester */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">{req.requester?.name || 'Unknown Patient'}</div>
                        <div className="text-xs text-slate-500">{req.requester?.email}</div>
                        {req.requester?.phone && (
                          <div className="text-xs text-slate-400">{req.requester.phone}</div>
                        )}
                      </td>

                      {/* Hospital */}
                      <td className="py-4 px-6 font-medium text-slate-800">
                        {req.hospital_name}
                      </td>

                      {/* Blood Group & Units */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                            {formatBloodGroup(req.blood_group)}
                          </span>
                          <span className="font-bold text-slate-900">
                            {req.units_requested} {req.units_requested === 1 ? 'Unit' : 'Units'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          In stock: <span className={hasSufficientStock ? 'text-emerald-600 font-semibold' : 'text-red-600 font-bold'}>{inStock} units</span>
                        </div>
                      </td>

                      {/* Urgency */}
                      <td className="py-4 px-6">
                        {req.urgency === 'URGENT' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Urgent
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            Normal
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
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
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Fulfilled
                          </span>
                        )}
                        {req.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3.5 h-3.5" />
                            Pending
                          </span>
                        )}
                        {req.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approved
                          </span>
                        )}
                        {req.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
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
                              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50 ${
                                hasSufficientStock
                                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                                  : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
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
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all disabled:opacity-50"
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
                          <span className="text-xs text-slate-400 italic">No action required</span>
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
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-rose-600" />
              Donor Submissions & Verification
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Approving a donation automatically increments available stock in the cold vault
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setDonationFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                donationFilter === 'PENDING'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({pendingDonations.length})
            </button>
            <button
              onClick={() => setDonationFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                donationFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
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
          <div className="py-16 text-center text-slate-500">
            <HeartHandshake className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No donor submissions</p>
            <p className="text-xs text-slate-400 mt-1">There are no pending donations awaiting administrative approval.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Donor Information</th>
                  <th className="py-3.5 px-6">Blood Group</th>
                  <th className="py-3.5 px-6">Units Donated</th>
                  <th className="py-3.5 px-6">Donation Date</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDonations.map((donation) => {
                  const isBusy = actionLoading[donation.id];
                  const formattedGroup = donation.donor?.blood_group
                    ? formatBloodGroup(donation.donor.blood_group)
                    : 'N/A';

                  return (
                    <tr key={donation.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Donor */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">{donation.donor?.name || 'Anonymous Donor'}</div>
                        <div className="text-xs text-slate-500">{donation.donor?.email}</div>
                        {donation.donor?.phone && (
                          <div className="text-xs text-slate-400">{donation.donor.phone}</div>
                        )}
                      </td>

                      {/* Blood Group */}
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                          {formattedGroup}
                        </span>
                      </td>

                      {/* Units */}
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {donation.units_donated} {donation.units_donated === 1 ? 'Unit' : 'Units'}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(donation.donation_date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {donation.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approved
                          </span>
                        )}
                        {donation.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3.5 h-3.5" />
                            Pending Review
                          </span>
                        )}
                        {donation.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
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
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition-all disabled:opacity-50"
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
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all disabled:opacity-50"
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
                          <span className="text-xs text-slate-400 italic">No action required</span>
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
