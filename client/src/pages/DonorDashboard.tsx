import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.js';
import axiosClient from '../api/axiosClient.js';
import { Donation, formatBloodGroup } from '../types/index.js';
import { DonorCertificateModal } from '../components/DonorCertificateModal.js';
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
  Printer,
  FileCheck,
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

  // Certificate Modal State
  const [selectedCertDonation, setSelectedCertDonation] = useState<Donation | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

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

  const filteredDonations = donations.filter((d) => {
    if (filterStatus === 'APPROVED') return d.status === 'APPROVED';
    if (filterStatus === 'PENDING') return d.status === 'PENDING';
    return true;
  });

  const openCertificate = (donationItem: Donation) => {
    setSelectedCertDonation(donationItem);
    setIsCertModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ------------------------------------------------------------------------ */}
      {/* 1. HERO RECOGNITION BANNER */}
      {/* ------------------------------------------------------------------------ */}
      <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-rose-200 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-sm mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Sanjeevani Blood Hero Portal
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Namaste, {user?.name}!
            </h1>
            <p className="text-rose-100 text-sm sm:text-base mt-1 max-w-xl">
              Blood Group:{' '}
              <strong className="text-white font-extrabold text-base underline decoration-amber-400 decoration-2">
                {formatBloodGroup(user?.blood_group)}
              </strong>
              . Thank you for your selfless contribution to saving lives across India.
            </p>
          </div>

          {/* Quick Metrics & Certificate Action */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-6 bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/20">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-black">{approvedDonations.length}</div>
                <div className="text-[10px] sm:text-xs font-bold text-rose-100 uppercase tracking-wide">
                  Donations
                </div>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-amber-300">
                  {estimatedLivesSaved}
                </div>
                <div className="text-[10px] sm:text-xs font-bold text-rose-100 uppercase tracking-wide">
                  Lives Impacted
                </div>
              </div>
            </div>

            {/* Instant Certificate Button if donor has approved donations */}
            {approvedDonations.length > 0 && (
              <button
                onClick={() => openCertificate(approvedDonations[0])}
                className="px-5 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-900/30 transition-all flex items-center gap-2 active:scale-95 cursor-pointer border border-amber-200"
              >
                <Award className="w-5 h-5 text-amber-900" />
                <span>Download Honor Certificate</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------------ */}
      {/* 2. 56-DAY ELIGIBILITY TRACKER & COUNTDOWN */}
      {/* ------------------------------------------------------------------------ */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-rose-600" />
              56-Day Donation Eligibility Engine
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Medical safety window requiring 8 weeks between voluntary whole blood donations
            </p>
          </div>

          <div>
            {eligibility.isEligible ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Eligible to Donate Today
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <Clock className="w-4 h-4 text-amber-600" />
                Cooldown Active ({eligibility.daysRemaining} days left)
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar & Countdown Stats */}
        <div className="space-y-3">
          <div className="flex justify-between text-xs font-semibold text-slate-600">
            <span>
              {eligibility.isEligible
                ? 'Ready for your next donation'
                : `Recovery Cooldown: ${eligibility.daysElapsed} of ${REQUIRED_INTERVAL_DAYS} days completed`}
            </span>
            <span className="font-bold text-slate-900">{eligibility.cooldownPercent}%</span>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                eligibility.isEligible
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : 'bg-gradient-to-r from-amber-500 to-rose-500'
              }`}
              style={{ width: `${eligibility.cooldownPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Last Donation Date
              </div>
              <div className="text-sm font-bold text-slate-800 mt-1">
                {eligibility.lastDonationDate
                  ? eligibility.lastDonationDate.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'No prior record'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Next Eligible Date
              </div>
              <div className="text-sm font-bold text-emerald-700 mt-1">
                {eligibility.nextEligibleDate.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Waiting Period
              </div>
              <div className="text-sm font-bold text-rose-600 mt-1">
                {eligibility.isEligible ? '0 Days (Eligible)' : `${eligibility.daysRemaining} Days`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------------ */}
      {/* 3. LOG NEW DONATION FORM & DONATION HISTORY GRID */}
      {/* ------------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Donation Logging Form */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-6 self-start">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-rose-600" />
              Log Blood Donation
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Record voluntary donation at hospital camp or cold vault center
            </p>
          </div>

          {message && (
            <div
              className={`p-4 rounded-2xl text-xs sm:text-sm ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleLogDonation} className="space-y-4">
            {/* Units Donated */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Units Donated (Standard 350ml / 450ml)
              </label>
              <select
                value={unitsDonated}
                onChange={(e) => setUnitsDonated(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                <option value={1}>1 Unit (Standard Whole Blood)</option>
                <option value={2}>2 Units (Double Red Blood Cells)</option>
              </select>
            </div>

            {/* Donation Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Date of Donation
              </label>
              <input
                type="date"
                required
                max={new Date().toISOString().split('T')[0]}
                value={donationDate}
                onChange={(e) => setDonationDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {/* Medical Screening Confirmation Checklist */}
            <div className="p-3.5 bg-rose-50/50 rounded-2xl border border-rose-100 space-y-2">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="checklist"
                  checked={checklistAccepted}
                  onChange={(e) => setChecklistAccepted(e.target.checked)}
                  className="mt-1 rounded text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="checklist" className="text-xs text-slate-600 leading-relaxed">
                  I confirm that I meet standard medical screening criteria (Hb &gt; 12.5g/dL, weight &gt; 45kg,
                  no recent tattoos/surgeries in 6 months).
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer active:scale-95"
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
        {/* 4. DONATION HISTORY LOG TABLE & CERTIFICATE GENERATION */}
        {/* ---------------------------------------------------------------------- */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-rose-600" />
                My Donation History & Certificates
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete record of your voluntary blood contributions & official honors
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
                    <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
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

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {item.status === 'APPROVED' && (
                      <>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approved
                        </span>

                        {/* View Certificate Button */}
                        <button
                          onClick={() => openCertificate(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 shadow-sm border border-amber-300 transition-all active:scale-95 cursor-pointer"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Certificate (PDF)</span>
                        </button>
                      </>
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
                        Rejected
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Official Blood Donor Certificate Modal */}
      <DonorCertificateModal
        donation={selectedCertDonation}
        user={user}
        isOpen={isCertModalOpen}
        onClose={() => {
          setIsCertModalOpen(false);
          setSelectedCertDonation(null);
        }}
      />
    </div>
  );
};

export default DonorDashboard;
