import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  DashboardConfig,
  DashboardKPICard,
  DashboardInsightItem,
  DashboardPublicationItem,
  DashboardPolicyExperiment,
  DashboardUpcomingEvent,
  DashboardBannerSlide
} from '../../types';
import {
  X,
  Save,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  Sliders,
  TrendingUp,
  FileText,
  Shield,
  Calendar,
  Layers,
  Sparkles,
  Database,
  Users,
  MapPin,
  RotateCcw
} from 'lucide-react';

interface DashboardEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DashboardEditorModal: React.FC<DashboardEditorModalProps> = ({ isOpen, onClose }) => {
  const {
    dashboardConfig,
    saveDashboardConfig,
    resetDashboardToBaseline,
    updateDashboardKPI,
    updateDashboardInsight,
    addDashboardInsight,
    deleteDashboardInsight,
    updateDashboardPublication,
    addDashboardPublication,
    deleteDashboardPublication,
    updatePolicyExperiment,
    addPolicyExperiment,
    deletePolicyExperiment,
    updateUpcomingEvent,
    addUpcomingEvent,
    deleteUpcomingEvent,
    updateBannerSlide
  } = useApp();

  const [activeTab, setActiveTab] = useState<'kpi' | 'insights' | 'publications' | 'experiments' | 'events' | 'carousel'>('kpi');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New item states
  const [newInsight, setNewInsight] = useState({ metric: '+15%', description: '', icon: 'TrendingUp' });
  const [newPublication, setNewPublication] = useState({ title: '', author: 'ICAR & NRSC', year: '2025' });
  const [newExperiment, setNewExperiment] = useState({ title: '', state: 'Uttar Pradesh', duration: '6 months', status: 'Ongoing' });
  const [newEvent, setNewEvent] = useState({ title: '', date: '20 Oct 2025', location: 'New Delhi' });

  if (!isOpen) return null;

  const handleAddInsight = () => {
    if (!newInsight.metric || !newInsight.description) return;
    addDashboardInsight(newInsight);
    setNewInsight({ metric: '', description: '', icon: 'TrendingUp' });
  };

  const handleAddPublication = () => {
    if (!newPublication.title || !newPublication.author) return;
    addDashboardPublication(newPublication);
    setNewPublication({ title: '', author: '', year: '2025' });
  };

  const handleAddExperiment = () => {
    if (!newExperiment.title) return;
    addPolicyExperiment(newExperiment);
    setNewExperiment({ title: '', state: 'Uttar Pradesh', duration: '6 months', status: 'Ongoing' });
  };

  const handleAddEvent = () => {
    if (!newEvent.title) return;
    addUpcomingEvent(newEvent);
    setNewEvent({ title: '', date: '', location: '' });
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await saveDashboardConfig();
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
      }, 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Reset entire dashboard to official Government baseline values?')) {
      await resetDashboardToBaseline();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-left flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Inspection Super-User Directorate
                </span>
                <span className="text-xs text-slate-400">UID: BHU-RES-8763-9201</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                Dashboard Master Control Console
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl border border-red-500/40 text-red-300 hover:bg-red-500/20 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Baseline</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex overflow-x-auto gap-2 py-2">
          {[
            { id: 'kpi', label: '5 Primary KPIs', icon: Database },
            { id: 'insights', label: 'Key Insights', icon: TrendingUp },
            { id: 'publications', label: 'Research Publications', icon: FileText },
            { id: 'experiments', label: 'Policy Experiments', icon: Shield },
            { id: 'events', label: 'Upcoming Events', icon: Calendar },
            { id: 'carousel', label: 'Banner Carousel', icon: Sparkles }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: 5 PRIMARY KPIS */}
          {activeTab === 'kpi' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Primary Overview KPI Cards
                  </h3>
                  <p className="text-xs text-slate-500">
                    Edit the displayed count and department subtitle for each of the 5 top dashboard indicators.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Datasets */}
                <div className="p-4 rounded-2xl bg-[#eef8f2] dark:bg-emerald-950/20 border border-[#d2edd9] dark:border-emerald-900/40 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                    <Database className="w-4 h-4 text-emerald-700" />
                    <span>Datasets Count</span>
                  </div>
                  <input
                    type="text"
                    value={dashboardConfig.kpiCards.datasets.count}
                    onChange={e => updateDashboardKPI('datasets', e.target.value, dashboardConfig.kpiCards.datasets.subtitle)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white text-base"
                    placeholder="12,450"
                  />
                  <input
                    type="text"
                    value={dashboardConfig.kpiCards.datasets.subtitle}
                    onChange={e => updateDashboardKPI('datasets', dashboardConfig.kpiCards.datasets.count, e.target.value)}
                    className="w-full px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300"
                    placeholder="From 35+ Departments"
                  />
                </div>

                {/* Research */}
                <div className="p-4 rounded-2xl bg-[#eef5fc] dark:bg-blue-950/20 border border-[#d2e4f7] dark:border-blue-900/40 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                    <FileText className="w-4 h-4 text-blue-700" />
                    <span>Research Publications</span>
                  </div>
                  <input
                    type="text"
                    value={dashboardConfig.kpiCards.research.count}
                    onChange={e => updateDashboardKPI('research', e.target.value, dashboardConfig.kpiCards.research.subtitle)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white text-base"
                    placeholder="3,250"
                  />
                  <input
                    type="text"
                    value={dashboardConfig.kpiCards.research.subtitle}
                    onChange={e => updateDashboardKPI('research', dashboardConfig.kpiCards.research.count, e.target.value)}
                    className="w-full px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300"
                    placeholder="Across 500+ Institutions"
                  />
                </div>

                {/* Policies */}
                <div className="p-4 rounded-2xl bg-[#fdf2ec] dark:bg-orange-950/20 border border-[#fae0d1] dark:border-orange-900/40 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                    <Shield className="w-4 h-4 text-orange-700" />
                    <span>Policy Documents</span>
                  </div>
                  <input
                    type="text"
                    value={dashboardConfig.kpiCards.policies.count}
                    onChange={e => updateDashboardKPI('policies', e.target.value, dashboardConfig.kpiCards.policies.subtitle)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white text-base"
                    placeholder="1,200"
                  />
                  <input
                    type="text"
                    value={dashboardConfig.kpiCards.policies.subtitle}
                    onChange={e => updateDashboardKPI('policies', dashboardConfig.kpiCards.policies.count, e.target.value)}
                    className="w-full px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300"
                    placeholder="Central & State"
                  />
                </div>

                {/* Geospatial Layers */}
                <div className="p-4 rounded-2xl bg-[#f6effa] dark:bg-purple-950/20 border border-[#edd9f6] dark:border-purple-900/40 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                    <Layers className="w-4 h-4 text-purple-700" />
                    <span>Geospatial Layers</span>
                  </div>
                  <input
                    type="text"
                    value={dashboardConfig.kpiCards.layers.count}
                    onChange={e => updateDashboardKPI('layers', e.target.value, dashboardConfig.kpiCards.layers.subtitle)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white text-base"
                    placeholder="8,700"
                  />
                  <input
                    type="text"
                    value={dashboardConfig.kpiCards.layers.subtitle}
                    onChange={e => updateDashboardKPI('layers', dashboardConfig.kpiCards.layers.count, e.target.value)}
                    className="w-full px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300"
                    placeholder="Nationwide Coverage"
                  />
                </div>

                {/* Registered Users */}
                <div className="p-4 rounded-2xl bg-[#eefaf6] dark:bg-teal-950/20 border border-[#cff2e6] dark:border-teal-900/40 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                    <Users className="w-4 h-4 text-teal-700" />
                    <span>Registered Users</span>
                  </div>
                  <input
                    type="text"
                    value={dashboardConfig.kpiCards.users.count}
                    onChange={e => updateDashboardKPI('users', e.target.value, dashboardConfig.kpiCards.users.subtitle)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white text-base"
                    placeholder="2,450"
                  />
                  <input
                    type="text"
                    value={dashboardConfig.kpiCards.users.subtitle}
                    onChange={e => updateDashboardKPI('users', dashboardConfig.kpiCards.users.count, e.target.value)}
                    className="w-full px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300"
                    placeholder="Researchers | Policymakers"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KEY INSIGHTS */}
          {activeTab === 'insights' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Key Insights Metrics
                  </h3>
                  <p className="text-xs text-slate-500">
                    Modify headline statistics displayed in the middle column of the home dashboard.
                  </p>
                </div>
              </div>

              {/* Add New Insight Row */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Metric (e.g. +18%)"
                  value={newInsight.metric}
                  onChange={e => setNewInsight({ ...newInsight, metric: e.target.value })}
                  className="w-32 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold"
                />
                <input
                  type="text"
                  placeholder="Description (e.g. Digital cadastral records certified in 2026)"
                  value={newInsight.description}
                  onChange={e => setNewInsight({ ...newInsight, description: e.target.value })}
                  className="flex-1 min-w-[220px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddInsight}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Insight</span>
                </button>
              </div>

              {/* Existing List */}
              <div className="space-y-2.5">
                {dashboardConfig.keyInsights.map(item => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4"
                  >
                    <input
                      type="text"
                      value={item.metric}
                      onChange={e => updateDashboardInsight(item.id, { metric: e.target.value })}
                      className="w-28 font-extrabold text-base text-emerald-600 dark:text-emerald-400 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-emerald-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={item.description}
                      onChange={e => updateDashboardInsight(item.id, { description: e.target.value })}
                      className="flex-1 text-xs text-slate-800 dark:text-slate-200 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      onClick={() => deleteDashboardInsight(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: RESEARCH PUBLICATIONS */}
          {activeTab === 'publications' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Recent Research Publications List
                </h3>
                <p className="text-xs text-slate-500">
                  Curate what appears in the Recent Research card on the dashboard.
                </p>
              </div>

              {/* Add New Publication Row */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Paper Title"
                  value={newPublication.title}
                  onChange={e => setNewPublication({ ...newPublication, title: e.target.value })}
                  className="flex-1 min-w-[240px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold"
                />
                <input
                  type="text"
                  placeholder="Author / Institution"
                  value={newPublication.author}
                  onChange={e => setNewPublication({ ...newPublication, author: e.target.value })}
                  className="w-44 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                />
                <input
                  type="text"
                  placeholder="Year"
                  value={newPublication.year}
                  onChange={e => setNewPublication({ ...newPublication, year: e.target.value })}
                  className="w-20 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-center"
                />
                <button
                  type="button"
                  onClick={handleAddPublication}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Paper</span>
                </button>
              </div>

              {/* Existing List */}
              <div className="space-y-2.5">
                {dashboardConfig.recentPublications.map(item => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 space-y-1">
                      <input
                        type="text"
                        value={item.title}
                        onChange={e => updateDashboardPublication(item.id, { title: e.target.value })}
                        className="w-full font-bold text-xs text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-emerald-500 focus:outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.author}
                          onChange={e => updateDashboardPublication(item.id, { author: e.target.value })}
                          className="w-48 text-[11px] text-slate-500 dark:text-slate-400 bg-transparent border-b border-dashed border-slate-200 dark:border-slate-700 focus:outline-none"
                        />
                        <span className="text-slate-400">•</span>
                        <input
                          type="text"
                          value={item.year}
                          onChange={e => updateDashboardPublication(item.id, { year: e.target.value })}
                          className="w-16 text-[11px] text-slate-500 dark:text-slate-400 bg-transparent border-b border-dashed border-slate-200 dark:border-slate-700 text-center focus:outline-none"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => deleteDashboardPublication(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: POLICY EXPERIMENTS */}
          {activeTab === 'experiments' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Ongoing Policy Experiments
                </h3>
                <p className="text-xs text-slate-500">
                  Update active pilot tests and state policy reform monitors.
                </p>
              </div>

              {/* Add New Experiment Row */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Experiment Title"
                  value={newExperiment.title}
                  onChange={e => setNewExperiment({ ...newExperiment, title: e.target.value })}
                  className="flex-1 min-w-[220px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={newExperiment.state}
                  onChange={e => setNewExperiment({ ...newExperiment, state: e.target.value })}
                  className="w-36 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                />
                <input
                  type="text"
                  placeholder="Duration"
                  value={newExperiment.duration}
                  onChange={e => setNewExperiment({ ...newExperiment, duration: e.target.value })}
                  className="w-28 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                />
                <select
                  value={newExperiment.status}
                  onChange={e => setNewExperiment({ ...newExperiment, status: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="Ongoing">Ongoing</option>
                  <option value="Evaluation">Evaluation</option>
                  <option value="Planning">Planning</option>
                  <option value="Completed">Completed</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddExperiment}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>

              {/* Existing List */}
              <div className="space-y-2.5">
                {dashboardConfig.policyExperiments.map(item => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 space-y-1">
                      <input
                        type="text"
                        value={item.title}
                        onChange={e => updatePolicyExperiment(item.id, { title: e.target.value })}
                        className="w-full font-bold text-xs text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 focus:outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.state}
                          onChange={e => updatePolicyExperiment(item.id, { state: e.target.value })}
                          className="w-32 text-[11px] text-slate-500 bg-transparent border-b border-dashed border-slate-200 dark:border-slate-700 focus:outline-none"
                        />
                        <span className="text-slate-400">•</span>
                        <input
                          type="text"
                          value={item.duration}
                          onChange={e => updatePolicyExperiment(item.id, { duration: e.target.value })}
                          className="w-24 text-[11px] text-slate-500 bg-transparent border-b border-dashed border-slate-200 dark:border-slate-700 focus:outline-none"
                        />
                        <span className="text-slate-400">•</span>
                        <input
                          type="text"
                          value={item.status}
                          onChange={e => updatePolicyExperiment(item.id, { status: e.target.value })}
                          className="w-24 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-transparent border-b border-dashed border-slate-200 dark:border-slate-700 focus:outline-none"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => deletePolicyExperiment(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: UPCOMING EVENTS */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Upcoming National Events
                </h3>
                <p className="text-xs text-slate-500">
                  Update summits, conferences, and geospatial workshops.
                </p>
              </div>

              {/* Add New Event Row */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Event Title"
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="flex-1 min-w-[220px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold"
                />
                <input
                  type="text"
                  placeholder="Date (e.g. 15 Oct 2025)"
                  value={newEvent.date}
                  onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="w-40 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                />
                <input
                  type="text"
                  placeholder="Location (e.g. New Delhi)"
                  value={newEvent.location}
                  onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="w-36 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddEvent}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Event</span>
                </button>
              </div>

              {/* Existing List */}
              <div className="space-y-2.5">
                {dashboardConfig.upcomingEvents.map(item => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 space-y-1">
                      <input
                        type="text"
                        value={item.title}
                        onChange={e => updateUpcomingEvent(item.id, { title: e.target.value })}
                        className="w-full font-bold text-xs text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 focus:outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.date}
                          onChange={e => updateUpcomingEvent(item.id, { date: e.target.value })}
                          className="w-36 text-[11px] text-slate-500 bg-transparent border-b border-dashed border-slate-200 dark:border-slate-700 focus:outline-none"
                        />
                        <span className="text-slate-400">•</span>
                        <input
                          type="text"
                          value={item.location}
                          onChange={e => updateUpcomingEvent(item.id, { location: e.target.value })}
                          className="w-36 text-[11px] text-slate-500 bg-transparent border-b border-dashed border-slate-200 dark:border-slate-700 focus:outline-none"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => deleteUpcomingEvent(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: BANNER CAROUSEL */}
          {activeTab === 'carousel' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Panoramic Carousel Slides
                </h3>
                <p className="text-xs text-slate-500">
                  Customize the quotes, headlines, and directives on the 5 hero banners.
                </p>
              </div>

              <div className="space-y-4">
                {(dashboardConfig.bannerSlides || []).map((slide, idx) => (
                  <div
                    key={slide.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                        Slide {idx + 1}: {slide.badge}
                      </span>
                      <input
                        type="text"
                        value={slide.badge}
                        onChange={e => updateBannerSlide(slide.id, { badge: e.target.value })}
                        className="px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600 text-[10px] font-bold"
                        placeholder="Badge Label"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Headline</label>
                        <input
                          type="text"
                          value={slide.headline}
                          onChange={e => updateBannerSlide(slide.id, { headline: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Highlight Line</label>
                        <input
                          type="text"
                          value={slide.highlight}
                          onChange={e => updateBannerSlide(slide.id, { highlight: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Subtitle</label>
                      <input
                        type="text"
                        value={slide.subtitle}
                        onChange={e => updateBannerSlide(slide.id, { subtitle: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Quote</label>
                        <input
                          type="text"
                          value={slide.quote}
                          onChange={e => updateBannerSlide(slide.id, { quote: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs italic"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Author Attribution</label>
                        <input
                          type="text"
                          value={slide.author}
                          onChange={e => updateBannerSlide(slide.id, { author: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Inspector Authority: <strong>Active</strong></span>
            <span>•</span>
            <span>Auto-saving live to local state & database</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Done
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Syncing Ledger...</span>
                </>
              ) : savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>All Data Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Commit All Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
