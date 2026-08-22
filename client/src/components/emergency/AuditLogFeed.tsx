import React, { useState } from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { AuditLogType } from '../../types/emergency.types';
import {
  ListFilter,
  Trash2,
  Layers,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Clock,
  User,
} from 'lucide-react';

export const AuditLogFeed: React.FC = () => {
  const { auditLogs, clearAuditLogs } = useEmergency();
  const [filterType, setFilterType] = useState<'ALL' | AuditLogType>('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    if (filterType === 'ALL') return true;
    return log.type === filterType;
  });

  const getLogIcon = (type: AuditLogType, severity: string) => {
    switch (type) {
      case 'STOCK_ADJUST':
        return <Layers className="w-3.5 h-3.5 text-indigo-400" />;
      case 'REQUISITION_CREATED':
        return <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />;
      case 'REQUISITION_FULFILLED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'SHORTAGE_ALERT':
        return <AlertTriangle className="w-3.5 h-3.5 text-red-400" />;
      default:
        return <Radio className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/15 border-red-500/30 text-red-300';
      case 'warning':
        return 'bg-amber-500/15 border-amber-500/30 text-amber-300';
      case 'success':
        return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';
      default:
        return 'bg-slate-800/80 border-slate-700/80 text-slate-300';
    }
  };

  return (
    <section className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 backdrop-blur space-y-4">
      {/* Feed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Live Audit Log & Activity Stream
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </h2>
            <p className="text-xs text-slate-400">Timestamped Clinical Telemetry & Stock Actions</p>
          </div>
        </div>

        {/* Filter & Clear Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
            <ListFilter className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-transparent text-slate-300 text-xs font-semibold px-2 py-0.5 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">
                All Activities ({auditLogs.length})
              </option>
              <option value="STOCK_ADJUST" className="bg-slate-900 text-white">
                Stock Adjustments
              </option>
              <option value="REQUISITION_CREATED" className="bg-slate-900 text-white">
                Requisitions Created
              </option>
              <option value="REQUISITION_FULFILLED" className="bg-slate-900 text-white">
                Fulfillments
              </option>
              <option value="SHORTAGE_ALERT" className="bg-slate-900 text-white">
                Shortage Alerts
              </option>
            </select>
          </div>

          <button
            onClick={clearAuditLogs}
            title="Clear Activity Stream"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-all border border-slate-700/60"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable Event Stream */}
      <div className="max-h-80 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
        {filteredLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No activity logs found for this filter.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`p-3 rounded-xl border text-xs transition-all flex items-start justify-between gap-3 ${getSeverityStyle(
                log.severity
              )}`}
            >
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80 shrink-0 mt-0.5">
                  {getLogIcon(log.type, log.severity)}
                </div>

                <div>
                  <div className="font-bold text-white tracking-tight">{log.message}</div>
                  {log.details && <div className="text-slate-400 mt-0.5 text-[11px]">{log.details}</div>}
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {log.actor}
                    </span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1 font-mono text-[11px] text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800/60">
                <Clock className="w-3 h-3 text-slate-400" />
                {log.timestamp}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
