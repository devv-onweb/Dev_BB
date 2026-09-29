import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Droplet,
  FileText,
  Stethoscope,
  Bell,
  Activity,
  Heart,
  Calendar,
  AlertTriangle,
  ArrowRight,
  PhoneCall,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import axiosClient from '../../api/axiosClient.js';
import { BloodOrder, Report, Notification, formatBloodGroup, calculateBMI } from '../../types/index.js';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<BloodOrder[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [ordersRes, reportsRes, notifsRes] = await Promise.all([
        axiosClient.get<{ success: boolean; orders: BloodOrder[] }>('/user/orders').catch(() => ({ data: { orders: [] } })),
        axiosClient.get<{ success: boolean; reports: Report[] }>('/user/reports').catch(() => ({ data: { reports: [] } })),
        axiosClient.get<{ success: boolean; notifications: Notification[] }>('/user/notifications').catch(() => ({ data: { notifications: [] } })),
      ]);

      if (ordersRes.data?.orders) setOrders(ordersRes.data.orders);
      if (reportsRes.data?.reports) setReports(reportsRes.data.reports);
      if (notifsRes.data?.notifications) setNotifications(notifsRes.data.notifications);
    } catch {
      // offline fallback
    } finally {
      setIsLoading(false);
    }
  };

  const pendingOrders = orders.filter((o) => o.status === 'Pending');
  const flaggedReports = reports.filter((r) => r.is_flagged);
  const unreadNotifs = notifications.filter((n) => !n.read_at);
  const dailyHealthTip = notifications.find((n) => n.type === 'health_tip');

  const bmiData = calculateBMI(user?.profile?.weight_kg, user?.profile?.height_cm);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'Fulfilled':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'Rejected':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      default:
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-700 via-rose-600 to-red-700 text-white p-6 sm:p-8 shadow-xl shadow-rose-900/20">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Hemocare Patient Health Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Patient'}
            </h1>
            <p className="text-rose-100 text-sm max-w-xl">
              Access critical blood requisition services, clinical report analysis via BloodCare AI, and emergency liaison with verified medical specialists.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/user/order-blood')}
              className="px-5 py-2.5 rounded-2xl bg-white text-rose-700 font-bold text-sm shadow-lg hover:bg-rose-50 transition-all duration-200 flex items-center space-x-2"
            >
              <Droplet className="w-4 h-4 fill-rose-600" />
              <span>Order Blood</span>
            </button>
            <button
              onClick={() => navigate('/user/reports')}
              className="px-5 py-2.5 rounded-2xl bg-rose-800/80 hover:bg-rose-800 border border-white/20 text-white font-bold text-sm backdrop-blur-md transition-all duration-200 flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Upload Report</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 5 Core Feature Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Blood Orders */}
        <div
          onClick={() => navigate('/user/order-blood')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-rose-300 dark:hover:border-rose-800 cursor-pointer transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600">
              <Droplet className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {pendingOrders.length} Pending
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{orders.length}</h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Blood Orders</p>
          </div>
        </div>

        {/* Card 2: AI Analyzed Reports */}
        <div
          onClick={() => navigate('/user/reports')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-rose-300 dark:hover:border-rose-800 cursor-pointer transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600">
              <FileText className="w-6 h-6" />
            </div>
            {flaggedReports.length > 0 ? (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300">
                {flaggedReports.length} Flagged
              </span>
            ) : (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                All Normal
              </span>
            )}
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{reports.length}</h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Lab Reports Analyzed</p>
          </div>
        </div>

        {/* Card 3: Preferred Doctor */}
        <div
          onClick={() => navigate('/user/doctors')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-rose-300 dark:hover:border-rose-800 cursor-pointer transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600">
              <Stethoscope className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              ⭐ Linked
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
              {user?.profile?.preferred_doctor?.name || 'Dr. Priya Nambiar'}
            </h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Primary Care Specialist</p>
          </div>
        </div>

        {/* Card 4: Health Notifications */}
        <div
          onClick={() => navigate('/user/notifications')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-rose-300 dark:hover:border-rose-800 cursor-pointer transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600">
              <Bell className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500 text-white">
              {unreadNotifs.length} Unread
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{notifications.length}</h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Notifications & Tips</p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 spans): Blood Orders & AI Reports */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Blood Orders */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Droplet className="w-5 h-5 text-rose-600" />
                <h2 className="font-bold text-base text-slate-900 dark:text-white">Recent Blood Requisitions</h2>
              </div>
              <button
                onClick={() => navigate('/user/order-blood')}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
              >
                <span>View All / Place Order</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700">
                <Droplet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No blood orders placed yet.</p>
                <p className="text-xs text-slate-500 mt-1">Need blood units for a surgery or transfusion? Submit an order request.</p>
                <button
                  onClick={() => navigate('/user/order-blood')}
                  className="mt-3 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                >
                  Create Blood Order
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5">Blood Group</th>
                      <th className="py-2.5">Units</th>
                      <th className="py-2.5">Hospital</th>
                      <th className="py-2.5">Urgency</th>
                      <th className="py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {orders.slice(0, 4).map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 font-bold text-rose-600 dark:text-rose-400">
                          {formatBloodGroup(order.blood_group)}
                        </td>
                        <td className="py-3 text-slate-800 dark:text-slate-200">{order.units} unit(s)</td>
                        <td className="py-3 text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
                          {order.hospital_name}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              order.urgency === 'STAT_CRITICAL'
                                ? 'bg-red-500/20 text-red-600 border border-red-500/30'
                                : order.urgency === 'URGENT'
                                ? 'bg-orange-500/20 text-orange-600'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {order.urgency}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getStatusBadge(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Daily Health Tip Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 shadow-sm flex items-start space-x-4">
            <div className="p-3 rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20 flex-shrink-0">
              <Heart className="w-6 h-6 fill-white" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Daily Health Tip
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Auto-Scheduled</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {dailyHealthTip?.title || 'Optimal Hydration & Iron Absorption'}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {dailyHealthTip?.message ||
                  'Consuming Vitamin C alongside iron-rich foods increases non-heme iron absorption by up to 67%, supporting healthy erythrocyte and hemoglobin synthesis.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (1 span): Health Profile & Preferred Doctor Contact */}
        <div className="space-y-6">
          {/* Health Vitals Summary Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Health & Vitals Profile</h3>
              </div>
              <button
                onClick={() => navigate('/user/profile')}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
              >
                Edit
              </button>
            </div>

            <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex justify-between items-center pt-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Blood Group:</span>
                <span className="font-extrabold text-rose-600 dark:text-rose-400 text-sm">
                  {formatBloodGroup(user?.blood_group || user?.profile?.blood_group)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Body Mass Index (BMI):</span>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {bmiData.bmi !== null ? `${bmiData.bmi} kg/m²` : 'Not Set'}
                  </span>
                  {bmiData.bmi !== null && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${bmiData.color}`}>
                      {bmiData.label}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Weight / Height:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {user?.profile?.weight_kg ? `${user.profile.weight_kg} kg` : '--'} /{' '}
                  {user?.profile?.height_cm ? `${user.profile.height_cm} cm` : '--'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Emergency Contact:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                  {user?.profile?.emergency_contact || 'None registered'}
                </span>
              </div>
            </div>
          </div>

          {/* Preferred Doctor Contact Widget */}
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent rounded-3xl p-6 border border-amber-500/20 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Stethoscope className="w-4 h-4" />
                Preferred Doctor
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                Emergency Liaison
              </span>
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {user?.profile?.preferred_doctor?.name || 'Dr. Priya Nambiar, MD'}
              </h4>
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mt-0.5">
                {user?.profile?.preferred_doctor?.specialty || 'Hematology & Transfusion Medicine'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {user?.profile?.preferred_doctor?.hospital_name || 'AIIMS New Delhi'}
              </p>
            </div>

            <div className="pt-2 flex gap-2">
              <a
                href={`tel:${user?.profile?.preferred_doctor?.phone || '+91-98111-44556'}`}
                className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Doctor</span>
              </a>
              <button
                onClick={() => navigate('/user/doctors')}
                className="flex-1 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
