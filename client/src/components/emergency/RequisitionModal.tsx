import React, { useState, useEffect } from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { BloodGroup, HospitalWard, UrgencyLevel } from '../../types/emergency.types';
import { X, AlertOctagon, AlertTriangle, CheckCircle, ShieldAlert, Droplet } from 'lucide-react';

const WARDS: HospitalWard[] = [
  'Emergency / Trauma',
  'Operating Theater (OT)',
  'ICU (Intensive Care)',
  'Oncology',
  'General Surgical',
  'Pediatric ICU (PICU)',
];

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const RequisitionModal: React.FC = () => {
  const { isModalOpen, setIsModalOpen, createRequisition, inventory } = useEmergency();

  const [patientName, setPatientName] = useState('');
  const [ward, setWard] = useState<HospitalWard>('Emergency / Trauma');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O-');
  const [unitsNeeded, setUnitsNeeded] = useState<number>(2);
  const [urgency, setUrgency] = useState<UrgencyLevel>('STAT_CRITICAL');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, setIsModalOpen]);

  if (!isModalOpen) return null;

  const currentAvailableStock = inventory[bloodGroup]?.units || 0;
  const isStockInsufficient = currentAvailableStock < unitsNeeded;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!patientName.trim()) {
      setErrorMessage('Patient Name is required.');
      return;
    }

    if (unitsNeeded <= 0 || unitsNeeded > 20) {
      setErrorMessage('Units needed must be between 1 and 20.');
      return;
    }

    createRequisition({
      patientName: patientName.trim(),
      ward,
      bloodGroup,
      unitsNeeded: Number(unitsNeeded),
      urgency,
      clinicalNotes: clinicalNotes.trim() || undefined,
    });

    // Reset Form
    setPatientName('');
    setClinicalNotes('');
    setUnitsNeeded(2);
    setUrgency('STAT_CRITICAL');
    setIsModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="bg-slate-950/80 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Emergency Blood Requisition</h2>
              <p className="text-xs text-slate-400">Command Center Immediate Dispatch Order</p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(false)}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Patient Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Patient Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Rahul Verma or Smt. Sunita Rao"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>

          {/* Department / Ward & Blood Group (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Department / Ward *
              </label>
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value as HospitalWard)}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              >
                {WARDS.map((w) => (
                  <option key={w} value={w} className="bg-slate-900 text-white">
                    {w}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Required Blood Group *
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              >
                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g} className="bg-slate-900 text-white font-bold">
                    {g} ({inventory[g]?.units ?? 0} units available)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Units Needed & Stock Preview Indicator */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Units Needed *
              </label>
              <span className="text-xs text-slate-400">
                Cold Vault Stock:{' '}
                <strong
                  className={`font-black ${currentAvailableStock < unitsNeeded ? 'text-red-400' : 'text-emerald-400'}`}
                >
                  {currentAvailableStock} units
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="20"
                required
                value={unitsNeeded}
                onChange={(e) => setUnitsNeeded(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-28 px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm font-black text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />

              <div className="flex items-center gap-1.5">
                {[1, 2, 4, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setUnitsNeeded(num)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                      unitsNeeded === num
                        ? 'bg-red-500/20 border-red-500/40 text-red-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    +{num}
                  </button>
                ))}
              </div>
            </div>

            {/* Shortage warning notice */}
            {isStockInsufficient && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 shrink-0 animate-pulse" />
                <span>
                  <strong>Shortage Warning:</strong> Current vault stock ({currentAvailableStock}) is less than
                  requested units ({unitsNeeded}). Order will be queued with shortage flag.
                </span>
              </div>
            )}
          </div>

          {/* Urgency Level (Radio Select) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Urgency Level *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* STAT Critical */}
              <button
                type="button"
                onClick={() => setUrgency('STAT_CRITICAL')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  urgency === 'STAT_CRITICAL'
                    ? 'bg-red-500/20 border-red-500 text-white shadow-lg shadow-red-950/50 ring-1 ring-red-500'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-red-400 uppercase tracking-wide flex items-center gap-1">
                    <AlertOctagon className="w-3.5 h-3.5" /> STAT Critical
                  </span>
                  {urgency === 'STAT_CRITICAL' && <CheckCircle className="w-3.5 h-3.5 text-red-400" />}
                </div>
                <span className="text-[11px] text-slate-400">Immediate Trauma / Operating Room Dispatch</span>
              </button>

              {/* Urgent */}
              <button
                type="button"
                onClick={() => setUrgency('URGENT')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  urgency === 'URGENT'
                    ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg shadow-amber-950/50 ring-1 ring-amber-500'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Urgent
                  </span>
                  {urgency === 'URGENT' && <CheckCircle className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <span className="text-[11px] text-slate-400">Required within 30-60 minutes</span>
              </button>

              {/* Standard */}
              <button
                type="button"
                onClick={() => setUrgency('STANDARD')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  urgency === 'STANDARD'
                    ? 'bg-slate-800 border-slate-600 text-white shadow-lg ring-1 ring-slate-600'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Standard</span>
                  {urgency === 'STANDARD' && <CheckCircle className="w-3.5 h-3.5 text-slate-300" />}
                </div>
                <span className="text-[11px] text-slate-400">Routine ward or scheduled care</span>
              </button>
            </div>
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Clinical Notes & Indications (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Cross-match verified, active hemorrhage, hemoglobin level, attending surgeon notes..."
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-sm shadow-lg shadow-red-600/30 transition-all flex items-center gap-2 active:scale-95"
            >
              <Droplet className="w-4 h-4 fill-current" />
              <span>Submit Requisition</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
