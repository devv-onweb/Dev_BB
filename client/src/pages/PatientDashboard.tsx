import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import axiosClient from '../api/axiosClient.js';
import { BloodRequest, BloodGroup, RequestUrgency, formatBloodGroup } from '../types/index.js';
import {
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  PlusCircle,
  Loader2,
  FileSpreadsheet,
  AlertTriangle,
  Send,
  Calendar,
  Check,
  Truck,
  HeartPulse,
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(user?.blood_group || 'O_POS');
  const [unitsRequested, setUnitsRequested] = useState(2);
  const [hospitalName, setHospitalName] = useState('');
  const [urgency, setUrgency] = useState<RequestUrgency>('NORMAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter State
  const [filterTab, setFilterTab] = useState<'ALL' | 'PENDING' | 'FULFILLED'>('ALL');

  const fetchMyRequests = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/requests');
      if (res.data.success) {
        setRequests(res.data.data.requests);
      }
    } catch (err) {
      console.error('Error fetching patient requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a valid hospital or clinic name.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await axiosClient.post('/requests', {
        blood_group: bloodGroup,
        units_requested: unitsRequested,
        hospital_name: hospitalName.trim(),
        urgency,
      });

      if (res.data.success) {
        setMessage({
          type: 'success',
          text: 'Blood request submitted successfully! Our emergency dispatch team is reviewing stock availability.',
        });
        setHospitalName('');
        setUnitsRequested(2);
        setUrgency('NORMAL');
        fetchMyRequests();
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit blood request.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const fulfilledCount = requests.filter((r) => r.status === 'FULFILLED').length;

  const filteredRequests = requests.filter((r) => {
    if (filterTab === 'PENDING') return r.status === 'PENDING';
    if (filterTab === 'FULFILLED') return r.status === 'FULFILLED';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ------------------------------------------------------------------------ */}
      {/* 1. PATIENT HERO BANNER */}
      {/* ------------------------------------------------------------------------ */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-200 dark:shadow-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-sm mb-3">
              <Building2 className="w-3.5 h-3.5" />
              Patient & Hospital Portal
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Hospital & Patient Blood Hub
            </h1>
            <p className="text-blue-100 text-sm sm:text-base mt-1 max-w-xl">
              Logged in as <span className="font-bold text-white">{user?.name}</span>. Submit requisitions for scheduled surgeries or critical emergency transfusions.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-4 bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/20">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-black">{pendingCount}</div>
              <div className="text-[10px] sm:text-xs font-bold text-blue-100 uppercase tracking-wide">
                Under Review
              </div>
            </div>
            <div className="w-px h-10 bg-white/20 self-center" />
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-black text-emerald-300">
                {fulfilledCount}
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-blue-100 uppercase tracking-wide">
                Fulfilled Units
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------------ */}
      {/* 2. REQUISITION FORM & REQUISITION STATUS CARDS */}
      {/* ------------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Requisition Creation Form */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-6 self-start transition-colors">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Request Blood Supply
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Submit requisition directly to the central blood bank reserve
            </p>
          </div>

          {message && (
            <div
              className={`p-4 rounded-2xl text-xs sm:text-sm ${
                message.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-950/70 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleCreateRequest} className="space-y-4">
            {/* Blood Group */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Required Blood Group
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="A_POS">A Positive (A+)</option>
                <option value="A_NEG">A Negative (A-)</option>
                <option value="B_POS">B Positive (B+)</option>
                <option value="B_NEG">B Negative (B-)</option>
                <option value="AB_POS">AB Positive (AB+)</option>
                <option value="AB_NEG">AB Negative (AB-)</option>
                <option value="O_POS">O Positive (O+)</option>
                <option value="O_NEG">O Negative (O-)</option>
              </select>
            </div>

            {/* Units Requested */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Units Required
              </label>
              <input
                type="number"
                required
                min={1}
                max={10}
                value={unitsRequested}
                onChange={(e) => setUnitsRequested(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Hospital Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Hospital / Clinic & Ward
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AIIMS Trauma Bay 3, Apollo OT 4"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Urgency Level */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Clinical Urgency
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUrgency('NORMAL')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    urgency === 'NORMAL'
                      ? 'bg-slate-900 dark:bg-slate-700 text-white border-slate-900 dark:border-slate-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                >
                  Standard Elective
                </button>
                <button
                  type="button"
                  onClick={() => setUrgency('URGENT')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    urgency === 'URGENT'
                      ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-200 dark:shadow-none'
                      : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/60'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>STAT Critical</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-200 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Requisition...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Blood Request</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* ---------------------------------------------------------------------- */}
        {/* 3. REQUISITION HISTORY TABLE & LIVE DISPATCH TRACKER */}
        {/* ---------------------------------------------------------------------- */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Live Request Tracker
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time review, stock allocation, and dispatch progress
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <button
                onClick={() => setFilterTab('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filterTab === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({requests.length})
              </button>
              <button
                onClick={() => setFilterTab('PENDING')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filterTab === 'PENDING'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Under Review ({pendingCount})
              </button>
              <button
                onClick={() => setFilterTab('FULFILLED')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filterTab === 'FULFILLED'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Fulfilled ({fulfilledCount})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-xs">Loading blood requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400">
              <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-base font-semibold text-slate-700 dark:text-slate-200">No requests found</p>
              <p className="text-xs text-slate-400 dark:text-slate-400 mt-1">
                Submit a new blood requisition using the form on the left!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900 shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{req.hospital_name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          {formatBloodGroup(req.blood_group)}
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          ({req.units_requested} {req.units_requested === 1 ? 'Unit' : 'Units'})
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {new Date(req.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span>•</span>
                        {req.urgency === 'URGENT' ? (
                          <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" /> STAT Critical
                          </span>
                        ) : (
                          <span>Elective / Normal</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    {req.status === 'FULFILLED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <Truck className="w-3.5 h-3.5" />
                        Fulfilled & Dispatched
                      </span>
                    )}
                    {req.status === 'PENDING' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <Clock className="w-3.5 h-3.5" />
                        Pending Review
                      </span>
                    )}
                    {req.status === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        <Check className="w-3.5 h-3.5" />
                        Approved (Pre-dispatch)
                      </span>
                    )}
                    {req.status === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        <XCircle className="w-3.5 h-3.5" />
                        Rejected / Shortage
                      </span>
                    )}
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

export default PatientDashboard;
