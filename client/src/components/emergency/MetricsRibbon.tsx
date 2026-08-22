import React from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { Droplet, AlertTriangle, Clock, Activity, AlertOctagon } from 'lucide-react';

export const MetricsRibbon: React.FC = () => {
  const { metrics } = useEmergency();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1: Total Blood Units Available */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 relative overflow-hidden backdrop-blur shadow-lg shadow-black/20 group hover:border-slate-700 transition-all">
        <div className="absolute -right-3 -bottom-3 text-red-500/10 pointer-events-none group-hover:scale-110 transition-transform">
          <Droplet className="w-24 h-24" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Blood Units</span>
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            <Droplet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">{metrics.totalUnits}</span>
          <span className="text-xs font-medium text-slate-400">Units in Cold Vault</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>8 of 8 blood groups cataloged</span>
        </div>
      </div>

      {/* Metric 2: Critical Shortage Count */}
      <div
        className={`bg-slate-900/90 border rounded-xl p-4 relative overflow-hidden backdrop-blur shadow-lg shadow-black/20 transition-all ${
          metrics.criticalShortageCount > 0
            ? 'border-red-500/40 bg-gradient-to-br from-red-950/20 via-slate-900 to-slate-900'
            : 'border-slate-800/90'
        }`}
      >
        <div className="absolute -right-3 -bottom-3 text-amber-500/10 pointer-events-none">
          <AlertTriangle className="w-24 h-24" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Critical Shortages</span>
          <div
            className={`p-2 rounded-lg border ${
              metrics.criticalShortageCount > 0
                ? 'bg-red-500/20 border-red-500/40 text-red-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span
            className={`text-3xl font-extrabold tracking-tight ${
              metrics.criticalShortageCount > 0 ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {metrics.criticalShortageCount}
          </span>
          <span className="text-xs font-medium text-slate-400">Groups Below Safety Threshold</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {metrics.criticalShortageCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-red-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
              Immediate donor mobilization recommended
            </span>
          ) : (
            <span className="text-emerald-400 font-medium">All group supplies within safety margins</span>
          )}
        </div>
      </div>

      {/* Metric 3: Active Requisitions */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 relative overflow-hidden backdrop-blur shadow-lg shadow-black/20 group hover:border-slate-700 transition-all">
        <div className="absolute -right-3 -bottom-3 text-cyan-500/10 pointer-events-none group-hover:scale-110 transition-transform">
          <Activity className="w-24 h-24" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Requisitions</span>
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">{metrics.activeRequisitions}</span>
          <span className="text-xs font-medium text-slate-400">Pending Orders</span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          {metrics.statCriticalCount > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-400 font-bold animate-pulse">
              <AlertOctagon className="w-3 h-3" />
              {metrics.statCriticalCount} STAT Critical
            </span>
          ) : (
            <span className="text-slate-400">No STAT trauma alerts active</span>
          )}
        </div>
      </div>

      {/* Metric 4: Live Telemetry Sync */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 relative overflow-hidden backdrop-blur shadow-lg shadow-black/20 group hover:border-slate-700 transition-all">
        <div className="absolute -right-3 -bottom-3 text-slate-500/10 pointer-events-none group-hover:scale-110 transition-transform">
          <Clock className="w-24 h-24" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Telemetry Sync</span>
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-slate-200 tracking-tight">{metrics.lastUpdated}</span>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Zero-latency local cache sync</span>
        </div>
      </div>
    </div>
  );
};
