import React from 'react';
import { BloodInventoryItem } from '../../types/emergency.types';
import { useEmergency } from '../../context/EmergencyContext';
import { Droplet, Plus, Minus, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface InventoryCardProps {
  item: BloodInventoryItem;
}

export const InventoryCard: React.FC<InventoryCardProps> = ({ item }) => {
  const { adjustStock } = useEmergency();

  const isCritical = item.units <= item.minThreshold;
  const isModerate = item.units > item.minThreshold && item.units <= item.minThreshold * 1.8;
  const percentage = Math.min(100, Math.round((item.units / item.capacity) * 100));

  const getStatusBadge = () => {
    if (isCritical) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-red-500/20 border border-red-500/40 text-red-400 shadow-sm animate-pulse">
          <AlertTriangle className="w-3 h-3" />
          CRITICAL / LOW
        </span>
      );
    }
    if (isModerate) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-amber-500/10 border border-amber-500/30 text-amber-400">
          MODERATE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
        <CheckCircle2 className="w-3 h-3" />
        OPTIMAL
      </span>
    );
  };

  return (
    <div
      className={`rounded-2xl p-5 border transition-all relative overflow-hidden backdrop-blur flex flex-col justify-between ${
        isCritical
          ? 'bg-slate-900/90 border-red-500/50 shadow-lg shadow-red-950/40 hover:border-red-400'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/95 shadow-md shadow-black/30'
      }`}
    >
      {/* Top Background Glow for Critical Items */}
      {isCritical && (
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-red-600/15 rounded-full blur-2xl pointer-events-none" />
      )}

      <div>
        {/* Header: Blood Group Title & Status Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base border shadow-sm ${
                isCritical
                  ? 'bg-red-500/20 border-red-500/40 text-red-300'
                  : 'bg-slate-800 border-slate-700 text-slate-100'
              }`}
            >
              <Droplet className="w-4 h-4 fill-current text-red-500" />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight text-white">{item.bloodGroup}</h3>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Whole Blood</span>
            </div>
          </div>

          <div>{getStatusBadge()}</div>
        </div>

        {/* Units Counter & Capacity Visualizer */}
        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className={`text-4xl font-black tracking-tight ${isCritical ? 'text-red-400' : 'text-white'}`}>
                {item.units}
              </span>
              <span className="text-xs font-semibold text-slate-400">Units</span>
            </div>

            <span className="text-xs font-semibold text-slate-400">
              Cap: <strong className="text-slate-200">{item.capacity}</strong> (Min: {item.minThreshold})
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 mt-2.5 overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCritical
                  ? 'bg-gradient-to-r from-red-600 to-rose-500'
                  : isModerate
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer: Quick-action Adjusters (+ and -) */}
      <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-400">Quick Adjust</span>

        <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => adjustStock(item.bloodGroup, -1, 'Dispensed to clinical floor')}
            disabled={item.units <= 0}
            title={`Deduct 1 unit of ${item.bloodGroup}`}
            className="w-8 h-8 rounded-lg bg-slate-800/90 hover:bg-red-500/20 hover:text-red-300 text-slate-300 flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-90 border border-slate-700/60"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <span className="w-6 text-center text-xs font-bold text-slate-300">±1</span>

          <button
            onClick={() => adjustStock(item.bloodGroup, 1, 'Restocked from blood donation camp')}
            disabled={item.units >= item.capacity}
            title={`Add 1 unit of ${item.bloodGroup}`}
            className="w-8 h-8 rounded-lg bg-slate-800/90 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-300 flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-90 border border-slate-700/60"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
