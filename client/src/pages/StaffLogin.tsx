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
  ShieldCheck,
  Sparkles,
  Building2,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';

type StaffLoginTab = 'HOSPITAL' | 'ADMIN' | 'DONOR';

const TAB_DEMO_CREDENTIALS: Record<
  StaffLoginTab,
  {
    title: string;
    badge: string;
    color: string;
    description: string;
    email: string;
    pass: string;
    roleLabel: string;
    features: string[];
  }
> = {
  HOSPITAL: {
    title: 'Hospital & Clinical Desk',
    badge: 'Hospital Staff',
    color: 'blue',
    description: 'Manage clinical blood requisitions, emergency trauma bays, and donor coordination queues.',
    email: 'hospital@aiims.edu',
    pass: 'HospitalPassword123!',
    roleLabel: 'Hospital Coordinator',
    features: ['Clinical Requisitions', 'Trauma Resuscitation Queue', 'Stock Availability', 'Doctor Liaison'],
  },
  ADMIN: {
    title: 'Executive Administration Bay',
    badge: 'System Admin',
    color: 'purple',
    description: 'Full oversight over central blood inventory, emergency responses, demand analytics & prediction.',
    email: 'admin@bloodbank.org',
    pass: 'AdminPassword123!',
    roleLabel: 'Administrator',
    features: ['Inventory Optimization', 'Predictive Demand AI', 'Hospital Network', 'Emergency Broadcasts'],
  },
  DONOR: {
    title: 'Voluntary Blood Donor Portal',
    badge: 'Blood Donor',
    color: 'emerald',
    description: 'Track your donation milestones, verify eligibility status, and download certificates.',
    email: 'donor.aarav@example.com',
    pass: 'DonorPassword123!',
    roleLabel: 'Voluntary Donor',
    features: ['Donation History', 'Eligibility Verification', 'Donor Certificates', 'Geo Emergency Alerts'],
  },
};

export const StaffLogin: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<StaffLoginTab>('HOSPITAL');
  const [email, setEmail] = useState('hospital@aiims.edu');
  const [password, setPassword] = useState('HospitalPassword123!');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTabChange = (tab: StaffLoginTab) => {
    setActiveTab(tab);
    setEmail(TAB_DEMO_CREDENTIALS[tab].email);
    setPassword(TAB_DEMO_CREDENTIALS[tab].pass);
    setError(null);
  };

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
        case 'HOSPITAL':
          navigate('/admin-dashboard', { replace: true });
          break;
        case 'DONOR':
          navigate('/donor-dashboard', { replace: true });
          break;
        case 'PATIENT':
        case 'USER':
          navigate('/user/dashboard', { replace: true });
          break;
        default:
          navigate('/admin-dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your email and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTabInfo = TAB_DEMO_CREDENTIALS[activeTab];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-100 dark:bg-slate-950 transition-colors duration-200">
      <div className="max-w-6xl mx-auto w-full space-y-4">
        {/* Top Back Link */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Back to Patient Login</span>
          </Link>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Staff & Clinical Access Portal
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Awareness & Role Features Info */}
          <div className="lg:col-span-6 space-y-6">
            {/* Main Header Card */}
            <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-rose-800/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-40 bg-rose-600/10 blur-3xl pointer-events-none rounded-full" />

              <div className="flex items-start gap-4">
                <div className="p-3.5 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-400/30 shrink-0">
                  <ShieldCheck className="w-8 h-8 text-rose-500" />
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Staff & Clinical Desk
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide">
                    Hemocare Management System
                  </h2>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    Unified staff operations connecting hospital clinical desks, system administrators, and voluntary blood donors.
                  </p>
                </div>
              </div>
            </div>

            {/* Active Role Feature Highlights */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Active Staff Role
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                  {currentTabInfo.badge}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{currentTabInfo.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {currentTabInfo.description}
              </p>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Included Capabilities:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {currentTabInfo.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 3-Tab Staff Login Form */}
          <div className="lg:col-span-6">
            <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-8 shadow-xl shadow-slate-200/60 dark:shadow-none rounded-3xl border border-slate-200/80 dark:border-slate-800 transition-colors">
              {/* Title Header */}
              <div className="text-center mb-6">
                <div className="inline-flex p-3 rounded-2xl bg-slate-900 dark:bg-slate-800 text-rose-500 shadow-lg border border-slate-200 dark:border-slate-700 mb-2.5">
                  <Building2 className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Staff & Donor Login
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select your portal tab below to log in or use 1-click credentials
                </p>
              </div>

              {/* 3 Staff Login Tabs (Hospital | Admin | Donor) */}
              <div className="mb-6 grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {(
                  [
                    { id: 'HOSPITAL', label: 'Hospital', icon: Building2 },
                    { id: 'ADMIN', label: 'Admin', icon: ShieldCheck },
                    { id: 'DONOR', label: 'Donor', icon: Heart },
                  ] as const
                ).map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-md shadow-slate-200/50 dark:shadow-none'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* 1-Click Demo Fill Badge */}
              <div className="mb-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Demo {currentTabInfo.badge}:
                  </span>
                  <p className="text-[11px] text-slate-500 font-mono truncate max-w-[180px] sm:max-w-xs">{currentTabInfo.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(currentTabInfo.email);
                    setPassword(currentTabInfo.pass);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-700 dark:hover:bg-slate-600 font-bold text-xs shadow-sm transition-colors cursor-pointer"
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
                      placeholder="name@hospital.org"
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
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-500 focus:outline-none focus:ring-4 focus:ring-slate-500/20 shadow-lg shadow-slate-200 dark:shadow-none transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Authenticating...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In as {currentTabInfo.roleLabel}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <Link
                  to="/"
                  className="font-bold text-rose-600 dark:text-rose-400 hover:underline"
                >
                  ← Patient Login
                </Link>
                <Link
                  to="/register"
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Donor Registration →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
