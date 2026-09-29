import React, { useState, useEffect } from 'react';
import {
  Bell,
  Heart,
  Droplet,
  Calendar,
  AlertCircle,
  Pill,
  CheckCircle2,
  Trash2,
  Sparkles,
  Filter,
  CheckCheck,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import axiosClient from '../../api/axiosClient.js';
import { Notification, NotificationType } from '../../types/index.js';

export const UserNotifications: React.FC = () => {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGeneratingTip, setIsGeneratingTip] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await axiosClient.get<{
        success: boolean;
        unreadCount: number;
        notifications: Notification[];
      }>('/user/notifications');
      if (res.data?.notifications) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // offline fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await axiosClient.patch(`/user/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await axiosClient.patch('/user/notifications/read-all');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
      setToastMsg('All notifications marked as read.');
      setTimeout(() => setToastMsg(null), 3000);
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await axiosClient.delete(`/user/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      fetchNotifications();
    } catch {}
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    try {
      await axiosClient.delete('/user/notifications');
      setNotifications([]);
      setUnreadCount(0);
    } catch {}
  };

  const handleGenerateHealthTip = async () => {
    setIsGeneratingTip(true);
    try {
      const res = await axiosClient.post<{ success: boolean; notification: Notification }>(
        '/user/notifications/tip'
      );
      if (res.data?.notification) {
        setNotifications((prev) => [res.data.notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        setToastMsg('New daily health tip received!');
        setTimeout(() => setToastMsg(null), 3000);
      }
    } catch {
      // fallback
    } finally {
      setIsGeneratingTip(false);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'health_tip':
        return <Heart className="w-5 h-5 text-emerald-500" />;
      case 'order_status':
        return <Droplet className="w-5 h-5 text-rose-500" />;
      case 'followup':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'medicine_reminder':
        return <Pill className="w-5 h-5 text-purple-500" />;
      case 'test_due':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const getNotificationTag = (type: NotificationType) => {
    switch (type) {
      case 'health_tip':
        return { label: 'Health Tip', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
      case 'order_status':
        return { label: 'Blood Order', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' };
      case 'followup':
        return { label: 'Clinical Follow-up', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
      case 'medicine_reminder':
        return { label: 'Medication', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' };
      case 'test_due':
        return { label: 'Lab Test Due', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
      default:
        return { label: 'General', color: 'bg-slate-500/10 text-slate-600 border-slate-500/20' };
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'UNREAD') return !notif.read_at;
    return notif.type === activeTab;
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-7 h-7 text-rose-600" />
            Health Alerts & Smart Notifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Phase 9 automated clinical scheduler: daily health tips, flagged pathology follow-ups, and blood order tracking.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleGenerateHealthTip}
            disabled={isGeneratingTip}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGeneratingTip ? 'Fetching Tip...' : 'Get Health Tip'}</span>
          </button>
          <button
            onClick={fetchNotifications}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Action Controls & Tab Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'ALL', label: 'All Notifications' },
            { id: 'UNREAD', label: `Unread (${unreadCount})` },
            { id: 'health_tip', label: 'Health Tips' },
            { id: 'order_status', label: 'Order Status' },
            { id: 'followup', label: 'Follow-ups' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === tab.id
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear all</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <Bell className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="font-bold text-base text-slate-700 dark:text-slate-300">No notifications in this view</h3>
          <p className="text-xs text-slate-400">You are all caught up! New reminders and automated tips will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const isUnread = !notif.read_at;
            const tag = getNotificationTag(notif.type);

            return (
              <div
                key={notif.id}
                className={`p-5 rounded-3xl border transition-all duration-200 flex items-start justify-between gap-4 ${
                  isUnread
                    ? 'bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-900/60 shadow-md shadow-rose-600/5 ring-1 ring-rose-500/20'
                    : 'bg-white/70 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 flex-shrink-0">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${tag.color}`}>
                        {tag.label}
                      </span>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      )}
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(notif.scheduled_at || notif.created_at).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{notif.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                      {notif.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  {isUnread && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
                      title="Mark as Read"
                    >
                      <CheckCircle2 className="w-4 h-4 text-rose-600" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notif.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserNotifications;
