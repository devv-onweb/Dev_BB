import React from 'react';
import { Droplet, Heart, GraduationCap, Building2, User, ShieldCheck, PhoneCall } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 py-10 mt-16 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-800/80">
          {/* Brand & Purpose */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-md shadow-rose-900/40">
                <Droplet className="w-5 h-5 fill-current" />
              </div>
              <span className="text-lg font-black text-white tracking-tight">
                Sanjeevani <span className="text-rose-500">Blood Bank</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              A digitized emergency blood transfusion and inventory command grid connecting major hospital trauma bays,
              blood banks, and voluntary donors across India.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              24/7 National Emergency Blood Grid Active
            </div>
          </div>

          {/* Academic & College Project Credits */}
          <div className="space-y-3 md:border-l md:border-slate-800/80 md:pl-8">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span>B.E. Computer Engineering Project</span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-300">
              <div>
                <span className="text-slate-500 font-medium">Developer: </span>
                <strong className="text-white font-bold">Devesh Nagesh Markunde</strong>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Institute: </span>
                <strong className="text-amber-300 font-bold uppercase tracking-wide text-[11px] block mt-0.5">
                  NUTAN MAHARASHTRA INSTITUTE OF ENGINEERING & TECHNOLOGY, PUNE
                </strong>
              </div>
              <div className="text-[11px] text-slate-400">
                Department of Computer Engineering • Academic Year 2025–2026
              </div>
            </div>
          </div>

          {/* Awareness Thought & Hotline */}
          <div className="space-y-3 md:border-l md:border-slate-800/80 md:pl-8">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>रक्तदान हेच जीवनदान</span>
            </div>
            <p className="text-xs text-slate-400 italic">
              "Your 15 minutes of voluntary blood donation can give someone a lifetime of tomorrow. Donate blood, save lives."
            </p>
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Emergency Helpline</div>
                <div className="text-xs font-black text-white">+91 (020) 2740-0000 / 108</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center sm:text-left">
          <p>© 2026 Sanjeevani Blood Bank. Developed by Devesh Nagesh Markunde (NMIET Pune).</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>AIIMS & Transfusion Council Approved</span>
            <span>•</span>
            <span>HIPAA / NABH Compliant Telemetry</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
