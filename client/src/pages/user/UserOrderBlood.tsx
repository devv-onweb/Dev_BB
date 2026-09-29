import React, { useState, useEffect } from 'react';
import {
  Droplet,
  Building2,
  AlertTriangle,
  Clock,
  Calendar,
  Send,
  FileText,
  CheckCircle2,
  XCircle,
  Clock4,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import axiosClient from '../../api/axiosClient.js';
import { BloodOrder, formatBloodGroup } from '../../types/index.js';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const VERIFIED_HOSPITALS = [
  { id: 'hosp-aiims', name: 'AIIMS New Delhi - Emergency Trauma Bay 3' },
  { id: 'hosp-apollo', name: 'Apollo Hospitals Chennai - Surgical Care' },
  { id: 'hosp-fortis', name: 'Fortis Memorial Research Institute Gurugram - ICU' },
  { id: 'hosp-tata', name: 'Tata Memorial Hospital Mumbai - Oncology' },
  { id: 'hosp-manipal', name: 'Manipal Hospital Bengaluru - Transfusion Dept' },
  { id: 'hosp-max', name: 'Max Super Speciality Hospital Delhi' },
];

export const UserOrderBlood: React.FC = () => {
  const { user } = useAuth();

  const [orders, setOrders] = useState<BloodOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Form State (prefilled from user profile)
  const [formData, setFormData] = useState({
    bloodGroup: user?.blood_group ? formatBloodGroup(user.blood_group) : 'O+',
    units: 1,
    hospitalName: VERIFIED_HOSPITALS[0].name,
    hospitalId: VERIFIED_HOSPITALS[0].id,
    customHospital: '',
    urgency: 'STANDARD',
    reason: '',
    neededBy: '',
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await axiosClient.get<{ success: boolean; orders: BloodOrder[] }>('/user/orders');
      if (res.data?.orders) {
        setOrders(res.data.orders);
      }
    } catch {
      // offline fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleHospitalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'OTHER') {
      setFormData((prev) => ({
        ...prev,
        hospitalId: '',
        hospitalName: prev.customHospital || '',
      }));
    } else {
      const match = VERIFIED_HOSPITALS.find((h) => h.id === val);
      setFormData((prev) => ({
        ...prev,
        hospitalId: val,
        hospitalName: match?.name || val,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const finalHospital = formData.hospitalId ? formData.hospitalName : formData.customHospital;
    if (!finalHospital || !finalHospital.trim()) {
      setErrorMsg('Please select or specify a hospital name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axiosClient.post<{ success: boolean; order: BloodOrder }>('/user/orders', {
        bloodGroup: formData.bloodGroup,
        units: Number(formData.units),
        hospitalName: finalHospital.trim(),
        hospitalId: formData.hospitalId || undefined,
        urgency: formData.urgency,
        reason: formData.reason.trim() || undefined,
        neededBy: formData.neededBy || undefined,
      });

      if (res.data?.order) {
        setOrders((prev) => [res.data.order, ...prev]);
        setSuccessMsg(`Blood order for ${formData.units} unit(s) of ${formData.bloodGroup} submitted successfully! Status is Pending.`);
        // Reset form
        setFormData({
          bloodGroup: user?.blood_group ? formatBloodGroup(user.blood_group) : 'O+',
          units: 1,
          hospitalName: VERIFIED_HOSPITALS[0].name,
          hospitalId: VERIFIED_HOSPITALS[0].id,
          customHospital: '',
          urgency: 'STANDARD',
          reason: '',
          neededBy: '',
        });
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to place blood order. Please check all fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'ALL') return true;
    return o.status.toLowerCase() === filterStatus.toLowerCase();
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'Fulfilled':
        return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case 'Rejected':
        return <XCircle className="w-4 h-4 text-rose-500" />;
      default:
        return <Clock4 className="w-4 h-4 text-amber-500 animate-spin" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
      case 'Fulfilled':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30';
      case 'Rejected':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30';
      default:
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Droplet className="w-7 h-7 text-rose-600 fill-rose-600" />
            Patient Blood Order Requisition
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Submit clinical requisitions directly to verified blood banks and hospital cold-vaults.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          {successMsg}
        </div>
      )}

      {/* 2-Column Layout: Form on Left, History on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Column (5 spans) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Send className="w-5 h-5 text-rose-600" />
            <h2 className="font-bold text-base text-slate-900 dark:text-white">Place New Blood Order</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Blood Group & Units */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Blood Group *
                </label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">Prefilled from your profile</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Units Needed *
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={formData.units}
                  onChange={(e) => setFormData({ ...formData, units: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Hospital Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Receiving Hospital / Clinic *
              </label>
              <select
                value={formData.hospitalId || (formData.customHospital ? 'OTHER' : VERIFIED_HOSPITALS[0].id)}
                onChange={handleHospitalChange}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                {VERIFIED_HOSPITALS.map((hosp) => (
                  <option key={hosp.id} value={hosp.id}>
                    {hosp.name}
                  </option>
                ))}
                <option value="OTHER">Other / Custom Hospital...</option>
              </select>

              {(!formData.hospitalId || formData.customHospital) && (
                <input
                  type="text"
                  placeholder="Enter hospital name, ward, and address"
                  value={formData.customHospital}
                  onChange={(e) => setFormData({ ...formData, customHospital: e.target.value })}
                  className="mt-2 w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              )}
            </div>

            {/* Urgency & Needed By */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Urgency Level *
                </label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="STANDARD">Standard (Routine)</option>
                  <option value="URGENT">Urgent (Within 6h)</option>
                  <option value="STAT_CRITICAL">STAT Critical (Emergency)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Needed By Date
                </label>
                <input
                  type="date"
                  value={formData.neededBy}
                  onChange={(e) => setFormData({ ...formData, neededBy: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Clinical Reason / Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Clinical Reason & Notes
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Scheduled elective surgery on Friday, post-chemotherapy RBC transfusion, etc."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm shadow-md shadow-rose-600/25 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting Order...' : 'Submit Blood Order Requisition'}</span>
            </button>
          </form>
        </div>

        {/* Right Orders List Column (7 spans) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-600" />
              Order History & Queue Status ({filteredOrders.length})
            </h3>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1">
              {['ALL', 'Pending', 'Approved', 'Fulfilled', 'Rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    filterStatus.toLowerCase() === status.toLowerCase()
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Cards List */}
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Droplet className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">No orders found</h4>
              <p className="text-xs text-slate-400 mt-1">Submit a requisition using the form to track queue status.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 font-extrabold text-sm flex items-center justify-center">
                        {formatBloodGroup(order.blood_group)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {order.units} unit(s) of {formatBloodGroup(order.blood_group)}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3.5 h-3.5" />
                          {order.hospital_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${getStatusBadge(
                          order.status
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        <span>{order.status}</span>
                      </span>
                    </div>
                  </div>

                  {order.reason && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="font-semibold text-slate-500">Reason: </span>
                      {order.reason}
                    </p>
                  )}

                  {order.admin_notes && (
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300">
                      <span className="font-bold">Hospital/Admin Note: </span>
                      {order.admin_notes}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Ordered: {new Date(order.created_at).toLocaleDateString()}
                    </span>
                    <span className="font-bold text-slate-600 dark:text-slate-400">
                      Urgency: {order.urgency}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserOrderBlood;
