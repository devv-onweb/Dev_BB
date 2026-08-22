import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { RoleBadge } from './RoleBadge.js';
import { formatBloodGroup } from '../types/index.js';
import {
  Droplet,
  LogOut,
  Menu,
  X,
  Heart,
  LayoutDashboard,
  ShieldAlert,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isCommandCenter = location.pathname === '/command-center' || location.pathname === '/emergency';

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'ADMIN':
        return '/admin-dashboard';
      case 'DONOR':
        return '/donor-dashboard';
      case 'PATIENT':
        return '/patient-dashboard';
      default:
        return '/login';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // If viewing the Emergency Command Center full-screen dark telemetry view, hide top default navbar
  if (isCommandCenter) {
    return null;
  }

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <Link
              to={isAuthenticated ? getDashboardLink() : '/login'}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-md shadow-rose-200 group-hover:scale-105 transition-transform duration-200">
                <Droplet className="w-6 h-6 fill-current" />
              </div>
              <div>
                <span className="text-xl font-black bg-gradient-to-r from-rose-600 to-red-700 bg-clip-text text-transparent tracking-tight">
                  Sanjeevani
                </span>
                <span className="hidden sm:inline-block ml-1.5 text-xs font-semibold text-slate-600 uppercase tracking-widest">
                  Blood Bank
                </span>
              </div>
            </Link>

            {/* Emergency Command Center Shortcut Pill */}
            <Link
              to="/command-center"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/30 transition-all shadow-sm group"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span>Emergency Command Center</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-4">
            {/* Command Center Link for tablet/desktop */}
            <Link
              to="/command-center"
              className="flex lg:hidden items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
              <span>Command Center</span>
            </Link>

            {isAuthenticated && user ? (
              <>
                {/* Active Dashboard Link */}
                <Link
                  to={getDashboardLink()}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:text-rose-600 hover:bg-rose-50/50 rounded-lg transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-slate-600" />
                  Dashboard
                </Link>

                <div className="h-5 w-px bg-slate-200 mx-1" />

                {/* User Info Capsule */}
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-full">
                  {/* Blood Group Pill */}
                  {user.blood_group && (
                    <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                      <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                      {formatBloodGroup(user.blood_group)}
                    </span>
                  )}

                  {/* Name */}
                  <div className="text-sm font-semibold text-slate-800 leading-tight">
                    {user.name}
                  </div>

                  {/* Role Badge */}
                  <RoleBadge role={user.role} />
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  title="Logout from system"
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-lg transition-colors ml-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-700 hover:text-rose-600 px-3 py-2 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 px-4 py-2 rounded-lg shadow-sm shadow-rose-200 transition-colors"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-4 space-y-3">
          <Link
            to="/command-center"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-red-600 bg-red-50 rounded-md border border-red-200"
          >
            <ShieldAlert className="w-4 h-4 text-red-500" />
            Emergency Command Center
          </Link>

          {isAuthenticated && user ? (
            <>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {user.blood_group && (
                    <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                      {formatBloodGroup(user.blood_group)}
                    </span>
                  )}
                  <RoleBadge role={user.role} />
                </div>
              </div>

              <Link
                to={getDashboardLink()}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-500" />
                Go to Dashboard
              </Link>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-md"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
