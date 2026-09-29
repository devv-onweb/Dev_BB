import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import {
  Droplet,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Sparkles,
  Building2,
  CheckCircle2,
  FileText,
  Stethoscope,
  Bell,
  HeartPulse,
} from 'lucide-react';

export const PatientLogin: React.FC = () => {
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('user@hemocare.org');
  const [password, setPassword] = useState('UserPassword123!');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to appropriate role dashboard
  if (isAuthenticated && user) {
    switch (user.role) {
      case 'USER':
      case 'PATIENT':
        return <Navigate to="/user/dashboard" replace />;
      case 'ADMIN':
      case 'HOSPITAL':
        return <Navigate to="/admin-dashboard" replace />;
      case 'DONOR':
        return <Navigate to="/donor-dashboard" replace />;
      default:
        return <Navigate to="/user/dashboard" replace />;
    }
  }

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
        case 'USER':
        case 'PATIENT':
          navigate('/user/dashboard', { replace: true });
          break;
        case 'ADMIN':
        case 'HOSPITAL':
          navigate('/admin-dashboard', { replace: true });
          break;
        case 'DONOR':
          navigate('/donor-dashboard', { replace: true });
          break;
        default:
          navigate('/user/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your email and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillPatientDemo = () => {
    setEmail('user@hemocare.org');
    setPassword('UserPassword123!');
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-100 dark:bg-slate-950 transition-colors duration-200 relative">
      {/* Top-Right Staff Login Shortcut */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-10">
        <Link
          to="/staff-login"
          title="Staff Login (Admin / Hospital / Donor)"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow transition-all text-xs font-bold group"
        >
          <Building2 className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Staff Login (Admin / Hospital)</span>
          <span className="sm:hidden">Staff Login</span>
        </Link>
      </div>

      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-6 lg:mt-0">
        {/* Left Column: Patient Platform Info & Capabilities */}
        <div className="lg:col-span-6 space-y-6">
          {/* Main Brand Hero Card */}
          <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-rose-800/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-40 bg-rose-600/10 blur-3xl pointer-events-none rounded-full" />

            <div className="flex items-start gap-4">
              <div className="p-3.5 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-400/30 shrink-0">
                <HeartPulse className="w-8 h-8 text-rose-500" />
              </div>
              <div className="space-y-1">
                <div className="text-[11px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Patient Care Grid
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide">
                  Hemocare Management System
                </h2>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  Dedicated healthcare and blood management portal for patients. Request emergency blood units, upload lab reports for AI diagnosis, and consult specialized doctors.
                </p>
              </div>
            </div>
          </div>

          {/* Patient Services Feature Cards */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Patient Services & AI Portal
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Patient Portal
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
                  <Droplet className="w-4 h-4" />
                  <span>Blood Requisitions</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Instant requests with real-time status tracking and hospital coordination.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs">
                  <FileText className="w-4 h-4" />
                  <span>BloodCare AI Analysis</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Upload CBC/hematology reports for instant biomarker & risk interpretation.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
                  <Stethoscope className="w-4 h-4" />
                  <span>Doctor Consultations</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Connect with hospital doctors and set your preferred specialist.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <Bell className="w-4 h-4" />
                  <span>Health Notifications</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Daily wellness tips, follow-up alerts, and medication reminders.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Patient Sign-in Box */}
        <div className="lg:col-span-6">
          <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-8 shadow-xl shadow-slate-200/60 dark:shadow-none rounded-3xl border border-slate-200/80 dark:border-slate-800 transition-colors">
            {/* Title Header */}
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-200 dark:shadow-none mb-2.5">
                <Droplet className="w-7 h-7 fill-current" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Patient Sign In
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Access your health records, blood requisitions, and doctor consultations
              </p>
            </div>

            {/* 1-Click Demo Fill Badge */}
            <div className="mb-5 p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-rose-900 dark:text-rose-300">
                  Demo Patient Account:
                </span>
                <p className="text-[11px] text-rose-700 dark:text-rose-400 font-mono">user@hemocare.org</p>
              </div>
              <button
                type="button"
                onClick={fillPatientDemo}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                Auto Fill
              </button>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 flex items-start gap-2.5 text-red-700 dark:text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
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
                    placeholder="user@hemocare.org"
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
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
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 focus:outline-none focus:ring-4 focus:ring-rose-500/20 shadow-lg shadow-rose-200 dark:shadow-none transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Patient Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <Link
                to="/user/register"
                className="font-bold text-rose-600 dark:text-rose-400 hover:underline"
              >
                Create New Patient Account →
              </Link>
              <Link
                to="/staff-login"
                className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
              >
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Staff & Donor Login</span>
              </Link>
            </div>
          </div>

          {/* Bottom Shortcut Bar */}
          <div className="mt-4 text-center">
            <Link
              to="/staff-login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 shadow-sm transition-all"
            >
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>Are you Hospital Staff, an Administrator, or a Blood Donor? <strong>Go to Staff Login →</strong></span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientLogin;
