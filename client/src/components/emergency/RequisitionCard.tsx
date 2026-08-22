import React, { useState } from 'react';
import { Requisition } from '../../types/emergency.types';
import { useEmergency } from '../../context/EmergencyContext';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Droplet,
  Check,
  Ban,
  Building2,
  FileText,
} from 'lucide-react';

interface RequisitionCardProps {
  requisition: Requisition;
}

export const RequisitionCard: React.FC<RequisitionCardProps> = ({ requisition }) => {
  const { fulfillRequisition, cancelRequisition, inventory } = useEmergency();
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isPending = requisition.status === 'PENDING';
  const isFulfilled = requisition.status === 'FULFILLED';
  const isCancelled = requisition.status === 'CANCELLED';
  const isStat = requisition.urgency === 'STAT_CRITICAL';
  const isUrgent = requisition.urgency === 'URGENT';

  const currentVaultStock = inventory[requisition.bloodGroup]?.units || 0;
  const isShortage = isPending && currentVaultStock < requisition.unitsNeeded;

  const handleFulfill = () => {
    setActionFeedback(null);
    const result = fulfillRequisition(requisition.id);
    if (!result.success) {
      setActionFeedback({ type: 'error', message: result.message });
    } else {
      setActionFeedback({ type: 'success', message: result.message });
    }
  };

  const getUrgencyBadge = () => {
    if (isStat) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse shadow-sm shadow-red-950/50">
          <AlertOctagon className="w-3.5 h-3.5" />
          STAT CRITICAL
        </span>
      );
    }
    if (isUrgent) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5" />
          URGENT
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-800 border border-slate-700 text-slate-300">
        STANDARD
      </span>
    );
  };

  return (
    <div
      className={`rounded-2xl p-5 border transition-all relative overflow-hidden backdrop-blur flex flex-col justify-between ${
        isStat && isPending
          ? 'bg-slate-900/95 border-red-500/40 shadow-xl shadow-red-950/30'
          : isFulfilled
          ? 'bg-slate-900/50 border-slate-800/80 opacity-80'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-md'
      }`}
    >
      <div>
        {/* Top Header: Order Number, Time, and Urgency Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-950/70 px-2 py-0.5 rounded-md border border-slate-800">
              {requisition.reqNumber}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {requisition.requestedAt}
            </span>
          </div>

          <div>{getUrgencyBadge()}</div>
        </div>

        {/* Middle Section: Patient Details & Blood Requisition Spec */}
        <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Patient & Ward */}
          <div>
            <h4 className="text-base font-black text-white tracking-tight">{requisition.patientName}</h4>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs text-slate-400 font-mono">{requisition.patientId}</span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-cyan-400 font-medium flex items-center gap-1 bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-900/30">
                <Building2 className="w-3 h-3" />
                {requisition.ward}
              </span>
            </div>
          </div>

          {/* Blood Group & Units Capsule */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto bg-slate-950/80 p-2 rounded-xl border border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center font-black text-red-300 text-sm">
              {requisition.bloodGroup}
            </div>
            <div className="pr-2">
              <div className="text-sm font-black text-white">{requisition.unitsNeeded} Units</div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Required</div>
            </div>
          </div>
        </div>

        {/* Clinical Notes if available */}
        {requisition.clinicalNotes && (
          <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{requisition.clinicalNotes}</span>
          </div>
        )}

        {/* Stock Shortage Warning Notice */}
        {isShortage && (
          <div className="mt-3 p-2.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
            <span>
              <strong>Stock Shortage:</strong> Only {currentVaultStock} unit(s) of {requisition.bloodGroup} in cold
              vault. Needs {requisition.unitsNeeded} units!
            </span>
          </div>
        )}

        {/* Inline Action Error / Feedback */}
        {actionFeedback && (
          <div
            className={`mt-3 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
              actionFeedback.type === 'error'
                ? 'bg-red-500/20 border border-red-500/40 text-red-300'
                : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
            }`}
          >
            {actionFeedback.type === 'error' ? (
              <AlertOctagon className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
        )}
      </div>

      {/* Footer: Fulfillment Status or Action Controls */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        {isFulfilled ? (
          <div className="w-full flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              Fulfilled & Dispatched
            </span>
            <span className="text-slate-400">
              {requisition.fulfilledAt} • {requisition.fulfilledBy}
            </span>
          </div>
        ) : isCancelled ? (
          <div className="w-full flex items-center justify-between text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Ban className="w-4 h-4" />
              Requisition Cancelled
            </span>
          </div>
        ) : (
          <div className="w-full flex items-center justify-between gap-3">
            <button
              onClick={() => cancelRequisition(requisition.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>

            <button
              onClick={handleFulfill}
              disabled={isShortage}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                isShortage
                  ? 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/50 active:scale-95'
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Fulfill & Deduct Stock</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
