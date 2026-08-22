import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import {
  Droplet,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Loader2,
  Heart,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Award,
  Activity,
  CheckCircle2,
  Users,
} from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const loggedUser = await login(email, password);

      const from = (location.state as any)?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
        return;
      }

      switch (loggedUser.role) {
        case 'ADMIN':
          navigate('/admin-dashboard', { replace: true });
          break;
        case 'DONOR':
          navigate('/donor-dashboard', { replace: true });
          break;
        case 'PATIENT':
          navigate('/patient-dashboard', { replace: true });
          break;
        default:
          navigate('/login', { replace: true });
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Authentication failed. Please verify your credentials.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-100">
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* ==================================================================== */}
        {/* LEFT COLUMN: AWARENESS, THOUGHTS & STUDENT PROJECT INFORMATION */}
        {/* ==================================================================== */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main College / Project Accreditation Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-blue-800/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-40 bg-rose-600/10 blur-3xl pointer-events-none rounded-full" />
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-400/30 shrink-0">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="text-[11px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> B.E. Computer Engineering Capstone Project
                </div>
                <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wide">
                  NUTAN MAHARASHTRA INSTITUTE OF ENGINEERING & TECHNOLOGY, PUNE
                </h2>
                <div className="text-xs text-slate-300 font-medium">
                  Developed by:{' '}
                  <span className="text-white font-black text-sm underline decoration-rose-500 decoration-2">
                    Devesh Nagesh Markunde
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Inspirational Indian Quote & Awareness Banner */}
          <div className="bg-gradient-to-br from-rose-600 via-red-600 to-rose-700 rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-rose-200 relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-black uppercase tracking-wider backdrop-blur-sm">
                <Heart className="w-3.5 h-3.5 fill-current text-white" />
                रक्तदान हेच जीवनदान
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
                “A single drop of blood can create an ocean of hope.”
              </h1>
              <p className="text-rose-100 text-xs sm:text-sm leading-relaxed max-w-xl">
                Every two seconds, someone in India needs blood. Your 15-minute donation can give a trauma victim,
                a cancer fighter, or a newborn baby a lifetime of tomorrows.
              </p>
            </div>
          </div>

          {/* Needful Blood Donation Facts & Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 shrink-0">
                <Droplet className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">1 Unit = 3 Lives</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Whole blood is separated into Red Cells, Platelets, and Plasma to treat 3 patients.
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Eligibility Criteria</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Age 18–65, weight ≥ 45 kg, Hb ≥ 12.5 g/dL. Safe, quick, and replenishes in 24–48 hours.
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Health Benefits</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Regular donation stimulates new cell production and maintains healthy arterial elasticity.
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Instant Certificate</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Every donor receives a colorful, verifiable Certificate of Appreciation in PDF.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* RIGHT COLUMN: LOGIN FORM & 1-CLICK TEST LOGINS */}
        {/* ==================================================================== */}
        <div className="lg:col-span-5">
          <div className="bg-white py-8 px-6 sm:px-8 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-200/80">
            {/* Title Header */}
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-200 mb-2.5">
                <Droplet className="w-7 h-7 fill-current" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                Sanjeevani Blood Portal
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sign in to manage inventory, requisitions & donor certifications
              </p>
            </div>

            {/* Quick Fill Demo Credentials */}
            <div className="mb-6 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
                <span>⚡ 1-Click Indian Demo Logins:</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillCredentials('admin@bloodbank.org', 'AdminPassword123!')}
                  className="px-2 py-2 text-xs font-bold rounded-xl bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 transition-all text-center flex flex-col items-center gap-0.5 cursor-pointer active:scale-95"
                >
                  <span>👑 Admin</span>
                  <span className="text-[10px] font-normal text-rose-600">Dr. Rajesh</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('donor.aarav@example.com', 'DonorPassword123!')}
                  className="px-2 py-2 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-all text-center flex flex-col items-center gap-0.5 cursor-pointer active:scale-95"
                >
                  <span>🩸 Donor</span>
                  <span className="text-[10px] font-normal text-emerald-600">Aarav Patel</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('patient.amit@example.com', 'PatientPassword123!')}
                  className="px-2 py-2 text-xs font-bold rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 transition-all text-center flex flex-col items-center gap-0.5 cursor-pointer active:scale-95"
                >
                  <span>🏥 Patient</span>
                  <span className="text-[10px] font-normal text-blue-600">Amit Verma</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:bg-white text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:bg-white text-sm transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 focus:outline-none focus:ring-4 focus:ring-rose-500/20 shadow-lg shadow-rose-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-600">
                New donor or hospital requester?{' '}
                <Link
                  to="/register"
                  className="font-bold text-rose-600 hover:text-rose-700 hover:underline transition-colors"
                >
                  Register Here
                </Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
