import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.js';
import axiosClient from '../api/axiosClient.js';
import { Donation, formatBloodGroup } from '../types/index.js';
import {
  HeartHandshake,
  Droplet,
  CheckCircle2,
  Clock,
  XCircle,
  PlusCircle,
  Loader2,
  Calendar,
  ShieldAlert,
  Award,
  Sparkles,
  Info,
  CalendarDays,
} from 'lucide-react';

const REQUIRED_INTERVAL_DAYS = 56; // Standard 8 weeks between donations

export const DonorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [unitsDonated, setUnitsDonated] = useState(1);
  const [donationDate, setDonationDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [checklistAccepted, setChecklistAccepted] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'APPROVED' | 'PENDING'>('ALL');

  const fetchMyDonations = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/donations/my-donations');
      if (res.data.success) {
        setDonations(res.data.data.donations);
      }
    } catch (err) {
      console.error('Error fetching donor donations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyDonations();
  }, []);

  // ----------------------------------------------------------------------------
  // 56-DAY ELIGIBILITY CALCULATION ENGINE
  // ----------------------------------------------------------------------------
  const eligibility = useMemo(() => {
    if (donations.length === 0) {
      return {
        isEligible: true,
        daysRemaining: 0,
        daysElapsed: 0,
        lastDonationDate: null,
        nextEligibleDate: new Date(),
        cooldownPercent: 100,
      };
    }

    // Find the most recent approved or pending donation
    const sortedDonations = [...donations].sort(
      (a, b) => new Date(b.donation_date).getTime() - new Date(a.donation_date).getTime()
    );

    const latestDonation = sortedDonations[0];
    const lastDate = new Date(latestDonation.donation_date);
    const now = new Date();

    const diffMs = now.getTime() - lastDate.getTime();
    const daysElapsed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, REQUIRED_INTERVAL_DAYS - daysElapsed);
    const isEligible = daysElapsed >= REQUIRED_INTERVAL_DAYS;

    const nextEligible = new Date(lastDate);
    nextEligible.setDate(nextEligible.getDate() + REQUIRED_INTERVAL_DAYS);

    const cooldownPercent = Math.min(100, Math.round((daysElapsed / REQUIRED_INTERVAL_DAYS) * 100));

    return {
      isEligible,
      daysRemaining,
      daysElapsed,
      lastDonationDate: lastDate,
      nextEligibleDate: nextEligible,
      cooldownPercent,
    };
  }, [donations]);

  // Handle Form Submission
  const handleLogDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checklistAccepted) {
      setMessage({
        type: 'error',
        text: 'Please confirm that you meet the health and eligibility requirements before submitting.',
      });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await axiosClient.post('/donations', {
        units_donated: unitsDonated,
        donation_date: donationDate ? new Date(donationDate).toISOString() : new Date().toISOString(),
      });

      if (res.data.success) {
        setMessage({
          type: 'success',
          text: 'Thank you! Your donation log has been recorded and is pending administrative verification.',
        });
        fetchMyDonations();
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit donation log.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics
  const approvedDonations = donations.filter((d) => d.status === 'APPROVED');
  const totalApprovedUnits = approvedDonations.reduce((acc, curr) => acc + curr.units_donated, 0);
  const estimatedLivesSaved = totalApprovedUnits * 3;

  // Donor Tier
  const getDonorTier = (units: number) => {
    if (units >= 10) return { title: 'Life Champion (Gold Tier)', color: 'bg-amber-100 text-amber-900 border-amber-300' };
    if (units >= 5) return { title: 'Dedicated Hero (Silver Tier)', color: 'bg-slate-200 text-slate-900 border-slate-300' };
    if (units >= 1) return { title: 'Life Saver (Bronze Tier)', color: 'bg-rose-100 text-rose-900 border-rose-200' };
    return { title: 'First-Time Donor', color: 'bg-blue-100 text-blue-900 border-blue-200' };
  };

  const currentTier = getDonorTier(totalApprovedUnits);

  // Filtered donation history
  const filteredDonations = donations.filter((d) => {
    if (filterStatus === 'APPROVED') return d.status === 'APPROVED';
    if (filterStatus === 'PENDING') return d.status === 'PENDING';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ------------------------------------------------------------------------ */}
      {/* 1. DONOR IDENTITY & IMPACT HERO BANNER */}
      {/* ------------------------------------------------------------------------ */}
      <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-rose-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-sm mb-3">
              <Droplet className="w-3.5 h-3.5 fill-current" />
              Verified Blood Donor
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Welcome Back, {user?.name}!
            </h1>
            <p className="text-rose-100 text-sm sm:text-base mt-1 max-w-xl">
              Registered Blood Group:{' '}
              <span className="font-black text-white px-2 py-0.5 bg-black/20 rounded-md">
                {formatBloodGroup(user?.blood_group)}
              </span>
              . Every donation helps emergency trauma, surgical, and oncology patients.
            </p>

            {/* Recognition Badge */}
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-bold backdrop-blur-sm">
              <Award className="w-4 h-4 text-amber-300" />
              <span>{currentTier.title}</span>
            </div>
          </div>

          {/* KPI Badges */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/20">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-black">{totalApprovedUnits}</div>
              <div className="text-[10px] sm:text-xs font-bold text-rose-100 uppercase tracking-wide">
                Units Donated
              </div>
            </div>
            <div className="w-px h-10 bg-white/20 self-center" />
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-black text-emerald-300">
                {estimatedLivesSaved}
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-rose-100 uppercase tracking-wide">
                Lives Impacted
              </div>
            </div>
            <div className="w-px h-10 bg-white/20 self-center" />
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-black">{approvedDonations.length}</div>
              <div className="text-[10px] sm:text-xs font-bold text-rose-100 uppercase tracking-wide">
                Sessions
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------------ */}
      {/* 2. 56-DAY DONATION ELIGIBILITY STATUS WIDGET */}
      {/* ------------------------------------------------------------------------ */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-2xl ${
                eligibility.isEligible
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {eligibility.isEligible ? (
                <CheckCircle2 className="w-7 h-7" />
              ) : (
                <Clock className="w-7 h-7" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Donation Eligibility Status
                </h2>
                {eligibility.isEligible ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    🟢 Eligible to Donate Today
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                    ⏳ 56-Day Cooldown Active
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {eligibility.isEligible ? (
                  <span>
                    You have satisfied the standard <strong>56-day (8-week)</strong> whole blood recovery period. You are medically cleared to donate today!
                  </span>
                ) : (
                  <span>
                    Your body is replenishing red blood cells. You will be eligible to donate again in{' '}
                    <strong className="text-amber-700 font-bold">{eligibility.daysRemaining} days</strong> on{' '}
                    <strong>
                      {eligibility.nextEligibleDate.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </strong>.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Cooldown Progress Percentage */}
          {!eligibility.isEligible && (
            <div className="w-full sm:w-64 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-right">
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                <span>Recovery Progress:</span>
                <span className="text-amber-600">{eligibility.cooldownPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${eligibility.cooldownPercent}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {eligibility.daysElapsed} of {REQUIRED_INTERVAL_DAYS} days elapsed
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ---------------------------------------------------------------------- */}
        {/* 3. LOG NEW BLOOD DONATION FORM */}
        {/* ---------------------------------------------------------------------- */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-fit">
          <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-rose-600" />
            Log a Blood Donation
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Record your recent donation session for hospital stock verification.
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

          {!eligibility.isEligible && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Note:</strong> Your 56-day cooldown is active. Only submit if you are logging a past unrecorded session.
              </span>
            </div>
          )}

          <form onSubmit={handleLogDonation} className="space-y-4">
            {/* Units Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Units Donated
              </label>
              <select
                value={unitsDonated}
                onChange={(e) => setUnitsDonated(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                <option value={1}>1 Unit (Whole Blood - 450 ml)</option>
                <option value={2}>2 Units (Power Red - Double Red Cells)</option>
              </select>
            </div>

            {/* Donation Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Donation Date
              </label>
              <div className="relative rounded-xl shadow-sm">
                <input
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  value={donationDate}
                  onChange={(e) => setDonationDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-600">
              <span className="font-bold text-slate-800 block">🩺 Donor Health Affirmation:</span>
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checklistAccepted}
                  onChange={(e) => setChecklistAccepted(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                />
                <span>I confirm that I am in good health, weigh $\ge 50$ kg, and have completed donation at an authorized blood bank center.</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 focus:outline-none shadow-md shadow-rose-200 transition-all disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <HeartHandshake className="w-4 h-4" />
                  <span>Submit Donation Record</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* ---------------------------------------------------------------------- */}
        {/* 4. DONATION HISTORY LOG TABLE */}
        {/* ---------------------------------------------------------------------- */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-rose-600" />
                My Donation History
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete record of your voluntary blood contributions
              </p>
            </div>

            {/* Filter */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterStatus === 'ALL'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({donations.length})
              </button>
              <button
                onClick={() => setFilterStatus('APPROVED')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterStatus === 'APPROVED'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Approved ({approvedDonations.length})
              </button>
              <button
                onClick={() => setFilterStatus('PENDING')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterStatus === 'PENDING'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending ({donations.filter((d) => d.status === 'PENDING').length})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
              <p className="text-xs">Loading donation history...</p>
            </div>
          ) : filteredDonations.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Droplet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-semibold text-slate-700">No donations found</p>
              <p className="text-xs text-slate-400 mt-1">
                Log your first blood donation using the form on the left!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredDonations.map((item) => (
                <div
                  key={item.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
                      <Droplet className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>
                          {item.units_donated} {item.units_donated === 1 ? 'Unit' : 'Units'} (Whole Blood)
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {formatBloodGroup(user?.blood_group)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {new Date(item.donation_date).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {item.status === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approved & Added to Stock
                      </span>
                    )}
                    {item.status === 'PENDING' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock className="w-3.5 h-3.5" />
                        Pending Verification
                      </span>
                    )}
                    {item.status === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" />
                        Rejected / Ineligible
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

export default DonorDashboard;
