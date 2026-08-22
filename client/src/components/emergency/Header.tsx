import React from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { MetricsRibbon } from './MetricsRibbon';
import { ShieldAlert, Plus, RotateCcw, Activity } from 'lucide-react';

export const Header: React.FC = () => {
  const { setIsModalOpen, resetToDemoData } = useEmergency();

  return (
    <header className="space-y-6">
      {/* Top Telemetry & Action Navigation Bar */}
      <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-4 sm:p-6 backdrop-blur shadow-2xl relative overflow-hidden">
        {/* Glow ambient accent */}
        <div className="absolute top-0 right-0 w-96 h-40 bg-red-600/10 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute top-0 left-1/3 w-96 h-40 bg-cyan-600/5 blur-3xl pointer-events-none rounded-full" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          {/* Left: Branding & Status Badge */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-700 p-0.5 shadow-lg shadow-red-600/30 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  Sanjeevani Blood Transfusion Network
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/30 text-red-400">
                  AIIMS Emergency Hub
                </span>
              </div>
              
              <div className="flex items-center gap-2 mt-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-medium text-slate-300">
                  Live National Blood Sync Active
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-cyan-400" /> Trauma Level 1 Protocol
                </span>
              </div>
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              onClick={resetToDemoData}
              title="Reset stock and requisitions to default demonstration state"
              className="px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-sm shadow-lg shadow-red-600/30 border border-red-400/30 transition-all flex items-center gap-2 active:scale-95 hover:shadow-red-600/50"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Create Blood Request</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Ribbon */}
      <MetricsRibbon />
    </header>
  );
};
