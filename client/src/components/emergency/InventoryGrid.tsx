import React, { useState, useMemo } from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { InventoryCard } from './InventoryCard';
import { Search, Filter, Layers, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const InventoryGrid: React.FC = () => {
  const { inventory } = useEmergency();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CRITICAL' | 'OPTIMAL'>('ALL');

  const bloodGroupList = useMemo(() => {
    const list = Object.values(inventory);

    return list.filter((item) => {
      // 1. Text filter
      const matchesSearch = item.bloodGroup.toLowerCase().includes(searchTerm.toLowerCase().trim());

      // 2. Status filter
      if (statusFilter === 'CRITICAL') {
        return matchesSearch && item.units <= item.minThreshold;
      }
      if (statusFilter === 'OPTIMAL') {
        return matchesSearch && item.units > item.minThreshold;
      }

      return matchesSearch;
    });
  }, [inventory, searchTerm, statusFilter]);

  const criticalCount = Object.values(inventory).filter((i) => i.units <= i.minThreshold).length;
  const optimalCount = Object.values(inventory).filter((i) => i.units > i.minThreshold).length;

  return (
    <section className="space-y-4">
      {/* Section Header with Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-900/90 border border-slate-800/90 p-4 rounded-2xl backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Live Blood Bank Inventory</h2>
            <p className="text-xs text-slate-400">8 Critical Blood Groups • Real-Time Capacity Tracking</p>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search group (e.g. O-, A+)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All (8)
            </button>

            <button
              onClick={() => setStatusFilter('CRITICAL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                statusFilter === 'CRITICAL'
                  ? 'bg-red-500/20 border border-red-500/30 text-red-300 shadow-sm'
                  : 'text-slate-400 hover:text-red-400'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Critical ({criticalCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('OPTIMAL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                statusFilter === 'OPTIMAL'
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 shadow-sm'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Optimal ({optimalCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 8-Card Responsive Grid */}
      {bloodGroupList.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <Filter className="w-10 h-10 text-slate-500 mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-slate-300">No matching blood groups found</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting your search query or filter selection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {bloodGroupList.map((item) => (
            <InventoryCard key={item.bloodGroup} item={item} />
          ))}
        </div>
      )}
    </section>
  );
};
