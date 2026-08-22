import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { RoleBadge } from './RoleBadge.js';
import { ThemeToggle } from './ThemeToggle.js';
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
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <Link
              to={isAuthenticated ? getDashboardLink() : '/login'}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-md shadow-rose-200 dark:shadow-rose-950 group-hover:scale-105 transition-transform duration-200">
                <Droplet className="w-6 h-6 fill-current" />
              </div>
              <div>
                <span className="text-xl font-black bg-gradient-to-r from-rose-600 to-red-600 dark:from-rose-400 dark:to-red-400 bg-clip-text text-transparent tracking-tight">
                  Sanjeevani
                </span>
                <span className="hidden sm:inline-block ml-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                  Blood Bank
                </span>
              </div>
            </Link>

            {/* Emergency Command Center Shortcut Pill */}
            <Link
              to="/command-center"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 transition-all shadow-sm group"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span>Emergency Command Center</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-3">
            {/* Command Center Link for tablet */}
            <Link
              to="/command-center"
              className="flex lg:hidden items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-800"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
              <span>Command Center</span>
            </Link>

            {/* Global Theme Toggle Button */}
            <ThemeToggle />

            {isAuthenticated && user ? (
              <>
                {/* Active Dashboard Link */}
                <Link
                  to={getDashboardLink()}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  Dashboard
                </Link>

                <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

                {/* User Info Capsule */}
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 rounded-full">
                  {/* Blood Group Pill */}
                  {user.blood_group && (
                    <span className="flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 px-2 py-0.5 rounded-full">
                      <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                      {formatBloodGroup(user.blood_group)}
                    </span>
                  )}

                  {/* Name */}
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                    {user.name}
                  </div>

                  {/* Role Badge */}
                  <RoleBadge role={user.role} />
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  title="Logout from system"
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 px-3 py-2 rounded-lg transition-colors ml-1 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 px-3 py-2 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-bold rounded-xl text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-200 dark:shadow-none transition-all active:scale-95"
                >
                  Join Network
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu & Theme Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-6 space-y-3">
          <Link
            to="/command-center"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 p-3 text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800"
          >
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <span>Emergency Command Center</span>
          </Link>

          {isAuthenticated && user ? (
            <div className="space-y-3 pt-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{user.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
                </div>
                <RoleBadge role={user.role} />
              </div>

              <Link
                to={getDashboardLink()}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span>Dashboard</span>
              </Link>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2 p-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 text-center text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 text-center text-sm font-bold text-white bg-rose-600 rounded-xl shadow-md"
              >
                Join
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
