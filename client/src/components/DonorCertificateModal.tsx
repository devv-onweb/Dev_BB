import React, { useRef } from 'react';
import { Donation, formatBloodGroup, User } from '../types';
import {
  Award,
  X,
  Printer,
  Download,
  Heart,
  Droplet,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface DonorCertificateModalProps {
  donation: Donation | null;
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DonorCertificateModal: React.FC<DonorCertificateModalProps> = ({
  donation,
  user,
  isOpen,
  onClose,
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !donation) return null;

  const donorName = donation.donor?.name || user?.name || 'Valued Donor';
  const bloodGroupStr = donation.donor?.blood_group
    ? formatBloodGroup(donation.donor.blood_group)
    : user?.blood_group
    ? formatBloodGroup(user.blood_group)
    : 'O+';

  const donationDateFormatted = new Date(donation.donation_date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const certNumber = `CERT-NMIET-${donation.id.slice(0, 8).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white">
      {/* Modal Container */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 relative print:border-none print:shadow-none print:max-w-none print:rounded-none">
        {/* Top Control Bar (Hidden when Printing) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">Official Blood Donor Certificate of Recognition</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-md shadow-rose-900/40 transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* PRINTABLE / VIEWABLE COLORFUL CERTIFICATE */}
        {/* ==================================================================== */}
        <div
          ref={certificateRef}
          className="p-8 sm:p-12 bg-gradient-to-br from-amber-50/50 via-white to-rose-50/40 relative overflow-hidden text-slate-800 select-none print:p-8 print:m-0"
          style={{ minHeight: '600px' }}
        >
          {/* Ornate Certificate Border Frame */}
          <div className="absolute inset-4 sm:inset-6 border-4 border-amber-600/60 rounded-2xl pointer-events-none" />
          <div className="absolute inset-6 sm:inset-8 border border-amber-400/50 rounded-xl pointer-events-none" />
          <div className="absolute inset-7 sm:inset-9 border border-rose-200/50 rounded-lg pointer-events-none" />

          {/* Corner Floral Accents */}
          <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-rose-600 rounded-tl-xl pointer-events-none" />
          <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-rose-600 rounded-tr-xl pointer-events-none" />
          <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-rose-600 rounded-bl-xl pointer-events-none" />
          <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-rose-600 rounded-br-xl pointer-events-none" />

          {/* Watermark Logo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <Droplet className="w-96 h-96 fill-rose-600 text-rose-600" />
          </div>

          <div className="relative z-10 text-center space-y-6 max-w-2xl mx-auto py-4">
            {/* Header / College & Blood Bank Banner */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-black uppercase tracking-widest border border-rose-200">
                <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                Sanjeevani Blood Transfusion & Critical Care Grid
              </div>

              <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mt-1.5">
                In Collaboration with
              </div>
              <div className="text-xs sm:text-sm font-black text-blue-900 uppercase tracking-wide">
                NUTAN MAHARASHTRA INSTITUTE OF ENGINEERING & TECHNOLOGY, PUNE
              </div>
              <div className="text-[10px] text-slate-500 font-semibold">
                Department of Computer Engineering • Final Year Capstone Project
              </div>
            </div>

            {/* Certificate Title */}
            <div className="pt-2">
              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight font-serif uppercase">
                Certificate of Appreciation
              </h1>
              <div className="w-28 h-1 bg-gradient-to-r from-amber-500 via-rose-600 to-amber-500 mx-auto rounded-full mt-2" />
              <p className="text-xs sm:text-sm text-slate-600 font-medium italic mt-2">
                This honor is proudly conferred in recognition of heroic voluntary blood donation
              </p>
            </div>

            {/* Recipient Name */}
            <div className="py-2">
              <div className="text-xs uppercase font-bold text-slate-400 tracking-widest">
                Presented to
              </div>
              <div className="text-2xl sm:text-4xl font-black text-rose-700 font-serif tracking-tight mt-1 border-b-2 border-dashed border-rose-300 inline-block px-8 pb-1">
                {donorName}
              </div>
            </div>

            {/* Citation Statement */}
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium max-w-xl mx-auto px-4">
              For your invaluable and noble contribution of{' '}
              <strong className="text-slate-900 font-extrabold">
                {donation.units_donated} Unit ({bloodGroupStr})
              </strong>{' '}
              Whole Blood to the central life-reserve vault. Your selfless gesture empowers critical emergency
              trauma care and directly helps save up to{' '}
              <strong className="text-rose-700 font-extrabold">{donation.units_donated * 3} precious lives</strong>.
            </p>

            {/* Details Ribbon */}
            <div className="grid grid-cols-3 gap-3 bg-gradient-to-r from-amber-100/60 via-rose-100/50 to-amber-100/60 p-3 rounded-2xl border border-amber-200/80 max-w-lg mx-auto text-center shadow-sm">
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Blood Group</div>
                <div className="text-base sm:text-lg font-black text-rose-700">{bloodGroupStr}</div>
              </div>
              <div className="border-x border-amber-300/60">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Units Donated</div>
                <div className="text-base sm:text-lg font-black text-slate-900">{donation.units_donated} Unit</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Donation Date</div>
                <div className="text-xs sm:text-sm font-bold text-slate-800 mt-1">{donationDateFormatted}</div>
              </div>
            </div>

            {/* Official Seal & Signatures */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-6 px-4">
              {/* Left Signatory */}
              <div className="text-center sm:text-left">
                <div className="font-serif italic font-bold text-slate-800 text-sm border-b border-slate-400 pb-1 px-4 sm:px-0">
                  Dr. Rajesh Sharma
                </div>
                <div className="text-[10px] font-bold text-slate-600 mt-0.5">Medical Director</div>
                <div className="text-[9px] text-slate-400 font-semibold">Sanjeevani Blood Bank Network</div>
              </div>

              {/* Center Golden Seal */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-1 shadow-lg shadow-amber-500/30 flex items-center justify-center shrink-0 border-2 border-amber-200">
                <div className="w-full h-full rounded-full border border-dashed border-amber-100 flex flex-col items-center justify-center text-center text-amber-950 p-1">
                  <Award className="w-5 h-5 text-amber-900" />
                  <span className="text-[7px] font-black uppercase tracking-tighter leading-tight mt-0.5">
                    HONORARY DONOR
                  </span>
                  <span className="text-[6px] font-bold text-amber-900">VERIFIED</span>
                </div>
              </div>

              {/* Right Signatory (Developer & Project Lead) */}
              <div className="text-center sm:text-right">
                <div className="font-serif italic font-bold text-slate-800 text-sm border-b border-slate-400 pb-1 px-4 sm:px-0">
                  Devesh Nagesh Markunde
                </div>
                <div className="text-[10px] font-bold text-slate-600 mt-0.5">Project Lead & Developer</div>
                <div className="text-[9px] text-slate-400 font-semibold">NMIET Pune (B.E. Computer Engineering)</div>
              </div>
            </div>

            {/* Certificate ID */}
            <div className="pt-2 text-[10px] text-slate-400 font-mono">
              Certificate ID: <span className="font-bold text-slate-600">{certNumber}</span> • Verification Code: <span className="font-bold text-slate-600">NMIET-BE-2026-PUNE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
