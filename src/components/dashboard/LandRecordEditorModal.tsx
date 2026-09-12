import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { LandUseRecord } from '../../types';
import {
  X,
  Save,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface LandRecordEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LandRecordEditorModal: React.FC<LandRecordEditorModalProps> = ({ isOpen, onClose }) => {
  const {
    currentRecord,
    selectedState,
    selectedDistrict,
    selectedYear,
    states,
    districts,
    updateCurrentLandUseRecord
  } = useApp();

  const [formData, setFormData] = useState({
    total_area_ha: 0,
    agricultural_pct: 0,
    forest_pct: 0,
    builtup_pct: 0,
    waterbodies_pct: 0,
    barren_pct: 0,
    other_pct: 0,
    irrigated_pct: 0,
    degraded_pct: 0,
    notes: ''
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (currentRecord) {
      setFormData({
        total_area_ha: currentRecord.total_area_ha || 307000,
        agricultural_pct: currentRecord.agricultural_pct || 68.2,
        forest_pct: currentRecord.forest_pct || 14.1,
        builtup_pct: currentRecord.builtup_pct || 8.4,
        waterbodies_pct: currentRecord.waterbodies_pct || 4.2,
        barren_pct: currentRecord.barren_pct || 3.1,
        other_pct: currentRecord.other_pct || 2.0,
        irrigated_pct: currentRecord.irrigated_pct || 78.5,
        degraded_pct: currentRecord.degraded_pct || 12.0,
        notes: currentRecord.notes || 'Inspection Directorate calibrated figures'
      });
    }
  }, [currentRecord, isOpen]);

  if (!isOpen) return null;

  const currentStateName = states.find(s => s.state_code === selectedState)?.state_name || selectedState;
  const currentDistrictName = districts.find(d => d.district_code === selectedDistrict)?.district_name || 'Entire State';

  // Calculate sum of percentages
  const pctSum = (
    Number(formData.agricultural_pct) +
    Number(formData.forest_pct) +
    Number(formData.builtup_pct) +
    Number(formData.waterbodies_pct) +
    Number(formData.barren_pct) +
    Number(formData.other_pct)
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const totalHa = Number(formData.total_area_ha);
      const agPct = Number(formData.agricultural_pct);
      const forPct = Number(formData.forest_pct);
      const bldPct = Number(formData.builtup_pct);
      const watPct = Number(formData.waterbodies_pct);
      const barPct = Number(formData.barren_pct);
      const othPct = Number(formData.other_pct);

      const updates: Partial<LandUseRecord> = {
        total_area_ha: totalHa,
        agricultural_pct: agPct,
        agricultural_area_ha: Math.round((agPct / 100) * totalHa),
        forest_pct: forPct,
        forest_area_ha: Math.round((forPct / 100) * totalHa),
        builtup_pct: bldPct,
        builtup_area_ha: Math.round((bldPct / 100) * totalHa),
        waterbodies_pct: watPct,
        waterbodies_area_ha: Math.round((watPct / 100) * totalHa),
        barren_pct: barPct,
        barren_area_ha: Math.round((barPct / 100) * totalHa),
        other_pct: othPct,
        other_area_ha: Math.round((othPct / 100) * totalHa),
        irrigated_pct: Number(formData.irrigated_pct),
        degraded_pct: Number(formData.degraded_pct),
        notes: formData.notes,
        confidence_score: 99.8
      };

      await updateCurrentLandUseRecord(updates);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-left flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800/80 border border-emerald-700/60 flex items-center justify-center">
              <Layers className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">
                  Inspection Super-User Control
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                Calibrate Cadastral Land Data
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Region & Context Summary */}
        <div className="px-6 py-3 bg-emerald-50/80 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/30 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-300">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>{currentStateName}</span>
            <span className="text-emerald-400">•</span>
            <span>{currentDistrictName}</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>Official Series Year: <strong>{selectedYear}</strong></span>
          </div>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
          {/* Total Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Total Geographical Area (Hectares)
            </label>
            <input
              type="number"
              value={formData.total_area_ha}
              onChange={e => setFormData({ ...formData, total_area_ha: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>

          {/* Land Category Percentages Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                9-Fold Cadastral Allocation (% of Total Land)
              </label>
              <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                Math.abs(pctSum - 100) < 0.5
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                Sum: {pctSum.toFixed(1)}% {Math.abs(pctSum - 100) >= 0.5 ? '(Approx)' : '✓'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {/* Agricultural */}
              <div className="p-3 rounded-2xl bg-lime-50/70 dark:bg-lime-950/20 border border-lime-200 dark:border-lime-900/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-lime-900 dark:text-lime-300">🌾 Agricultural Land</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.agricultural_pct}
                    onChange={e => setFormData({ ...formData, agricultural_pct: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-lime-300 dark:border-lime-800 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white text-sm"
                  />
                  <span className="text-xs font-bold text-slate-500">%</span>
                </div>
              </div>

              {/* Forest */}
              <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">🌲 Forest Cover</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.forest_pct}
                    onChange={e => setFormData({ ...formData, forest_pct: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white text-sm"
                  />
                  <span className="text-xs font-bold text-slate-500">%</span>
                </div>
              </div>

              {/* Builtup / Urban */}
              <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-rose-900 dark:text-rose-300">🏢 Urban & Built-up</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.builtup_pct}
                    onChange={e => setFormData({ ...formData, builtup_pct: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white text-sm"
                  />
                  <span className="text-xs font-bold text-slate-500">%</span>
                </div>
              </div>

              {/* Waterbodies */}
              <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-300">💧 Water Bodies & Rivers</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.waterbodies_pct}
                    onChange={e => setFormData({ ...formData, waterbodies_pct: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white text-sm"
                  />
                  <span className="text-xs font-bold text-slate-500">%</span>
                </div>
              </div>

              {/* Barren */}
              <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300">🏜️ Barren & Unculturable</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.barren_pct}
                    onChange={e => setFormData({ ...formData, barren_pct: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white text-sm"
                  />
                  <span className="text-xs font-bold text-slate-500">%</span>
                </div>
              </div>

              {/* Other Land */}
              <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-300">🌱 Other Land (Fallow/Grazing)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.other_pct}
                    onChange={e => setFormData({ ...formData, other_pct: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white text-sm"
                  />
                  <span className="text-xs font-bold text-slate-500">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Agro-Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Net Irrigated Land Ratio (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.irrigated_pct}
                onChange={e => setFormData({ ...formData, irrigated_pct: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Degraded / Sodic Soil Ratio (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.degraded_pct}
                onChange={e => setFormData({ ...formData, degraded_pct: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-sm"
              />
            </div>
          </div>

          {/* Audit Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Inspection Audit Reason / Calibration Gazette Reference
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g., UP Bhumi Sudhar Sodic Survey ground truth correction (2026)"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Changes sync instantly to the map and analytical charts across the app.
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating Ledger...</span>
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Calibrated & Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Official Override</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
