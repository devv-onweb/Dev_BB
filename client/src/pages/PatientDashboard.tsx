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
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-200">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ---------------------------------------------------------------------- */}
        {/* 2. EMERGENCY BLOOD REQUEST FORM */}
        {/* ---------------------------------------------------------------------- */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-fit">
          <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            Request Blood Units
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Specify patient blood group, units, and destination medical facility.
          </p>

          {message && (
            <div
              className={`mb-4 p-3.5 rounded-2xl text-xs sm:text-sm ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleCreateRequest} className="space-y-4">
            {/* Blood Group */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Required Blood Group
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="A_POS">A+ (A Positive)</option>
                <option value="A_NEG">A- (A Negative)</option>
                <option value="B_POS">B+ (B Positive)</option>
                <option value="B_NEG">B- (B Negative)</option>
                <option value="AB_POS">AB+ (AB Positive)</option>
                <option value="AB_NEG">AB- (AB Negative)</option>
                <option value="O_POS">O+ (O Positive)</option>
                <option value="O_NEG">O- (O Negative)</option>
              </select>
            </div>

            {/* Units Required & Quick Chips */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Units Required (Bags)
                </label>
                <div className="flex gap-1.5">
                  {[1, 2, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setUnitsRequested(num)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition-colors ${
                        unitsRequested === num
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {num} {num === 1 ? 'Unit' : 'Units'}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                min={1}
                max={20}
                required
                value={unitsRequested}
                onChange={(e) => setUnitsRequested(Math.max(1, Number(e.target.value)))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Hospital / Clinic Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Hospital / Medical Center
              </label>
              <input
                type="text"
                required
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                placeholder="e.g. AIIMS New Delhi Trauma ICU, Apollo Hospitals OT 3, Fortis Gurugram"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Urgency Level */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Urgency Level
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUrgency('NORMAL')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                    urgency === 'NORMAL'
                      ? 'border-slate-500 bg-slate-100 text-slate-900 ring-2 ring-slate-400/20'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Standard / Routine
                </button>
                <button
                  type="button"
                  onClick={() => setUrgency('URGENT')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    urgency === 'URGENT'
                      ? 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/30 font-black'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  🚨 Urgent Trauma
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none shadow-md shadow-blue-200 transition-all disabled:opacity-70 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Blood Requisition</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* ---------------------------------------------------------------------- */}
        {/* 3. INTERACTIVE REQUEST STATUS TRACKER TABLE */}
        {/* ---------------------------------------------------------------------- */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                Live Request Status Tracker
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track verification, blood bank inventory allocation, and dispatch
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setFilterTab('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterTab === 'ALL'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({requests.length})
              </button>
              <button
                onClick={() => setFilterTab('PENDING')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterTab === 'PENDING'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setFilterTab('FULFILLED')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterTab === 'FULFILLED'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
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
            <div className="py-16 text-center text-slate-500">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-semibold text-slate-700">No requests found</p>
              <p className="text-xs text-slate-400 mt-1">
                Fill out the requisition form to request blood for your patient.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredRequests.map((req) => (
                <div key={req.id} className="p-5 hover:bg-slate-50/80 transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
                          {formatBloodGroup(req.blood_group)}
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {req.units_requested} {req.units_requested === 1 ? 'Unit Requested' : 'Units Requested'}
                        </span>
                        {req.urgency === 'URGENT' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
                            🚨 Urgent
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <span>🏥 {req.hospital_name}</span>
                        <span>•</span>
                        <span>
                          {new Date(req.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div>
                      {req.status === 'FULFILLED' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Fulfilled & Dispatched
                        </span>
                      )}
                      {req.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3.5 h-3.5" />
                          Pending Review
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
                          Rejected (Shortage)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Multi-Step Timeline Visualization */}
                  <div className="pt-2">
                    <div className="flex items-center text-xs font-medium text-slate-500">
                      {/* Step 1 */}
                      <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                          1
                        </div>
                        <span>Requested</span>
                      </div>
                      <div className={`flex-1 h-0.5 mx-2 ${req.status === 'PENDING' ? 'bg-amber-300' : req.status === 'FULFILLED' ? 'bg-emerald-400' : 'bg-slate-200'}`} />

                      {/* Step 2 */}
                      <div
                        className={`flex items-center gap-1.5 ${
                          req.status === 'PENDING'
                            ? 'text-amber-700 font-bold'
                            : req.status === 'FULFILLED'
                            ? 'text-emerald-700 font-bold'
                            : req.status === 'REJECTED'
                            ? 'text-rose-700 font-bold'
                            : 'text-slate-400'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${
                            req.status === 'PENDING'
                              ? 'bg-amber-500'
                              : req.status === 'FULFILLED'
                              ? 'bg-emerald-600'
                              : req.status === 'REJECTED'
                              ? 'bg-rose-500'
                              : 'bg-slate-300'
                          }`}
                        >
                          2
                        </div>
                        <span>{req.status === 'REJECTED' ? 'Rejected' : 'Stock Audit'}</span>
                      </div>
                      <div className={`flex-1 h-0.5 mx-2 ${req.status === 'FULFILLED' ? 'bg-emerald-400' : 'bg-slate-200'}`} />

                      {/* Step 3 */}
                      <div
                        className={`flex items-center gap-1.5 ${
                          req.status === 'FULFILLED' ? 'text-emerald-700 font-bold' : 'text-slate-400'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${
                            req.status === 'FULFILLED' ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}
                        >
                          3
                        </div>
                        <span>Dispatched</span>
                      </div>
                    </div>
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
