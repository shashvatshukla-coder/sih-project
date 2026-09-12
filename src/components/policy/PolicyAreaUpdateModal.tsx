import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Policy, AreaTarget } from '../../types';
import {
  MapPin,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Layers,
  Coins,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Scale
} from 'lucide-react';

interface PolicyAreaUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPolicy?: Policy | null;
  onPolicyUpdated?: (policy: Policy) => void;
}

export const PolicyAreaUpdateModal: React.FC<PolicyAreaUpdateModalProps> = ({
  isOpen,
  onClose,
  initialPolicy,
  onPolicyUpdated
}) => {
  const { states, selectedState, allDistricts, userProfile } = useApp();

  const [availablePolicies, setAvailablePolicies] = useState<Policy[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('');
  const [targetStateCode, setTargetStateCode] = useState<string>('IN-UP');
  const [targetDistrictCode, setTargetDistrictCode] = useState<string>('UP-AMT');
  const [targetYear, setTargetYear] = useState<number>(2028);
  const [regionalBudgetCr, setRegionalBudgetCr] = useState<string>('480');
  const [targetAgriPct, setTargetAgriPct] = useState<string>('65.0');
  const [targetReclaimHa, setTargetReclaimHa] = useState<string>('8500');
  const [priorityTier, setPriorityTier] = useState<'Critical Focus' | 'Active Monitoring' | 'Routine Sustenance'>('Critical Focus');
  const [directives, setDirectives] = useState<string[]>([
    'Enforce zero net loss of double-cropped agricultural land to speculative development.',
    'Fast-track subsidy disbursement for micro-irrigation systems in canal tail-ends.',
    'Reclaim 8,500 hectares of sodic wasteland through gypsum treatment and dhaincha green manuring.'
  ]);
  const [newDirective, setNewDirective] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [updatedResult, setUpdatedResult] = useState<Policy | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      api.getPolicies().then((pols) => {
        setAvailablePolicies(pols || []);
        if (initialPolicy) {
          setSelectedPolicyId(initialPolicy.id);
        } else if (pols && pols.length > 0 && !selectedPolicyId) {
          setSelectedPolicyId(pols[0].id);
        }
      });
      if (selectedState) setTargetStateCode(selectedState);
    }
  }, [isOpen, initialPolicy, selectedState]);

  // Load existing area target if policy already has one for this state
  useEffect(() => {
    if (selectedPolicyId && availablePolicies.length > 0) {
      const pol = availablePolicies.find(p => p.id === selectedPolicyId);
      if (pol && pol.area_targets && pol.area_targets.length > 0) {
        const existing = pol.area_targets.find(at => at.state_code === targetStateCode);
        if (existing) {
          if (existing.regional_budget_cr) setRegionalBudgetCr(String(existing.regional_budget_cr));
          if (existing.target_agricultural_pct) setTargetAgriPct(String(existing.target_agricultural_pct));
          if (existing.target_reclaim_ha) setTargetReclaimHa(String(existing.target_reclaim_ha));
          if (existing.priority_tier) setPriorityTier(existing.priority_tier);
          if (existing.directives && existing.directives.length > 0) setDirectives(existing.directives);
          if (existing.notes) setNotes(existing.notes);
          if (existing.district_code) setTargetDistrictCode(existing.district_code);
        }
      }
    }
  }, [selectedPolicyId, targetStateCode, availablePolicies]);

  if (!isOpen) return null;

  const currentPolicy = availablePolicies.find(p => p.id === selectedPolicyId);
  const currentStateObj = states.find(s => s.state_code === targetStateCode) || states[0];
  const stateDistricts = allDistricts.filter(d => d.state_code === targetStateCode);
  const currentDistrictObj = stateDistricts.find(d => d.district_code === targetDistrictCode);

  const handleAddDirective = () => {
    if (newDirective.trim()) {
      setDirectives([...directives, newDirective.trim()]);
      setNewDirective('');
    }
  };

  const handleRemoveDirective = (index: number) => {
    setDirectives(directives.filter((_, i) => i !== index));
  };

  const handleApplyDistrictPreset = (districtName: string) => {
    if (districtName.toLowerCase().includes('amethi') || districtName.toLowerCase().includes('gauriganj')) {
      setRegionalBudgetCr('520');
      setTargetAgriPct('66.0');
      setTargetReclaimHa('9200');
      setPriorityTier('Critical Focus');
      setDirectives([
        'Mandatory geofencing for all agricultural parcels in Gauriganj & Tiloi tehsils.',
        'Targeted gypsum application for 9,200 ha of sodic soil reclamation across Amethi.',
        'Zero-encroachment buffer around traditional talabs and seasonal wetlands.'
      ]);
      setNotes('Calibrated against official MoA&FW Nine-Fold statistics (2005–2025 series) for Amethi district.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolicyId) {
      setErrorMsg('Please select a policy to update.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');

      const areaTargetPayload: AreaTarget = {
        state_code: targetStateCode,
        state_name: currentStateObj?.state_name || 'Uttar Pradesh',
        district_code: targetDistrictCode !== 'ALL' ? targetDistrictCode : undefined,
        district_name: targetDistrictCode !== 'ALL' ? currentDistrictObj?.district_name || 'Amethi' : 'All Districts',
        target_year: Number(targetYear) || 2028,
        regional_budget_cr: regionalBudgetCr ? Number(regionalBudgetCr) : 450,
        target_agricultural_pct: targetAgriPct ? Number(targetAgriPct) : 65.0,
        target_reclaim_ha: targetReclaimHa ? Number(targetReclaimHa) : 8000,
        priority_tier: priorityTier,
        directives,
        notes: notes || `Area-specific directives updated by Policy Maker for ${currentDistrictObj?.district_name || 'State'}`,
        updated_by: userProfile?.name || 'Policy Maker',
        last_updated: new Date().toISOString()
      };

      const result = await api.updatePolicyArea(selectedPolicyId, areaTargetPayload);
      if (result) {
        setUpdatedResult(result);
        setSuccess(true);
        if (onPolicyUpdated) onPolicyUpdated(result);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update policy for the targeted area');
    } finally {
      setSaving(false);
    }
  };

  const resetModal = () => {
    setSuccess(false);
    setUpdatedResult(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-left">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Update Policy by Geographic Area</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-brand-100 dark:bg-brand-950/60 text-brand-800 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-800">
                  Area Configurator
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Calibrate statutory targets, regional budgets, and priority directives for specific states and districts.
              </p>
            </div>
          </div>
          <button
            onClick={resetModal}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {success && updatedResult ? (
            <div className="py-6 text-center space-y-5 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Area Targets & Directives Applied!
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Policy <strong>{updatedResult.name}</strong> is now officially customized for{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {targetDistrictCode !== 'ALL' ? `${currentDistrictObj?.district_name}, ` : ''}{currentStateObj?.state_name}
                  </span>.
                </p>
              </div>

              {/* Area Summary Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                    {updatedResult.acronym} • Area Amendment
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {priorityTier} Priority
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Target Horizon</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{targetYear}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Regional Budget</span>
                    <span className="text-sm font-black text-amber-600 dark:text-amber-400">₹{regionalBudgetCr} Cr</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Agri Preservation</span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{targetAgriPct}%</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Reclaim Sodic</span>
                    <span className="text-sm font-black text-blue-600 dark:text-blue-400">{Number(targetReclaimHa).toLocaleString()} ha</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold text-[11px] block mb-1">Active Directives ({directives.length}):</span>
                  <ul className="space-y-1 text-[11px]">
                    {directives.map((dir, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                        <span>{dir}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-3">
                <button
                  onClick={resetModal}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 shadow-md transition-all"
                >
                  Return to Policy Dashboard
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Policy Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Policy to Calibrate / Amend *
                </label>
                <select
                  value={selectedPolicyId}
                  onChange={(e) => setSelectedPolicyId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                >
                  {availablePolicies.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.acronym}] {p.name} ({p.ministry})
                    </option>
                  ))}
                </select>
                {currentPolicy && (
                  <p className="text-[11px] text-slate-500 mt-1 italic line-clamp-1">
                    {currentPolicy.description}
                  </p>
                )}
              </div>

              {/* Area Scope Selector */}
              <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200/80 dark:border-brand-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-800 dark:text-brand-300">
                    <MapPin className="w-4 h-4" />
                    <span>Target Geographic Area</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetStateCode('IN-UP');
                      setTargetDistrictCode('UP-AMT');
                      handleApplyDistrictPreset('Amethi');
                    }}
                    className="text-[10px] font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 underline cursor-pointer"
                  >
                    Quick Fill: Amethi (Gauriganj)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">
                      State / UT *
                    </label>
                    <select
                      value={targetStateCode}
                      onChange={(e) => {
                        setTargetStateCode(e.target.value);
                        const firstDist = allDistricts.find(d => d.state_code === e.target.value);
                        setTargetDistrictCode(firstDist ? firstDist.district_code : 'ALL');
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      required
                    >
                      {states.map(s => (
                        <option key={s.state_code} value={s.state_code}>
                          {s.state_name} ({s.region} Region)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">
                      District Jurisdiction
                    </label>
                    <select
                      value={targetDistrictCode}
                      onChange={(e) => {
                        setTargetDistrictCode(e.target.value);
                        const dist = stateDistricts.find(d => d.district_code === e.target.value);
                        if (dist) handleApplyDistrictPreset(dist.district_name);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="ALL">Entire State (All Districts)</option>
                      {stateDistricts.map(d => (
                        <option key={d.district_code} value={d.district_code}>
                          {d.district_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Area Target Numbers */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Calibrate Area Specific Targets
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Regional Budget (₹ Cr)
                    </label>
                    <input
                      type="number"
                      value={regionalBudgetCr}
                      onChange={(e) => setRegionalBudgetCr(e.target.value)}
                      placeholder="480"
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Target Year
                    </label>
                    <select
                      value={targetYear}
                      onChange={(e) => setTargetYear(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value={2026}>2026</option>
                      <option value={2028}>2028</option>
                      <option value={2030}>2030</option>
                      <option value={2035}>2035</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Agri Preservation %
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={targetAgriPct}
                      onChange={(e) => setTargetAgriPct(e.target.value)}
                      placeholder="65.0"
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Reclaim Sodic (ha)
                    </label>
                    <input
                      type="number"
                      value={targetReclaimHa}
                      onChange={(e) => setTargetReclaimHa(e.target.value)}
                      placeholder="8500"
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Priority Tier in Area
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Critical Focus', 'Active Monitoring', 'Routine Sustenance'] as const).map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setPriorityTier(tier)}
                        className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                          priorityTier === tier
                            ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Area Enforcement Directives */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Area Enforcement Directives & Guidelines
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {directives.length} active directives
                  </span>
                </div>

                <div className="space-y-1.5 mb-2">
                  {directives.map((dir, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <span className="line-clamp-2 flex-1">• {dir}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDirective(idx)}
                        className="text-slate-400 hover:text-rose-500 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDirective}
                    onChange={(e) => setNewDirective(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDirective();
                      }
                    }}
                    placeholder="Add area-specific statutory guideline and press Enter..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddDirective}
                    className="px-3.5 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Justification / Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Policy Maker Justification & Ground Observations
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Aligned with Grounded Statistical Engine data showing 1.2% annual sodic land reclamation feasibility..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={resetModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !selectedPolicyId}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Applying Area Directives...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="w-4 h-4" />
                      <span>Save & Apply Area Target</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
