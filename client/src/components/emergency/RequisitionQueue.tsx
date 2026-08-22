import React, { useState, useMemo } from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { RequisitionCard } from './RequisitionCard';
import { Activity, AlertOctagon, CheckCircle2, Clock, Inbox, Plus } from 'lucide-react';

export const RequisitionQueue: React.FC = () => {
  const { requisitions, setIsModalOpen } = useEmergency();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'STAT' | 'FULFILLED'>('PENDING');

  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((r) => {
      if (filter === 'PENDING') return r.status === 'PENDING';
      if (filter === 'STAT') return r.status === 'PENDING' && r.urgency === 'STAT_CRITICAL';
      if (filter === 'FULFILLED') return r.status === 'FULFILLED';
      return true;
    });
  }, [requisitions, filter]);

  const pendingCount = requisitions.filter((r) => r.status === 'PENDING').length;
  const statCount = requisitions.filter((r) => r.status === 'PENDING' && r.urgency === 'STAT_CRITICAL').length;
  const fulfilledCount = requisitions.filter((r) => r.status === 'FULFILLED').length;

  return (
    <section className="space-y-4">
      {/* Queue Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900/90 border border-slate-800/90 p-4 rounded-2xl backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Emergency Requisition Queue</h2>
              {statCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse">
                  {statCount} STAT
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Clinical Ward Orders & Dispatch Management</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              filter === 'PENDING'
                ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({pendingCount})</span>
          </button>

          <button
            onClick={() => setFilter('STAT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              filter === 'STAT'
                ? 'bg-red-500/20 border border-red-500/30 text-red-300 shadow-sm'
                : 'text-slate-400 hover:text-red-400'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>STAT Only ({statCount})</span>
          </button>

          <button
            onClick={() => setFilter('FULFILLED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              filter === 'FULFILLED'
                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 shadow-sm'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Fulfilled ({fulfilledCount})</span>
          </button>

          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'ALL'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({requisitions.length})
          </button>
        </div>
      </div>

      {/* Requisition Cards List */}
      {filteredRequisitions.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <Inbox className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-bold text-slate-300">No requisitions in this queue</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            All active patient blood requirements have been dispatched or cleared.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-bold transition-all inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Blood Request</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequisitions.map((req) => (
            <RequisitionCard key={req.id} requisition={req} />
          ))}
        </div>
      )}
    </section>
  );
};
