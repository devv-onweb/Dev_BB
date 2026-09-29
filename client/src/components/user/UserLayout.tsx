import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Droplet,
  FileText,
  Stethoscope,
  Bell,
  User,
  LogOut,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Menu,
  X,
  PhoneCall,
  HeartPulse,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import axiosClient from '../../api/axiosClient.js';
import { Notification, formatBloodGroup } from '../../types/index.js';

export const UserLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState<boolean>(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axiosClient.get<{ success: boolean; unreadCount: number; notifications: Notification[] }>('/user/notifications');
      if (res.data && res.data.success) {
        setUnreadCount(res.data.unreadCount || 0);
        setNotifications(res.data.notifications || []);
      }
    } catch {
      // Offline fallback
    }
  };

  const navItems = [
    {
      label: 'Dashboard',
      path: '/user/dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      label: 'Order Blood',
      path: '/user/order-blood',
      icon: Droplet,
      badge: null,
    },
    {
      label: 'Reports & AI',
      path: '/user/reports',
      icon: FileText,
      badge: 'AI Powered',
    },
    {
      label: 'Doctors',
      path: '/user/doctors',
      icon: Stethoscope,
      badge: user?.profile?.preferred_doctor ? '⭐ Preferred' : null,
    },
    {
      label: 'Notifications',
      path: '/user/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? `${unreadCount}` : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      label: 'My Health Profile',
      path: '/user/profile',
      icon: User,
      badge: null,
    },
  ];

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await axiosClient.patch(`/user/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Mobile Top Navbar Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <HeartPulse className="w-6 h-6 text-rose-600 animate-pulse" />
          <span className="font-bold text-slate-800 dark:text-white">Patient Portal</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/user/notifications')}
            className="relative p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-bold bg-rose-600 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          isMobileMenuOpen ? 'block' : 'hidden'
        } md:flex flex-col w-full md:w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-shrink-0 transition-all duration-300 z-20`}
      >
        {/* User Card Header in Sidebar */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-rose-500/20">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'PT'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-white truncate">{user?.name || 'Patient User'}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  {formatBloodGroup(user?.blood_group || user?.profile?.blood_group)}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Patient Portal
                </span>
              </div>
            </div>
          </div>

          {/* Quick SOS Card if Preferred Doctor is linked */}
          {user?.profile?.preferred_doctor && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-amber-300">
                <span className="flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Primary Doctor
                </span>
                <a
                  href={`tel:${user.profile.preferred_doctor.phone}`}
                  className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline"
                >
                  <PhoneCall className="w-3 h-3" />
                  Call
                </a>
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">
                {user.profile.preferred_doctor.name}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {user.profile.preferred_doctor.hospital_name}
              </p>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
            Patient Features
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/25 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badgeColor || 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button
            onClick={() => navigate('/command-center')}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-bold shadow-md shadow-rose-900/20 transition-all duration-200"
          >
            <ShieldAlert className="w-4 h-4 text-white animate-bounce" />
            <span>Emergency SOS Center</span>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Feature Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar for Desktop */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Hemocare Management System
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
              {navItems.find((n) => n.path === location.pathname)?.label || 'Patient Portal'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[11px] font-extrabold bg-rose-600 text-white rounded-full shadow-sm animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Popup */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-rose-600" />
                      Notifications ({unreadCount} unread)
                    </span>
                    <button
                      onClick={() => {
                        setShowNotifDropdown(false);
                        navigate('/user/notifications');
                      }}
                      className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-xs">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            setShowNotifDropdown(false);
                            navigate('/user/notifications');
                          }}
                          className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                            !notif.read_at ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">{notif.title}</h5>
                            {!notif.read_at && (
                              <button
                                onClick={(e) => handleMarkRead(notif.id, e)}
                                className="text-[10px] text-rose-600 hover:underline flex-shrink-0 ml-2"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{notif.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(notif.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Order Blood Action */}
            <button
              onClick={() => navigate('/user/order-blood')}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-xs shadow-md shadow-rose-500/20 transition-all duration-200"
            >
              <Droplet className="w-4 h-4" />
              <span>Order Blood</span>
            </button>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserLayout;
