import React, { useState, useEffect, useRef } from 'react';
import { Policy, AreaTarget } from '../../types';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import {
  FileCheck2,
  ExternalLink,
  Sparkles,
  BookOpen,
  Layers,
  MapPin,
  UploadCloud,
  PlusCircle,
  FileEdit,
  Building2,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Coins,
  Scale,
  Calendar,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  FileText,
  Trash2,
  Award,
  Star
} from 'lucide-react';
import { PolicyUploadModal } from './PolicyUploadModal';
import { PolicyAreaUpdateModal } from './PolicyAreaUpdateModal';
import { ResearchUploadModal } from '../research/ResearchUploadModal';

export const PolicyRepository: React.FC = () => {
  const { states, selectedState, allDistricts, userProfile, dedicatedFixedId, setActivePage } = useApp();

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<string>(selectedState || 'IN-ALL');
  const [filterDistrict, setFilterDistrict] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [isPolicyUploadOpen, setIsPolicyUploadOpen] = useState(false);
  const [isAreaUpdateOpen, setIsAreaUpdateOpen] = useState(false);
  const [isResearchUploadOpen, setIsResearchUploadOpen] = useState(false);
  const [selectedPolicyForArea, setSelectedPolicyForArea] = useState<Policy | null>(null);

  // Drag-over container state
  const [isDraggingOverRepo, setIsDraggingOverRepo] = useState(false);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const data = await api.getPolicies(
        filterState !== 'IN-ALL' ? filterState : undefined,
        filterDistrict !== 'ALL' ? filterDistrict : undefined
      );
      setPolicies(data || []);
    } catch (err) {
      console.error('Failed to load policies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [filterState, filterDistrict]);

  // Handle repository-level drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverRepo(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverRepo(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverRepo(false);
    setIsPolicyUploadOpen(true);
  };

  const handlePolicyCreated = (newPol: Policy) => {
    setPolicies(prev => [newPol, ...prev]);
  };

  const handlePolicyUpdated = (updatedPol: Policy) => {
    setPolicies(prev => prev.map(p => p.id === updatedPol.id ? updatedPol : p));
  };

  const handleOpenAreaModal = (policy?: Policy) => {
    setSelectedPolicyForArea(policy || null);
    setIsAreaUpdateOpen(true);
  };

  // Filter policies in memory
  const filteredPolicies = policies.filter(p => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchAcr = p.acronym.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchMin = p.ministry.toLowerCase().includes(q);
      const matchDirectives = p.objectives.some(o => o.toLowerCase().includes(q)) ||
        p.area_targets?.some(at => at.directives.some(d => d.toLowerCase().includes(q)));
      return matchName || matchAcr || matchDesc || matchMin || matchDirectives;
    }
    return true;
  });

  const availableDistrictsForFilter = allDistricts.filter(d => filterState === 'IN-ALL' || d.state_code === filterState);

  return (
    <div
      ref={dropzoneRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`space-y-6 text-left transition-all ${
        isDraggingOverRepo ? 'ring-4 ring-amber-500/50 rounded-3xl p-2 bg-amber-500/5' : ''
      }`}
    >
      {/* Policy Upload Modal (Drag & Drop) */}
      <PolicyUploadModal
        isOpen={isPolicyUploadOpen}
        onClose={() => setIsPolicyUploadOpen(false)}
        onPolicyCreated={handlePolicyCreated}
      />

      {/* Area Update Modal */}
      <PolicyAreaUpdateModal
        isOpen={isAreaUpdateOpen}
        onClose={() => setIsAreaUpdateOpen(false)}
        initialPolicy={selectedPolicyForArea}
        onPolicyUpdated={handlePolicyUpdated}
      />

      {/* Research Paper Upload Modal */}
      <ResearchUploadModal
        isOpen={isResearchUploadOpen}
        onClose={() => setIsResearchUploadOpen(false)}
        onPaperCreated={() => setActivePage('research')}
      />

      {/* Drag & Drop Overlay Visual Cue when hovering */}
      {isDraggingOverRepo && (
        <div className="fixed inset-0 z-50 pointer-events-none bg-amber-900/40 backdrop-blur-xs flex items-center justify-center animate-fade-in">
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-500 shadow-2xl text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center mx-auto animate-bounce">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Drop Gazette Document or Policy File Here
            </h3>
            <p className="text-xs text-slate-500">
              Release to parse directives and configure area jurisdictions automatically.
            </p>
          </div>
        </div>
      )}

      {/* Policy Maker Master Command Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-brand-500/10 to-slate-900/10 dark:from-amber-950/30 dark:via-brand-950/20 dark:to-slate-900/40 border border-amber-500/20 dark:border-amber-700/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {userProfile?.name || 'Policy Maker & Executive Officer'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-amber-600" />
                Policy Maker Portal
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              <span>Executive ID:</span>
              <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                {dedicatedFixedId || 'BHU-POL-8763-9201'}
              </span>
              <span>•</span>
              <span className="text-slate-600 dark:text-slate-400">
                Central Directorate of Land Records & Cadastral Policy
              </span>
            </div>
          </div>
        </div>

        {/* Policy Maker Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Upload Policy with Drag & Drop */}
          <button
            onClick={() => setIsPolicyUploadOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            title="Upload official gazette notification or policy document with drag-and-drop"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Policy / Gazette</span>
          </button>

          {/* 2. Update Policy by Area */}
          <button
            onClick={() => handleOpenAreaModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            title="Configure regional budget, statutory targets, and local directives on the basis of area"
          >
            <MapPin className="w-4 h-4" />
            <span>Update Policy by Area</span>
          </button>

          {/* 3. Write Research for Policy Makers */}
          <button
            onClick={() => setActivePage('research')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-xs transition-all cursor-pointer"
            title="Draft evidence-based policy research, executive memos, and whitepapers"
          >
            <FileEdit className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Write Research</span>
          </button>

          {/* 4. Upload Research */}
          <button
            onClick={() => setIsResearchUploadOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title="Upload research papers or departmental studies"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Upload Research</span>
          </button>
        </div>
      </div>

      {/* Main Repository Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
            <FileCheck2 className="w-4 h-4" />
            <span>National Land Policy & Scheme Repository</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Statutory Frameworks & Area-Calibrated Interventions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Manage central and state programs, ingest gazette circulars via drag-and-drop, and calibrate agricultural preservation and sodic reclamation targets on the basis of geographic area.
          </p>
        </div>

        {/* Quick Drag & Drop Ingestion Callout */}
        <div
          onClick={() => setIsPolicyUploadOpen(true)}
          className="p-3.5 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer flex items-center gap-3 text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-900 dark:text-white">
              Drag & Drop Policy Documents
            </span>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400">
              PDF, DOCX, or Cabinet Circulars
            </span>
          </div>
        </div>
      </div>

      {/* Area Filtering & Search Control Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search policies by scheme name, acronym, directives, or ministry..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Filter on basis of State */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-semibold hidden sm:inline">State:</span>
          </div>
          <select
            value={filterState}
            onChange={(e) => {
              setFilterState(e.target.value);
              setFilterDistrict('ALL');
            }}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
          >
            <option value="IN-ALL">All States / Pan-India</option>
            {states.map(s => (
              <option key={s.state_code} value={s.state_code}>
                {s.state_name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter on basis of District */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold hidden sm:inline">District:</span>
          </div>
          <select
            value={filterDistrict}
            onChange={(e) => setFilterDistrict(e.target.value)}
            disabled={filterState === 'IN-ALL'}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer disabled:opacity-50"
          >
            <option value="ALL">All Districts</option>
            {availableDistrictsForFilter.map(d => (
              <option key={d.district_code} value={d.district_code}>
                {d.district_name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Gazette Notified">Gazette Notified</option>
            <option value="Under Revision">Under Revision</option>
            <option value="Draft Amendment">Draft Amendment</option>
          </select>
        </div>
      </div>

      {/* Policies List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs">Loading area-calibrated policies...</p>
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No policies matched your current filters.
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You can upload a new policy or gazette notification, or clear your area filters.
            </p>
            <button
              onClick={() => setIsPolicyUploadOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700"
            >
              Upload New Policy
            </button>
          </div>
        ) : (
          filteredPolicies.map((policy) => {
            // Check if there is an active area target for this policy
            const activeAreaTarget = policy.current_area_target || (policy.area_targets && policy.area_targets.length > 0 ? policy.area_targets[0] : null);

            return (
              <div
                key={policy.id}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow space-y-4 text-xs"
              >
                {/* Policy Header Bar */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-[280px]">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {policy.acronym}
                      </span>

                      {policy.status && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          policy.status === 'Gazette Notified'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : policy.status === 'Under Revision'
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}>
                          {policy.status}
                        </span>
                      )}

                      {policy.is_user_modified && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                          Area Customized
                        </span>
                      )}

                      {policy.is_starred && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>Starred Directive</span>
                        </span>
                      )}

                      {policy.is_inspection_verified && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Inspection Verified</span>
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400 font-medium truncate">
                        {policy.ministry} • Launched {policy.launch_year}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {policy.name}
                    </h3>
                  </div>

                  {/* Actions for this Policy */}
                  <div className="flex items-center gap-2">
                    {/* Calibrate / Update for Area button */}
                    <button
                      onClick={() => handleOpenAreaModal(policy)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold transition-colors cursor-pointer"
                      title="Update and calibrate directives for specific geographic area"
                    >
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span>Calibrate for Area</span>
                    </button>

                    {/* Analyze Impact */}
                    <button
                      onClick={() => setActivePage('policy')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-xs transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Analyze Impact</span>
                    </button>
                  </div>
                </div>

                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {policy.description}
                </p>

                {/* Area Targets Card (if customized or defined) */}
                {activeAreaTarget && (
                  <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                        <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          Active Area Target: {activeAreaTarget.district_name ? `${activeAreaTarget.district_name}, ` : ''}{activeAreaTarget.state_name}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
                        {activeAreaTarget.priority_tier}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-slate-800">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">Target Horizon</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {activeAreaTarget.target_year || 2028}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-slate-800">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">Regional Budget</span>
                        <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                          ₹{activeAreaTarget.regional_budget_cr || policy.allocated_budget_cr || 450} Cr
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-slate-800">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">Agri Preservation</span>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          {activeAreaTarget.target_agricultural_pct || 66.0}%
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-slate-800">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">Sodic Reclamation</span>
                        <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                          {Number(activeAreaTarget.target_reclaim_ha || 8500).toLocaleString()} ha
                        </span>
                      </div>
                    </div>

                    {activeAreaTarget.directives && activeAreaTarget.directives.length > 0 && (
                      <div className="pt-2 border-t border-amber-200/50 dark:border-amber-900/40 text-[11px] space-y-1">
                        <span className="font-bold text-amber-900 dark:text-amber-200 block">
                          Area Specific Enforcement Directives:
                        </span>
                        <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                          {activeAreaTarget.directives.map((dir, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                              <span>{dir}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Base Mission Objectives */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                    Key Statutory Objectives
                  </span>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                    {policy.objectives.map((obj, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span>Target Scope: <strong>{policy.target_region}</strong></span>
                    {policy.fileAttachment && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{policy.fileAttachment.name} (Uploaded)</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <a
                      href={policy.documents_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold hover:underline"
                    >
                      <span>Official Guidelines / Gazette</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
