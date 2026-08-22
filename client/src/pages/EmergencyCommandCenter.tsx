import React from 'react';
import { EmergencyProvider } from '../context/EmergencyContext';
import { Header } from '../components/emergency/Header';
import { InventoryGrid } from '../components/emergency/InventoryGrid';
import { RequisitionQueue } from '../components/emergency/RequisitionQueue';
import { AuditLogFeed } from '../components/emergency/AuditLogFeed';
import { RequisitionModal } from '../components/emergency/RequisitionModal';
import { Link } from 'react-router-dom';
import { LayoutDashboard, HeartHandshake, User, ShieldAlert } from 'lucide-react';

const EmergencyDashboardContent: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-red-500 selection:text-white pb-16">
      {/* Top Universal Access Bar */}
      <div className="bg-slate-950/90 border-b border-slate-800/80 px-4 py-2.5 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <span className="font-bold text-white">Apex Care Health System</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-400">Hospital Emergency Blood Telemetry</span>
          </div>

          {/* Quick navigation to other portals */}
          <div className="flex items-center gap-3">
            <Link
              to="/admin-dashboard"
              className="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors font-semibold"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
              <span>Admin Portal</span>
            </Link>

            <span className="text-slate-400">|</span>

            <Link
              to="/donor-dashboard"
              className="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors font-semibold"
            >
              <HeartHandshake className="w-3.5 h-3.5 text-red-400" />
              <span>Donor Portal</span>
            </Link>

            <span className="text-slate-400">|</span>

            <Link
              to="/patient-dashboard"
              className="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors font-semibold"
            >
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Patient Portal</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Dashboard Layout Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        {/* 1. Header & Live Metrics Ribbon */}
        <Header />

        {/* 2. Live Blood Bank Inventory Grid View */}
        <InventoryGrid />

        {/* 3. Emergency Requisition Management Queue */}
        <RequisitionQueue />

        {/* 4. Live Audit Log & Activity Stream */}
        <AuditLogFeed />
      </main>

      {/* 5. Requisition Creation Modal */}
      <RequisitionModal />
    </div>
  );
};

export const EmergencyCommandCenter: React.FC = () => {
  return (
    <EmergencyProvider>
      <EmergencyDashboardContent />
    </EmergencyProvider>
  );
};

export default EmergencyCommandCenter;
