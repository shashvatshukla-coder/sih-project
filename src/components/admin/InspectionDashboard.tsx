import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { MASTER_ADMIN_EMAIL } from '../../lib/firebase';
import {
  UserRegistryRecord,
  InspectionStats,
  Policy,
  ResearchPaper,
  UserRole
} from '../../types';
import {
  ShieldCheck,
  Users,
  Scale,
  GraduationCap,
  Shield,
  Eye,
  EyeOff,
  Star,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Upload,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Award,
  Sparkles,
  Layers,
  Lock,
  Unlock,
  Sliders,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Edit2,
  Save,
  RotateCcw
} from 'lucide-react';
import { DashboardEditorModal } from '../dashboard/DashboardEditorModal';
import { LandRecordEditorModal } from '../dashboard/LandRecordEditorModal';

const ALL_SYSTEM_FEATURES = [
  { id: 'research_authoring', label: 'Research Authoring', desc: 'Create papers & upload research documents' },
  { id: 'policy_formulation', label: 'Policy Formulation', desc: 'Draft national & regional policy acts' },
  { id: 'area_targets', label: 'Area Target Calibration', desc: 'Update state & district cadastral targets' },
  { id: 'gazette_ingest', label: 'Gazette Document Ingestion', desc: 'Drag-and-drop policy document parser' },
  { id: 'dataset_upload', label: 'Dataset Ingestion Pipeline', desc: 'Upload CSV/Excel spatial files' },
  { id: 'audit_logs', label: 'Audit Log Access', desc: 'Inspect platform operation history' },
  { id: 'curation_veto', label: 'Directorate Curation Veto', desc: 'Star, verify, prioritize, or hide content' }
];

export const InspectionDashboard: React.FC = () => {
  const {
    userProfile,
    userRole,
    setUserRole,
    setActivePage,
    isMasterUser,
    isInspectionAuthorized,
    dashboardConfig,
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
    resetDashboardToBaseline
  } = useApp();

  // State
  const [stats, setStats] = useState<InspectionStats | null>(null);
  const [users, setUsers] = useState<UserRegistryRecord[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [researchList, setResearchList] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [isDashboardEditorOpen, setIsDashboardEditorOpen] = useState(false);
  const [isLandRecordEditorOpen, setIsLandRecordEditorOpen] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'dashboard_data' | 'users' | 'policies' | 'research' | 'create_policy' | 'create_research'>('overview');

  // Filters & Search
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [policySearch, setPolicySearch] = useState('');
  const [researchSearch, setResearchSearch] = useState('');

  // Forms for direct creation
  const [newPolicy, setNewPolicy] = useState({
    name: '',
    acronym: '',
    ministry: 'Ministry of Agriculture & Farmers Welfare / DoLR',
    launch_year: new Date().getFullYear(),
    description: '',
    target_region: 'Pan-India',
    allocated_budget_cr: 1200,
    state_code: 'IN-UP',
    state_name: 'Uttar Pradesh',
    district_name: 'Amethi',
    target_agricultural_pct: 68.5
  });

  const [newResearch, setNewResearch] = useState({
    title: '',
    authors: 'Chief Inspection Ombudsman, Dr. S. Shukla',
    geography: 'Pan-India / Uttar Pradesh',
    journal: 'National Land Records & Inspection Journal',
    abstract: '',
    tags: 'Land Use, Inspection Audit, Cadastral Governance'
  });

  // Load all inspection data
  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, policiesData, researchData] = await Promise.all([
        api.getInspectionStats(),
        api.getRegisteredUsers(),
        api.getPolicies(undefined, undefined, true),
        api.getResearchPapers(undefined, undefined, true)
      ]);

      setStats(statsData);
      setUsers(usersData);
      setPolicies(policiesData);
      setResearchList(researchData);
    } catch (err: any) {
      console.error('Failed to load inspection data:', err);
      showMessage(err?.message || 'Failed to load inspection directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // User Actions
  const handleRoleChange = async (userId: string, newRole: any) => {
    try {
      const updated = await api.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? updated : u));
      showMessage(`User role updated to ${newRole}`);
      api.getInspectionStats().then(setStats);
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  const handleToggleFeature = async (user: UserRegistryRecord, featureId: string) => {
    const currentFeatures = user.features_granted || [];
    const hasFeature = currentFeatures.includes(featureId);
    const updatedFeatures = hasFeature
      ? currentFeatures.filter(f => f !== featureId)
      : [...currentFeatures, featureId];

    try {
      const updated = await api.updateUserFeatures(user.id, updatedFeatures);
      setUsers(prev => prev.map(u => u.id === user.id ? updated : u));
      showMessage(`Updated permissions for ${user.name}`);
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  const handleToggleUserStar = async (user: UserRegistryRecord) => {
    try {
      const updated = await api.starVerifyUser(user.id, {
        is_starred: !user.is_starred
      });
      setUsers(prev => prev.map(u => u.id === user.id ? updated : u));
      showMessage(`${user.name} ${!user.is_starred ? 'starred as distinguished member' : 'unstarred'}`);
      api.getInspectionStats().then(setStats);
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  const handleToggleUserVerify = async (user: UserRegistryRecord) => {
    try {
      const updated = await api.starVerifyUser(user.id, {
        is_inspection_verified: !user.is_inspection_verified
      });
      setUsers(prev => prev.map(u => u.id === user.id ? updated : u));
      showMessage(`${user.name} ${!user.is_inspection_verified ? 'verified by Inspection Directorate' : 'verification revoked'}`);
      api.getInspectionStats().then(setStats);
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to deregister ${userName} from the platform registry?`)) return;
    try {
      await api.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      showMessage(`Deregistered user ${userName}`);
      api.getInspectionStats().then(setStats);
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  // Policy Moderation Actions
  const handleTogglePolicyStar = async (policy: Policy) => {
    try {
      const updated = await api.inspectPolicy(policy.id, {
        is_starred: !policy.is_starred
      });
      setPolicies(prev => prev.map(p => p.id === policy.id ? updated : p));
      showMessage(`Policy "${policy.name}" ${!policy.is_starred ? 'starred' : 'unstarred'}`);
      api.getInspectionStats().then(setStats);
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  const handleTogglePolicyVerify = async (policy: Policy) => {
    try {
      const updated = await api.inspectPolicy(policy.id, {
        is_inspection_verified: !policy.is_inspection_verified
      });
      setPolicies(prev => prev.map(p => p.id === policy.id ? updated : p));
      showMessage(`Policy "${policy.name}" ${!policy.is_inspection_verified ? 'verified' : 'unverified'}`);
      api.getInspectionStats().then(setStats);
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  const handleTogglePolicyVisibility = async (policy: Policy) => {
    try {
      const updated = await api.inspectPolicy(policy.id, {
        is_hidden: !policy.is_hidden
      });
      setPolicies(prev => prev.map(p => p.id === policy.id ? updated : p));
      showMessage(`Policy "${policy.name}" is now ${!policy.is_hidden ? 'HIDDEN from public views' : 'VISIBLE on public views'}`);
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  const handleMovePolicy = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= policies.length) return;

    const newOrder = [...policies];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);

    setPolicies(newOrder);
    try {
      await api.reorderPolicies(newOrder.map(p => p.id));
      showMessage(`Moved "${moved.name}" ${direction}`);
    } catch (err: any) {
      showMessage('Failed to persist order', 'error');
      loadData();
    }
  };

  const handleDeletePolicy = async (policyId: string, policyName: string) => {
    if (!confirm(`Are you sure you want to permanently delete policy "${policyName}"?`)) return;
    try {
      await api.deletePolicy(policyId);
      setPolicies(prev => prev.filter(p => p.id !== policyId));
      showMessage(`Deleted policy "${policyName}"`);
      api.getInspectionStats().then(setStats);
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  // Research Moderation Actions
  const handleToggleResearchStar = async (paper: ResearchPaper) => {
    try {
      const updated = await api.inspectResearch(paper.id, {
        is_starred: !paper.is_starred
      });
      setResearchList(prev => prev.map(r => r.id === paper.id ? updated : r));
      showMessage(`Research "${paper.title}" ${!paper.is_starred ? 'starred' : 'unstarred'}`);
      api.getInspectionStats().then(setStats);
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  const handleToggleResearchVerify = async (paper: ResearchPaper) => {
    try {
      const updated = await api.inspectResearch(paper.id, {
        is_inspection_verified: !paper.is_inspection_verified
      });
      setResearchList(prev => prev.map(r => r.id === paper.id ? updated : r));
      showMessage(`Research "${paper.title}" ${!paper.is_inspection_verified ? 'marked Inspection-Verified' : 'unverified'}`);
      api.getInspectionStats().then(setStats);
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  const handleToggleResearchVisibility = async (paper: ResearchPaper) => {
    try {
      const updated = await api.inspectResearch(paper.id, {
        is_hidden: !paper.is_hidden
      });
      setResearchList(prev => prev.map(r => r.id === paper.id ? updated : r));
      showMessage(`Research "${paper.title}" is now ${!paper.is_hidden ? 'HIDDEN from public views' : 'VISIBLE on public views'}`);
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  const handleMoveResearch = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= researchList.length) return;

    const newOrder = [...researchList];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);

    setResearchList(newOrder);
    try {
      await api.reorderResearch(newOrder.map(r => r.id));
      showMessage(`Moved "${moved.title}" ${direction}`);
    } catch (err: any) {
      showMessage('Failed to persist order', 'error');
      loadData();
    }
  };

  const handleDeleteResearch = async (paperId: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete research paper "${title}"?`)) return;
    try {
      await api.deleteResearch(paperId);
      setResearchList(prev => prev.filter(r => r.id !== paperId));
      showMessage(`Deleted research paper "${title}"`);
      api.getInspectionStats().then(setStats);
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  // Direct Creation Handlers
  const handleCreatePolicySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPolicy.name || !newPolicy.description) {
      showMessage('Policy name and description are required', 'error');
      return;
    }

    try {
      const areaTargets = [{
        state_code: newPolicy.state_code,
        state_name: newPolicy.state_name,
        district_name: newPolicy.district_name,
        target_year: 2028,
        regional_budget_cr: newPolicy.allocated_budget_cr,
        target_agricultural_pct: newPolicy.target_agricultural_pct,
        priority_tier: 'Critical Focus' as const,
        directives: [
          `Enforce geo-referenced cadastral parcel surveys across ${newPolicy.district_name || newPolicy.state_name}.`,
          `Prevent unauthorized commercial diversion of prime agricultural parcels.`
        ],
        last_updated: new Date().toISOString(),
        updated_by: 'Inspection Directorate'
      }];

      const created = await api.createPolicy({
        name: newPolicy.name,
        acronym: newPolicy.acronym || newPolicy.name.substring(0, 6).toUpperCase(),
        ministry: newPolicy.ministry,
        launch_year: Number(newPolicy.launch_year),
        description: newPolicy.description,
        target_region: newPolicy.target_region,
        allocated_budget_cr: Number(newPolicy.allocated_budget_cr),
        area_targets: areaTargets,
        is_inspection_verified: true,
        is_starred: true,
        priority_order: 1
      });

      showMessage(`Policy "${created.name}" formulated and verified by Inspection!`);
      setPolicies(prev => [created, ...prev]);
      setActiveTab('policies');
      api.getInspectionStats().then(setStats);
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  const handleCreateResearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResearch.title || !newResearch.abstract) {
      showMessage('Research title and abstract are required', 'error');
      return;
    }

    try {
      const created = await api.createResearchPaper({
        title: newResearch.title,
        authors: newResearch.authors.split(',').map(a => a.trim()),
        geography: newResearch.geography,
        journal: newResearch.journal,
        abstract: newResearch.abstract,
        tags: newResearch.tags.split(',').map(t => t.trim()),
        year: new Date().getFullYear(),
        is_inspection_verified: true,
        is_starred: true,
        priority_order: 1,
        dedicatedResearcherId: 'INSPECT-OMBUDS-01'
      });

      showMessage(`Research "${created.title}" published and certified!`);
      setResearchList(prev => [created, ...prev]);
      setActiveTab('research');
      api.getInspectionStats().then(setStats);
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  };

  // Filtered lists
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.dedicatedFixedId.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredPolicies = policies.filter(p =>
    p.name.toLowerCase().includes(policySearch.toLowerCase()) ||
    p.acronym.toLowerCase().includes(policySearch.toLowerCase()) ||
    p.description.toLowerCase().includes(policySearch.toLowerCase())
  );

  const filteredResearch = researchList.filter(r =>
    r.title.toLowerCase().includes(researchSearch.toLowerCase()) ||
    r.authors.some(a => a.toLowerCase().includes(researchSearch.toLowerCase())) ||
    r.abstract.toLowerCase().includes(researchSearch.toLowerCase())
  );

  if (!isInspectionAuthorized) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-lg">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Inspection Directorate Access Restricted
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Inspection Directorate controls require Inspector clearance or Master Account authorization ({MASTER_ADMIN_EMAIL}).
          </p>
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 text-left space-y-1">
            <p><strong>Current Session:</strong> {userProfile?.name} ({userProfile?.email})</p>
            <p><strong>Active Role:</strong> {userRole.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => setUserRole('inspector')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Switch to Inspector Role</span>
          </button>
          <button
            onClick={() => setActivePage('dashboard')}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left pb-16">
      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between shadow-md transition-all ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold">{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs font-bold px-2 py-0.5 rounded hover:bg-black/5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Directorate Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 border border-slate-800 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Directorate of Inspection & Ombudsman
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                Level 5 Supreme Clearance
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              National Inspection & Oversight Dashboard
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Autonomous oversight authority empowered to audit registrations, calibrate user powers, certify distinguished researchers, moderate national policy directives, reorder showcase rankings, and publish verified cadastral research.
            </p>
          </div>

          {/* Quick Perspective Switcher */}
          <div className="shrink-0 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md space-y-2.5 min-w-[240px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Omnibus View Access
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                onClick={() => {
                  setUserRole('researcher');
                  setActivePage('research');
                }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all flex items-center gap-1.5 justify-center"
                title="Launch Researcher Studio"
              >
                <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Researcher</span>
              </button>
              <button
                onClick={() => {
                  setUserRole('policymaker');
                  setActivePage('policy');
                }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all flex items-center gap-1.5 justify-center"
                title="Launch Policy Maker Lab"
              >
                <Scale className="w-3.5 h-3.5 text-blue-400" />
                <span>Policy Maker</span>
              </button>
              <button
                onClick={() => {
                  setUserRole('admin');
                  setActivePage('admin');
                }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all flex items-center gap-1.5 justify-center"
                title="Launch Admin Ingestion Pipeline"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Hub</span>
              </button>
              <button
                onClick={() => {
                  setUserRole('public');
                  setActivePage('dashboard');
                }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all flex items-center gap-1.5 justify-center"
                title="Launch Public Analytics Portal"
              >
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>Public Portal</span>
              </button>
            </div>
            <button
              onClick={loadData}
              className="w-full py-1.5 rounded-lg bg-indigo-600/60 hover:bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Directorate Telemetry</span>
            </button>
          </div>
        </div>
      </div>

      {/* REGISTRATION CENSUS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Users</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {stats?.total_registered ?? users.length}
          </p>
          <span className="text-[10px] text-slate-500">Full system registry</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Researchers</span>
            <GraduationCap className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
            {stats?.researcher_count ?? users.filter(u => u.role === 'researcher').length}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">
            {stats?.verified_researchers_count ?? 3} Verified by Inspection
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Policy Makers</span>
            <Scale className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-700 dark:text-blue-400">
            {stats?.policymaker_count ?? users.filter(u => u.role === 'policymaker').length}
          </p>
          <span className="text-[10px] text-slate-500">Decision authorities</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Administrators</span>
            <Shield className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-400">
            {stats?.administrator_count ?? users.filter(u => u.role === 'admin').length}
          </p>
          <span className="text-[10px] text-slate-500">Ingest engineers</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Public Users</span>
            <Eye className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-700 dark:text-purple-400">
            {stats?.public_count ?? users.filter(u => u.role === 'public').length}
          </p>
          <span className="text-[10px] text-slate-500">Open data citizens</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Inspectors</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-700 dark:text-indigo-400">
            {stats?.inspector_count ?? 2}
          </p>
          <span className="text-[10px] text-slate-500">Ombudsman council</span>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Control Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('dashboard_data')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'dashboard_data'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Dashboard Data & Cadastral Control</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User Registry & Powers ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('policies')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'policies'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Policy Directorate ({policies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('research')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'research'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Research Directorate ({researchList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('create_policy')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'create_policy'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Formulate Policy Directive</span>
        </button>

        <button
          onClick={() => setActiveTab('create_research')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'create_research'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>+ Author / Upload Research</span>
        </button>
      </div>

      {/* TAB 1: CONTROL OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Policy Moderation</span>
                <Scale className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {policies.length} <span className="text-xs font-normal text-slate-500">total acts</span>
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Inspection Verified:</span>
                  <span className="font-bold text-emerald-600">{policies.filter(p => p.is_inspection_verified).length}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Starred Spotlight:</span>
                  <span className="font-bold text-amber-500">{policies.filter(p => p.is_starred).length}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Hidden from Public:</span>
                  <span className="font-bold text-rose-500">{policies.filter(p => p.is_hidden).length}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('policies')}
                className="w-full mt-2 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs hover:bg-blue-100 flex items-center justify-center gap-1.5"
              >
                <span>Moderate Policy Repository</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Research Publications</span>
                <GraduationCap className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {researchList.length} <span className="text-xs font-normal text-slate-500">published papers</span>
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Certified Papers:</span>
                  <span className="font-bold text-emerald-600">{researchList.filter(r => r.is_inspection_verified).length}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Starred Papers:</span>
                  <span className="font-bold text-amber-500">{researchList.filter(r => r.is_starred).length}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Hidden from Public:</span>
                  <span className="font-bold text-rose-500">{researchList.filter(r => r.is_hidden).length}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('research')}
                className="w-full mt-2 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100 flex items-center justify-center gap-1.5"
              >
                <span>Moderate Research Library</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">User Rights & Power</span>
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {users.length} <span className="text-xs font-normal text-slate-500">accounts</span>
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Verified Researchers:</span>
                  <span className="font-bold text-emerald-600">{users.filter(u => u.is_inspection_verified).length}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Starred Members:</span>
                  <span className="font-bold text-amber-500">{users.filter(u => u.is_starred).length}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Full Permissions Granted:</span>
                  <span className="font-bold text-indigo-600">{users.filter(u => (u.features_granted?.length || 0) >= 5).length}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('users')}
                className="w-full mt-2 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-100 flex items-center justify-center gap-1.5"
              >
                <span>Grant & Calibrate Powers</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Guidance Box */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-slate-900 dark:text-white">
                Directorate Power Hierarchy & Live Synchronization
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Any change made in the Inspection Directorate (reordering priority, starring, verifying, hiding, or changing user powers) immediately takes effect across the entire Bharat LandNet platform. The public portal, researcher library, and policy dashboards automatically respect your priority order and moderation status.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER REGISTRY & POWER CONTROL */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Search registered user by name, email, or Dedicated UID..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={userRoleFilter}
                onChange={e => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none font-semibold"
              >
                <option value="all">All Roles ({users.length})</option>
                <option value="researcher">Researchers Only</option>
                <option value="policymaker">Policy Makers Only</option>
                <option value="admin">Administrators Only</option>
                <option value="public">Public Users Only</option>
                <option value="inspector">Inspectors Only</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredUsers.map((user) => {
              const currentFeatures = user.features_granted || [];

              return (
                <div
                  key={user.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all space-y-3"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* User Profile Info */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <img
                        src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {user.name}
                          </h3>
                          {user.is_starred && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              Starred Member
                            </span>
                          )}
                          {user.is_inspection_verified && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Inspection Verified
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                            UID: {user.dedicatedFixedId}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Registered: {new Date(user.registeredAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Role Selector & Direct Actions */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-slate-500">Role:</span>
                        <select
                          value={user.role}
                          onChange={e => handleRoleChange(user.id, e.target.value)}
                          className={`px-2.5 py-1.5 text-xs font-bold rounded-xl border focus:outline-none ${
                            user.role === 'researcher'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                              : user.role === 'policymaker'
                              ? 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                              : user.role === 'admin'
                              ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                              : user.role === 'inspector'
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800'
                              : 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                          }`}
                        >
                          <option value="researcher">Researcher</option>
                          <option value="policymaker">Policy Maker</option>
                          <option value="admin">Administrator</option>
                          <option value="public">Public User</option>
                          <option value="inspector">Inspection Directorate</option>
                        </select>
                      </div>

                      {/* Star Toggle */}
                      <button
                        onClick={() => handleToggleUserStar(user)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                          user.is_starred
                            ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-amber-50'
                        }`}
                        title="Toggle Star / Spotlight on Researcher"
                      >
                        <Star className={`w-3.5 h-3.5 ${user.is_starred ? 'fill-white' : ''}`} />
                        <span>{user.is_starred ? 'Starred' : 'Star'}</span>
                      </button>

                      {/* Inspection Verification Stamp */}
                      <button
                        onClick={() => handleToggleUserVerify(user)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                          user.is_inspection_verified
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50'
                        }`}
                        title="Certify with Inspection Directorate Stamp"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{user.is_inspection_verified ? 'Verified' : 'Verify'}</span>
                      </button>

                      {/* Delete User */}
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 transition-all"
                        title="Deregister User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Feature & Power Control Matrix */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Granted System Powers & Feature Privileges:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_SYSTEM_FEATURES.map((feature) => {
                        const isGranted = currentFeatures.includes(feature.id);
                        return (
                          <button
                            key={feature.id}
                            onClick={() => handleToggleFeature(user, feature.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 transition-all ${
                              isGranted
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/50 dark:border-indigo-700 dark:text-indigo-300'
                                : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-500 hover:text-slate-700'
                            }`}
                            title={feature.desc}
                          >
                            {isGranted ? <Lock className="w-3 h-3 text-indigo-600" /> : <Unlock className="w-3 h-3" />}
                            <span>{feature.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: POLICY DIRECTORATE & MODERATION */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={policySearch}
                onChange={e => setPolicySearch(e.target.value)}
                placeholder="Filter policies by acronym, name, or targeted zone..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('create_policy')}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Formulate New Directive</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredPolicies.map((policy, index) => {
              return (
                <div
                  key={policy.id}
                  className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all space-y-3 ${
                    policy.is_hidden
                      ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 opacity-85'
                      : 'border-slate-200 dark:border-slate-800 shadow-2xs hover:border-blue-300'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Rank, Acronym & Info */}
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Priority Rank Indicator */}
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-xs text-slate-700 dark:text-slate-200 shrink-0">
                        #{index + 1}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-blue-700 dark:text-blue-400 font-mono text-xs">
                            {policy.acronym}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {policy.name}
                          </h3>
                          {policy.is_starred && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              Starred Directive
                            </span>
                          )}
                          {policy.is_inspection_verified && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Inspection Verified
                            </span>
                          )}
                          {policy.is_hidden && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-0.5">
                              <EyeOff className="w-3 h-3" />
                              Hidden from Public
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">{policy.description}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span>Ministry: {policy.ministry}</span>
                          <span>Launch: {policy.launch_year}</span>
                          <span>Region: {policy.target_region}</span>
                          {policy.area_targets && policy.area_targets.length > 0 && (
                            <span className="font-semibold text-indigo-600">
                              Targets: {policy.area_targets.map(at => `${at.state_name || at.state_code}`).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Moderation Controls: Up / Down / Star / Verify / Hide / Delete */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Reorder Buttons (Move Up / Down) */}
                      <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        <button
                          onClick={() => handleMovePolicy(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 disabled:opacity-30"
                          title="Move to Top / Increase Priority"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <span className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                        <button
                          onClick={() => handleMovePolicy(index, 'down')}
                          disabled={index === filteredPolicies.length - 1}
                          className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 disabled:opacity-30"
                          title="Move to Bottom / Lower Priority"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Star Policy */}
                      <button
                        onClick={() => handleTogglePolicyStar(policy)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                          policy.is_starred
                            ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-amber-50'
                        }`}
                        title="Star / Highlight policy in repository"
                      >
                        <Star className={`w-3.5 h-3.5 ${policy.is_starred ? 'fill-white' : ''}`} />
                        <span>{policy.is_starred ? 'Starred' : 'Star'}</span>
                      </button>

                      {/* Verify Policy */}
                      <button
                        onClick={() => handleTogglePolicyVerify(policy)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                          policy.is_inspection_verified
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50'
                        }`}
                        title="Inspection Verification Stamp"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{policy.is_inspection_verified ? 'Verified' : 'Verify'}</span>
                      </button>

                      {/* Hide / Show from Public Dashboard */}
                      <button
                        onClick={() => handleTogglePolicyVisibility(policy)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                          policy.is_hidden
                            ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-rose-50'
                        }`}
                        title={policy.is_hidden ? 'Show on Public Dashboard' : 'Hide from Public Dashboard'}
                      >
                        {policy.is_hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{policy.is_hidden ? 'Hidden' : 'Hide'}</span>
                      </button>

                      {/* Delete Policy */}
                      <button
                        onClick={() => handleDeletePolicy(policy.id, policy.name)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 transition-all"
                        title="Permanently Delete Policy"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: RESEARCH DIRECTORATE & MODERATION */}
      {activeTab === 'research' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={researchSearch}
                onChange={e => setResearchSearch(e.target.value)}
                placeholder="Filter research publications by title, author, or keywords..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('create_research')}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Author / Ingest Research</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredResearch.map((paper, index) => {
              return (
                <div
                  key={paper.id}
                  className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all space-y-3 ${
                    paper.is_hidden
                      ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 opacity-85'
                      : 'border-slate-200 dark:border-slate-800 shadow-2xs hover:border-emerald-300'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Rank & Paper Info */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-xs text-slate-700 dark:text-slate-200 shrink-0">
                        #{index + 1}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {paper.title}
                          </h3>
                          {paper.is_starred && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              Editor's Choice
                            </span>
                          )}
                          {paper.is_inspection_verified && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Inspection Verified
                            </span>
                          )}
                          {paper.is_hidden && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-0.5">
                              <EyeOff className="w-3 h-3" />
                              Hidden from Public
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">{paper.abstract}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {paper.authors.join(', ')}
                          </span>
                          <span>Year: {paper.year}</span>
                          <span>Region: {paper.geography}</span>
                          {paper.dedicatedResearcherId && (
                            <span className="font-mono text-emerald-600 dark:text-emerald-400">
                              UID: {paper.dedicatedResearcherId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Moderation Controls */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Move Up / Down */}
                      <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        <button
                          onClick={() => handleMoveResearch(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-600 disabled:opacity-30"
                          title="Move to Top"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <span className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                        <button
                          onClick={() => handleMoveResearch(index, 'down')}
                          disabled={index === filteredResearch.length - 1}
                          className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-600 disabled:opacity-30"
                          title="Move to Bottom"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Star Research */}
                      <button
                        onClick={() => handleToggleResearchStar(paper)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                          paper.is_starred
                            ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-amber-50'
                        }`}
                        title="Star / Feature in Research Library"
                      >
                        <Star className={`w-3.5 h-3.5 ${paper.is_starred ? 'fill-white' : ''}`} />
                        <span>{paper.is_starred ? 'Starred' : 'Star'}</span>
                      </button>

                      {/* Verify Research */}
                      <button
                        onClick={() => handleToggleResearchVerify(paper)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                          paper.is_inspection_verified
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50'
                        }`}
                        title="Certify paper with Inspection Stamp"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{paper.is_inspection_verified ? 'Verified' : 'Verify'}</span>
                      </button>

                      {/* Hide / Show */}
                      <button
                        onClick={() => handleToggleResearchVisibility(paper)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                          paper.is_hidden
                            ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-rose-50'
                        }`}
                        title={paper.is_hidden ? 'Show on Public Library' : 'Hide from Public Library'}
                      >
                        {paper.is_hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{paper.is_hidden ? 'Hidden' : 'Hide'}</span>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteResearch(paper.id, paper.title)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 transition-all"
                        title="Permanently Delete Research Paper"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: FORMULATE POLICY DIRECTIVE */}
      {activeTab === 'create_policy' && (
        <div className="max-w-3xl mx-auto p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span>Inspection Directorate: Formulate & Enact Policy Directive</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Directly promulgate a new national or regional land policy. Policies created by the Inspection Directorate automatically receive priority ranking and verified certification.
            </p>
          </div>

          <form onSubmit={handleCreatePolicySubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Policy Name *
                </label>
                <input
                  type="text"
                  required
                  value={newPolicy.name}
                  onChange={e => setNewPolicy(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. National Cadastral Preservation & Sodic Soil Reclamation Act"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Acronym (Short Code)
                </label>
                <input
                  type="text"
                  value={newPolicy.acronym}
                  onChange={e => setNewPolicy(prev => ({ ...prev, acronym: e.target.value.toUpperCase() }))}
                  placeholder="e.g. NCPSRA-2026"
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Policy Description & Directives *
              </label>
              <textarea
                required
                rows={3}
                value={newPolicy.description}
                onChange={e => setNewPolicy(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Comprehensive statutory policy directives and cadastral spatial mandate..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ministry / Directorate
                </label>
                <input
                  type="text"
                  value={newPolicy.ministry}
                  onChange={e => setNewPolicy(prev => ({ ...prev, ministry: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Launch Year
                </label>
                <input
                  type="number"
                  value={newPolicy.launch_year}
                  onChange={e => setNewPolicy(prev => ({ ...prev, launch_year: Number(e.target.value) }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Allocated Budget (₹ Cr)
                </label>
                <input
                  type="number"
                  value={newPolicy.allocated_budget_cr}
                  onChange={e => setNewPolicy(prev => ({ ...prev, allocated_budget_cr: Number(e.target.value) }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none font-bold"
                />
              </div>
            </div>

            {/* Targeted Area & Cadastral Calibrations */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
                Target Regional Focus & Cadastral Calibrations
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Target State
                  </label>
                  <select
                    value={newPolicy.state_code}
                    onChange={e => {
                      const code = e.target.value;
                      const name = code === 'IN-UP' ? 'Uttar Pradesh' : code === 'IN-BR' ? 'Bihar' : code === 'IN-MP' ? 'Madhya Pradesh' : 'Maharashtra';
                      setNewPolicy(prev => ({ ...prev, state_code: code, state_name: name }));
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                  >
                    <option value="IN-UP">Uttar Pradesh (IN-UP)</option>
                    <option value="IN-BR">Bihar (IN-BR)</option>
                    <option value="IN-MP">Madhya Pradesh (IN-MP)</option>
                    <option value="IN-MH">Maharashtra (IN-MH)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    District Focus
                  </label>
                  <input
                    type="text"
                    value={newPolicy.district_name}
                    onChange={e => setNewPolicy(prev => ({ ...prev, district_name: e.target.value }))}
                    placeholder="e.g. Amethi / Gauriganj"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Target Agricultural Land %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newPolicy.target_agricultural_pct}
                    onChange={e => setNewPolicy(prev => ({ ...prev, target_agricultural_pct: Number(e.target.value) }))}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none font-bold text-emerald-600"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('policies')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Enact & Verify Directive</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 6: AUTHOR / UPLOAD RESEARCH */}
      {activeTab === 'create_research' && (
        <div className="max-w-3xl mx-auto p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
              <span>Inspection Directorate: Author & Certify Cadastral Research</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Directly publish institutional research, whitepapers, or audit findings into the National Research Knowledge Repository.
            </p>
          </div>

          <form onSubmit={handleCreateResearchSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Research Paper Title *
              </label>
              <input
                type="text"
                required
                value={newResearch.title}
                onChange={e => setNewResearch(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Longitudinal Cadastral Survey & Sodic Soil Reclamation in the Gangetic Basin (2005–2025)"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Authors (Comma-separated)
                </label>
                <input
                  type="text"
                  value={newResearch.authors}
                  onChange={e => setNewResearch(prev => ({ ...prev, authors: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Study Geography / Area
                </label>
                <input
                  type="text"
                  value={newResearch.geography}
                  onChange={e => setNewResearch(prev => ({ ...prev, geography: e.target.value }))}
                  placeholder="e.g. Uttar Pradesh, Amethi & Sultanpur Districts"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Research Abstract & Findings *
              </label>
              <textarea
                required
                rows={4}
                value={newResearch.abstract}
                onChange={e => setNewResearch(prev => ({ ...prev, abstract: e.target.value }))}
                placeholder="Detailed executive abstract covering methodology, remote sensing cross-validation, and empirical policy impact..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Publishing Journal / Archive
                </label>
                <input
                  type="text"
                  value={newResearch.journal}
                  onChange={e => setNewResearch(prev => ({ ...prev, journal: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tags & Cadastral Categories
                </label>
                <input
                  type="text"
                  value={newResearch.tags}
                  onChange={e => setNewResearch(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="e.g. Cadastral Maps, Soil Health, Sodic Lands"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('research')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Publish & Certify Research</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 7: MASTER DASHBOARD DATA & CADASTRAL CONTROL */}
      {activeTab === 'dashboard_data' && (
        <div className="space-y-6">
          {/* Header & Quick Action Launcher */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-950 via-slate-900 to-teal-950 border border-teal-500/40 shadow-xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500 text-teal-950 font-black text-[10px] tracking-wider uppercase">
                  MASTER DATA DIRECTORATE
                </span>
                <span className="text-xs text-teal-300 font-mono">
                  Universal Override Active
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
                Dashboard Metrics & Cadastral Configuration
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                As the Inspection Ombudsman, you can change every data point on the executive portal — including national KPI figures, key insights, showcase publications, policy experiments, and cadastral land use percentages.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => setIsDashboardEditorOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all border border-teal-400/40"
              >
                <Sliders className="w-4 h-4" />
                <span>Launch Full Editor Modal</span>
              </button>

              <button
                onClick={() => setIsLandRecordEditorOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all border border-emerald-500/40"
              >
                <Layers className="w-4 h-4" />
                <span>Calibrate Cadastral Data</span>
              </button>

              <button
                onClick={async () => {
                  if (confirm('Revert all dashboard metrics to Government baseline standards?')) {
                    await resetDashboardToBaseline();
                    showMessage('All dashboard metrics reverted to Government baseline values!');
                  }
                }}
                className="px-3 py-2 rounded-xl bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Baseline</span>
              </button>
            </div>
          </div>

          {/* KPI Cards Configuration Section */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Primary KPI Metric Cards
                </h3>
                <p className="text-xs text-slate-500">
                  Directly edit the 5 main numerical values and subtitles featured on the home dashboard.
                </p>
              </div>
              <button
                onClick={() => setActivePage('dashboard')}
                className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1"
              >
                <span>Preview on Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {(['datasets', 'research', 'policies', 'layers', 'users'] as const).map((key) => {
                const card = dashboardConfig.kpiCards[key];
                return (
                  <div key={key} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {card.label}
                    </span>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Value</label>
                      <input
                        type="text"
                        defaultValue={card.count}
                        onBlur={(e) => {
                          updateDashboardKPI(key, e.target.value, card.subtitle);
                          showMessage(`Updated ${card.label} metric!`);
                        }}
                        className="w-full px-2.5 py-1.5 text-base font-black rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Subtitle / Subtext</label>
                      <input
                        type="text"
                        defaultValue={card.subtitle}
                        onBlur={(e) => {
                          updateDashboardKPI(key, card.count, e.target.value);
                          showMessage(`Updated ${card.label} subtitle!`);
                        }}
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Insights & Recent Publications Dual Column */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Insights */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Key Insights ({dashboardConfig.keyInsights.length})
                  </h3>
                  <p className="text-xs text-slate-500">Live statistics column on Executive Dashboard.</p>
                </div>
                <button
                  onClick={() => {
                    const metric = prompt('Enter metric value (e.g. +15%):');
                    const desc = prompt('Enter description text:');
                    if (metric && desc) {
                      addDashboardInsight({ metric, description: desc, icon: 'TrendingUp' });
                      showMessage('Added new Key Insight!');
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Insight</span>
                </button>
              </div>

              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {dashboardConfig.keyInsights.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <input
                        type="text"
                        defaultValue={item.metric}
                        onBlur={(e) => updateDashboardInsight(item.id, { metric: e.target.value })}
                        className="font-black text-sm text-teal-700 dark:text-teal-400 bg-transparent border-b border-dashed border-teal-400 focus:outline-none w-24"
                      />
                      <input
                        type="text"
                        defaultValue={item.description}
                        onBlur={(e) => updateDashboardInsight(item.id, { description: e.target.value })}
                        className="text-xs text-slate-700 dark:text-slate-300 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 focus:outline-none w-full block mt-1"
                      />
                    </div>
                    <button
                      onClick={() => {
                        deleteDashboardInsight(item.id);
                        showMessage('Removed Key Insight');
                      }}
                      className="text-slate-400 hover:text-red-500 p-1"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Showcase Research Publications */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Recent Research Publications ({dashboardConfig.recentPublications.length})
                  </h3>
                  <p className="text-xs text-slate-500">Showcased research highlights on Executive Dashboard.</p>
                </div>
                <button
                  onClick={() => {
                    const title = prompt('Enter Paper Title:');
                    const author = prompt('Enter Author / Institution:');
                    if (title) {
                      addDashboardPublication({ title, author: author || 'National Cadastral Directorate', year: '2025' });
                      showMessage('Added research publication!');
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Paper</span>
                </button>
              </div>

              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {dashboardConfig.recentPublications.map((pub) => (
                  <div key={pub.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <input
                        type="text"
                        defaultValue={pub.title}
                        onBlur={(e) => updateDashboardPublication(pub.id, { title: e.target.value })}
                        className="text-xs font-bold text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 focus:outline-none w-full block"
                      />
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                        <input
                          type="text"
                          defaultValue={pub.author}
                          onBlur={(e) => updateDashboardPublication(pub.id, { author: e.target.value })}
                          className="bg-transparent border-b border-dashed border-slate-300 focus:outline-none w-32"
                        />
                        <span>•</span>
                        <input
                          type="text"
                          defaultValue={pub.year}
                          onBlur={(e) => updateDashboardPublication(pub.id, { year: e.target.value })}
                          className="bg-transparent border-b border-dashed border-slate-300 focus:outline-none w-14"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        deleteDashboardPublication(pub.id);
                        showMessage('Removed publication');
                      }}
                      className="text-slate-400 hover:text-red-500 p-1"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INSPECTION MODALS */}
      <DashboardEditorModal
        isOpen={isDashboardEditorOpen}
        onClose={() => setIsDashboardEditorOpen(false)}
      />

      <LandRecordEditorModal
        isOpen={isLandRecordEditorOpen}
        onClose={() => setIsLandRecordEditorOpen(false)}
      />
    </div>
  );
};
