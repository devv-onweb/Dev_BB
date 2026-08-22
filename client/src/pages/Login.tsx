import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Droplet, Lock, Mail, AlertCircle, ArrowRight, Loader2, HeartHandshake } from 'lucide-react';

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

      // Redirect to intended location or role dashboard
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
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex p-3 rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-200 mb-3">
          <Droplet className="w-8 h-8 fill-current" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Sanjeevani Blood Bank Portal
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to access your blood bank, hospital requisition, and donor hub
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-2xl border border-slate-100 sm:px-10">
          {/* Quick Fill Demo Credentials */}
          <div className="mb-6 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5 flex items-center justify-between">
              <span>⚡ Quick Fill Indian Demo Logins:</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin@bloodbank.org', 'AdminPassword123!')}
                className="px-2 py-2 text-xs font-bold rounded-xl bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 transition-all text-center flex flex-col items-center gap-0.5"
              >
                <span>👑 Admin</span>
                <span className="text-[10px] font-normal text-rose-600">Dr. Rajesh</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('donor.aarav@example.com', 'DonorPassword123!')}
                className="px-2 py-2 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-all text-center flex flex-col items-center gap-0.5"
              >
                <span>🩸 Donor</span>
                <span className="text-[10px] font-normal text-emerald-600">Aarav Patel</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('patient.amit@example.com', 'PatientPassword123!')}
                className="px-2 py-2 text-xs font-bold rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 transition-all text-center flex flex-col items-center gap-0.5"
              >
                <span>🏥 Patient</span>
                <span className="text-[10px] font-normal text-blue-600">Amit Verma</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm animate-shake">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 h-5" />
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
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 h-5" />
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

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-500/20 shadow-lg shadow-rose-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-bold text-rose-600 hover:text-rose-700 hover:underline transition-colors"
              >
                Register as Donor or Patient
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
