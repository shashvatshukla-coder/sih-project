import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DashboardEditorModal } from './DashboardEditorModal';
import { LandRecordEditorModal } from './LandRecordEditorModal';
import {
  Database,
  FileText,
  Shield,
  MapPin,
  Users,
  TrendingUp,
  Sprout,
  Target,
  BookOpen,
  Calendar,
  Lightbulb,
  ArrowRight,
  Plus,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Quote,
  Sliders,
  Edit2,
  Trash2,
  RotateCcw,
  Check,
  CheckCircle2,
  ShieldCheck,
  Save,
  Clock
} from 'lucide-react';

interface BannerSlide {
  id: string;
  image: string;
  badge: string;
  title: string;
  highlight: string;
  subtitle: string;
  quote: string;
  author: string;
}

const DEFAULT_BANNER_SLIDES: BannerSlide[] = [
  {
    id: 'slide-1',
    image: '/banners/slide1_rainbow.png',
    badge: 'Verified Data Only',
    title: 'Evidence First.',
    highlight: 'Decisions You Can Trace.',
    subtitle: 'Search approved sources, inspect calculations, and preserve a replayable evidence trail.',
    quote: 'Dashboard counts come only from connected production records.',
    author: 'BHU-DRISHTI data principle'
  },
  {
    id: 'slide-2',
    image: '/banners/slide2_earth_art.png',
    badge: 'Transparent Provenance',
    title: 'Source Linked.',
    highlight: 'Calculation Explained.',
    subtitle: 'Every displayed record keeps its dataset, year, geography, and source visible.',
    quote: 'No unsupported success metrics or projected values are shown as facts.',
    author: 'BHU-DRISHTI evidence policy'
  },
  {
    id: 'slide-3',
    image: '/banners/slide3_mother_nature.png',
    badge: 'Reviewable Evidence',
    title: 'Human Review.',
    highlight: 'Before Policy Action.',
    subtitle: 'Conflicts, missing sources, and incomplete records are surfaced for review instead of guessed.',
    quote: 'Empty states are more trustworthy than invented numbers.',
    author: 'BHU-DRISHTI review principle'
  },
  {
    id: 'slide-4',
    image: '/banners/slide4_space_earth.png',
    badge: 'Safe Integration',
    title: 'Read Only.',
    highlight: 'Sources Stay Authoritative.',
    subtitle: 'BHU-DRISHTI analyzes permitted data without changing external land records.',
    quote: 'Source systems remain authoritative; disputed evidence goes to human review.',
    author: 'BHU-DRISHTI governance principle'
  },
  {
    id: 'slide-5',
    image: '/banners/slide5_rainforest.png',
    badge: 'Explainable Analysis',
    title: 'Data First.',
    highlight: 'AI Explanation Second.',
    subtitle: 'Deterministic statistics are calculated before AI is used to explain the result.',
    quote: 'Evidence, calculation, and reasoning remain inspectable.',
    author: 'BHU-DRISHTI analysis principle'
  }
];

export const ExecutiveDashboard: React.FC = () => {
  const {
    states,
    selectedState,
    setSelectedState,
    selectedDistrict,
    selectedYear,
    currentRecord,
    setActivePage,
    isInspectionAuthorized,
    userProfile,
    dashboardConfig,
    isDashboardEditMode,
    setIsDashboardEditMode,
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

  const [selectedLayer, setSelectedLayer] = useState<string>('land-use');
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  // Inspection control modals
  const [isDashboardEditorOpen, setIsDashboardEditorOpen] = useState(false);
  const [isLandRecordEditorOpen, setIsLandRecordEditorOpen] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // In-line Quick Editing States for KPI Cards
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [cardCountInput, setCardCountInput] = useState('');
  const [cardSubtitleInput, setCardSubtitleInput] = useState('');

  // Quick Inline Add States
  const [isAddingInsight, setIsAddingInsight] = useState(false);
  const [newInsightMetric, setNewInsightMetric] = useState('');
  const [newInsightDesc, setNewInsightDesc] = useState('');

  const [isAddingPub, setIsAddingPub] = useState(false);
  const [newPubTitle, setNewPubTitle] = useState('');
  const [newPubAuthor, setNewPubAuthor] = useState('');

  const [isAddingExp, setIsAddingExp] = useState(false);
  const [newExpTitle, setNewExpTitle] = useState('');
  const [newExpState, setNewExpState] = useState('');

  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const canEditDashboardData = false;

  // Auto-advance slides continuously every 4.8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % DEFAULT_BANNER_SLIDES.length);
    }, 4800);
    return () => clearInterval(interval);
  }, []);

  // Compute active slides with custom inspection overrides
  const activeSlidesList = DEFAULT_BANNER_SLIDES.map(defaultSlide => {
    const override = dashboardConfig.bannerSlides?.find(s => s.id === defaultSlide.id);
    if (!override) return defaultSlide;
    return {
      ...defaultSlide,
      badge: override.badge || defaultSlide.badge,
      title: override.headline || defaultSlide.title,
      highlight: override.highlight || defaultSlide.highlight,
      subtitle: override.subtitle || defaultSlide.subtitle,
      quote: override.quote || defaultSlide.quote,
      author: override.author || defaultSlide.author
    };
  });

  const activeSlideData = activeSlidesList[currentSlide] || DEFAULT_BANNER_SLIDES[0];

  const triggerToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleStartEditingCard = (key: 'datasets' | 'research' | 'policies' | 'layers' | 'users', e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCard(key);
    setCardCountInput(dashboardConfig.kpiCards[key].count);
    setCardSubtitleInput(dashboardConfig.kpiCards[key].subtitle);
  };

  const handleSaveCard = (key: 'datasets' | 'research' | 'policies' | 'layers' | 'users', e: React.MouseEvent) => {
    e.stopPropagation();
    updateDashboardKPI(key, cardCountInput, cardSubtitleInput);
    setEditingCard(null);
    triggerToast(`Updated ${dashboardConfig.kpiCards[key].label} count!`);
  };

  const handleSaveNewInsight = () => {
    if (!newInsightMetric || !newInsightDesc) return;
    addDashboardInsight({
      metric: newInsightMetric,
      description: newInsightDesc,
      icon: 'TrendingUp'
    });
    setNewInsightMetric('');
    setNewInsightDesc('');
    setIsAddingInsight(false);
    triggerToast('Added new Key Insight!');
  };

  const handleSaveNewPub = () => {
    if (!newPubTitle) return;
    addDashboardPublication({
      title: newPubTitle,
      author: newPubAuthor || 'Author not provided',
      year: new Date().getFullYear().toString()
    });
    setNewPubTitle('');
    setNewPubAuthor('');
    setIsAddingPub(false);
    triggerToast('Added new Research Publication!');
  };

  const handleSaveNewExp = () => {
    if (!newExpTitle) return;
    addPolicyExperiment({
      title: newExpTitle,
      state: newExpState,
      duration: 'Not provided',
      status: 'Registered'
    });
    setNewExpTitle('');
    setIsAddingExp(false);
    triggerToast('Added new Policy Experiment!');
  };

  const handleSaveNewEvent = () => {
    if (!newEventTitle) return;
    addUpcomingEvent({
      title: newEventTitle,
      date: newEventDate || 'Date not provided',
      location: 'Location not provided'
    });
    setNewEventTitle('');
    setNewEventDate('');
    setIsAddingEvent(false);
    triggerToast('Added new National Event!');
  };

  // State cadastral figures
  const currentStateObj = states.find(s => s.state_code === selectedState);
  const hasVerifiedRecord = Boolean(currentRecord && !currentRecord.is_demo);
  const currentAgPct = hasVerifiedRecord ? currentRecord?.agricultural_pct ?? 0 : 0;
  const currentForestPct = hasVerifiedRecord ? currentRecord?.forest_pct ?? 0 : 0;
  const currentBuiltupPct = hasVerifiedRecord ? currentRecord?.builtup_pct ?? 0 : 0;
  const currentWaterPct = hasVerifiedRecord ? currentRecord?.waterbodies_pct ?? 0 : 0;
  const currentBarrenPct = hasVerifiedRecord ? currentRecord?.barren_pct ?? 0 : 0;
  const currentOtherPct = hasVerifiedRecord ? currentRecord?.other_pct ?? 0 : 0;
  const currentTotalHa = hasVerifiedRecord ? currentRecord?.total_area_ha ?? 0 : 0;

  return (
    <div className="space-y-6 text-left pb-10">
      {/* =========================================================================
          0. NOTIFICATION TOAST
      ========================================================================= */}
      {saveToast && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-4 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-900 text-white border border-emerald-500 shadow-2xl text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* =========================================================================
          0. INSPECTION DIRECTORATE MASTER CONTROL PANEL (For Inspection Role)
      ========================================================================= */}
      {canEditDashboardData && (
        <div className="p-4 md:p-5 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-2 border-emerald-500/50 shadow-xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 border border-emerald-400/50 flex items-center justify-center shrink-0 shadow-md">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500 text-emerald-950 font-mono shadow-sm">
                  INSPECTION DIRECTORATE MASTER CONTROL
                </span>
                <span className="text-[11px] font-mono text-emerald-300 font-bold">
                  {userProfile.name} • {userProfile.dedicatedFixedId}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                You have unrestricted administrative authority to inspect and edit <strong>all dashboard data</strong>, cadastral statistics, metrics, and policy modules.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            {/* Live Inline Edit Toggle */}
            <button
              onClick={() => setIsDashboardEditMode(!isDashboardEditMode)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
                isDashboardEditMode
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
              title="Toggle in-line editing controls on cards and sections"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isDashboardEditMode ? 'Live Edit Active' : 'Live In-line Edit'}</span>
            </button>

            {/* Comprehensive Dashboard Editor Modal */}
            <button
              onClick={() => setIsDashboardEditorOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 border border-emerald-400/40"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Full Dashboard Editor</span>
            </button>

            {/* Calibrate Cadastral Statistics */}
            <button
              onClick={() => setIsLandRecordEditorOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 border border-teal-500/40"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Calibrate Cadastral Data</span>
            </button>

            {/* Reset to Baseline */}
            <button
              onClick={async () => {
                if (confirm('Revert all dashboard metrics to Government baseline standards?')) {
                  await resetDashboardToBaseline();
                  triggerToast('Reverted dashboard to Government baseline values!');
                }
              }}
              className="px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
              title="Reset metrics to default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Baseline</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          1. ALIVE HERO PANORAMIC CAROUSEL WITH DYNAMIC THOUGHTS & ANIMATIONS
      ========================================================================= */}
      <div 
        className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-200/50 dark:border-slate-800 shadow-lg group min-h-[280px] md:min-h-[320px] flex items-center"
      >
        {/* Render all background images with vivid clarity, smooth opacity transitions & Ken Burns zoom */}
        {activeSlidesList.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Full-Vibrancy Background Image */}
            <div
              className={`absolute inset-0 bg-cover bg-center transition-transform duration-[7000ms] ease-out ${
                idx === currentSlide ? 'scale-110 brightness-105 contrast-105' : 'scale-100'
              }`}
              style={{ backgroundImage: `url('${slide.image}')` }}
            />
            {/* Vignette */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
          </div>
        ))}

        {/* Slide Content Layer */}
        <div className="relative z-10 p-6 md:p-8 w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Left Text Card - Frosted Glass Box */}
          <div className="max-w-xl text-left space-y-2 p-5 rounded-2xl bg-black/35 backdrop-blur-md border border-white/20 shadow-2xl relative">
            {canEditDashboardData && (
              <button
                onClick={() => setIsDashboardEditorOpen(true)}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1 transition-all"
                title="Edit Carousel Content"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit Slide</span>
              </button>
            )}

            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/30 backdrop-blur-md border border-emerald-300/50 text-emerald-200 text-[11px] font-extrabold tracking-wide uppercase shadow-sm">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-emerald-300" style={{ animationDuration: '6s' }} />
              <span>{activeSlideData.badge}</span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
              {activeSlideData.title}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 drop-shadow-sm">
                {activeSlideData.highlight}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs md:text-sm text-slate-100 font-medium leading-relaxed drop-shadow-xs">
              {activeSlideData.subtitle}
            </p>
          </div>

          {/* Right Government / Domain Thought Card */}
          <div className="p-5 md:p-6 rounded-2xl bg-black/45 backdrop-blur-md border border-white/25 text-white max-w-sm shrink-0 shadow-2xl relative text-left">
            <Quote className="w-6 h-6 text-emerald-400/80 absolute top-3 right-3" />
            <p className="text-xs md:text-sm font-medium italic leading-relaxed text-slate-100 pr-4 drop-shadow-xs">
              {activeSlideData.quote}
            </p>
            <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between">
              <p className="text-[11px] font-bold text-emerald-300 tracking-wide drop-shadow-xs">
                {activeSlideData.author}
              </p>
            </div>
          </div>
        </div>

        {/* Carousel Slide Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 shadow-md">
          {activeSlidesList.map((slide, idx) => (
            <div
              key={slide.id}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                idx === currentSlide
                  ? 'w-8 bg-emerald-400 shadow-sm shadow-emerald-400/80'
                  : 'w-1.5 bg-white/40'
              }`}
            />
          ))}

          <span className="text-[9px] text-emerald-300 font-mono font-bold ml-1">
            0{currentSlide + 1} / 0{activeSlidesList.length}
          </span>
        </div>
      </div>

      {/* =========================================================================
          2. 5 PASTEL KPI CARDS ROW (Controlled via dashboardConfig)
      ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Datasets */}
        <div
          onClick={() => {
            if (!editingCard) setActivePage('datasets');
          }}
          className="relative p-4 rounded-2xl bg-[#eef8f2] dark:bg-emerald-950/30 border border-[#d2edd9] dark:border-emerald-900/40 flex items-center gap-3.5 cursor-pointer hover:shadow-sm transition-all group"
        >
          {canEditDashboardData && (
            <button
              onClick={(e) => handleStartEditingCard('datasets', e)}
              className="absolute top-2 right-2 p-1 rounded-md bg-emerald-200/80 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 opacity-80 hover:opacity-100 transition-opacity"
              title="Edit Datasets count"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}

          <div className="w-11 h-11 rounded-2xl bg-[#227248] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Database className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            {editingCard === 'datasets' ? (
              <div className="space-y-1" onClick={e => e.stopPropagation()}>
                <input
                  type="text"
                  value={cardCountInput}
                  onChange={e => setCardCountInput(e.target.value)}
                  className="w-full px-1.5 py-0.5 text-sm font-black rounded border border-emerald-400 bg-white dark:bg-slate-800"
                  autoFocus
                />
                <input
                  type="text"
                  value={cardSubtitleInput}
                  onChange={e => setCardSubtitleInput(e.target.value)}
                  className="w-full px-1.5 py-0.5 text-[10px] rounded border border-emerald-400 bg-white dark:bg-slate-800"
                />
                <button
                  onClick={(e) => handleSaveCard('datasets', e)}
                  className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold"
                >
                  Save
                </button>
              </div>
            ) : (
              <>
                <p className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-none">
                  {dashboardConfig.kpiCards.datasets.count}
                </p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                  {dashboardConfig.kpiCards.datasets.label}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {dashboardConfig.kpiCards.datasets.subtitle}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Card 2: Research Publications */}
        <div
          onClick={() => {
            if (!editingCard) setActivePage('research');
          }}
          className="relative p-4 rounded-2xl bg-[#eef5fc] dark:bg-blue-950/30 border border-[#d2e4f7] dark:border-blue-900/40 flex items-center gap-3.5 cursor-pointer hover:shadow-sm transition-all group"
        >
          {canEditDashboardData && (
            <button
              onClick={(e) => handleStartEditingCard('research', e)}
              className="absolute top-2 right-2 p-1 rounded-md bg-blue-200/80 dark:bg-blue-900 text-blue-800 dark:text-blue-200 opacity-80 hover:opacity-100 transition-opacity"
              title="Edit Research count"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}

          <div className="w-11 h-11 rounded-2xl bg-[#1d63b8] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            {editingCard === 'research' ? (
              <div className="space-y-1" onClick={e => e.stopPropagation()}>
                <input
                  type="text"
                  value={cardCountInput}
                  onChange={e => setCardCountInput(e.target.value)}
                  className="w-full px-1.5 py-0.5 text-sm font-black rounded border border-blue-400 bg-white dark:bg-slate-800"
                  autoFocus
                />
                <input
                  type="text"
                  value={cardSubtitleInput}
                  onChange={e => setCardSubtitleInput(e.target.value)}
                  className="w-full px-1.5 py-0.5 text-[10px] rounded border border-blue-400 bg-white dark:bg-slate-800"
                />
                <button
                  onClick={(e) => handleSaveCard('research', e)}
                  className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold"
                >
                  Save
                </button>
              </div>
            ) : (
              <>
                <p className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-none">
                  {dashboardConfig.kpiCards.research.count}
                </p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                  {dashboardConfig.kpiCards.research.label}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {dashboardConfig.kpiCards.research.subtitle}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Card 3: Policy Documents */}
        <div
          onClick={() => {
            if (!editingCard) setActivePage('policy');
          }}
          className="relative p-4 rounded-2xl bg-[#fdf2ec] dark:bg-orange-950/30 border border-[#fae0d1] dark:border-orange-900/40 flex items-center gap-3.5 cursor-pointer hover:shadow-sm transition-all group"
        >
          {canEditDashboardData && (
            <button
              onClick={(e) => handleStartEditingCard('policies', e)}
              className="absolute top-2 right-2 p-1 rounded-md bg-orange-200/80 dark:bg-orange-900 text-orange-800 dark:text-orange-200 opacity-80 hover:opacity-100 transition-opacity"
              title="Edit Policy count"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}

          <div className="w-11 h-11 rounded-2xl bg-[#d45d29] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            {editingCard === 'policies' ? (
              <div className="space-y-1" onClick={e => e.stopPropagation()}>
                <input
                  type="text"
                  value={cardCountInput}
                  onChange={e => setCardCountInput(e.target.value)}
                  className="w-full px-1.5 py-0.5 text-sm font-black rounded border border-orange-400 bg-white dark:bg-slate-800"
                  autoFocus
                />
                <input
                  type="text"
                  value={cardSubtitleInput}
                  onChange={e => setCardSubtitleInput(e.target.value)}
                  className="w-full px-1.5 py-0.5 text-[10px] rounded border border-orange-400 bg-white dark:bg-slate-800"
                />
                <button
                  onClick={(e) => handleSaveCard('policies', e)}
                  className="px-2 py-0.5 rounded bg-orange-600 text-white text-[10px] font-bold"
                >
                  Save
                </button>
              </div>
            ) : (
              <>
                <p className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-none">
                  {dashboardConfig.kpiCards.policies.count}
                </p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                  {dashboardConfig.kpiCards.policies.label}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {dashboardConfig.kpiCards.policies.subtitle}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Card 4: Geospatial Layers */}
        <div
          onClick={() => {
            if (!editingCard) setActivePage('map');
          }}
          className="relative p-4 rounded-2xl bg-[#f6effa] dark:bg-purple-950/30 border border-[#edd9f6] dark:border-purple-900/40 flex items-center gap-3.5 cursor-pointer hover:shadow-sm transition-all group"
        >
          {canEditDashboardData && (
            <button
              onClick={(e) => handleStartEditingCard('layers', e)}
              className="absolute top-2 right-2 p-1 rounded-md bg-purple-200/80 dark:bg-purple-900 text-purple-800 dark:text-purple-200 opacity-80 hover:opacity-100 transition-opacity"
              title="Edit Layers count"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}

          <div className="w-11 h-11 rounded-2xl bg-[#8338a8] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <MapPin className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            {editingCard === 'layers' ? (
              <div className="space-y-1" onClick={e => e.stopPropagation()}>
                <input
                  type="text"
                  value={cardCountInput}
                  onChange={e => setCardCountInput(e.target.value)}
                  className="w-full px-1.5 py-0.5 text-sm font-black rounded border border-purple-400 bg-white dark:bg-slate-800"
                  autoFocus
                />
                <input
                  type="text"
                  value={cardSubtitleInput}
                  onChange={e => setCardSubtitleInput(e.target.value)}
                  className="w-full px-1.5 py-0.5 text-[10px] rounded border border-purple-400 bg-white dark:bg-slate-800"
                />
                <button
                  onClick={(e) => handleSaveCard('layers', e)}
                  className="px-2 py-0.5 rounded bg-purple-600 text-white text-[10px] font-bold"
                >
                  Save
                </button>
              </div>
            ) : (
              <>
                <p className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-none">
                  {dashboardConfig.kpiCards.layers.count}
                </p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                  {dashboardConfig.kpiCards.layers.label}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {dashboardConfig.kpiCards.layers.subtitle}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Card 5: Registered Users */}
        <div
          onClick={() => {
            if (!editingCard) setActivePage('workspace');
          }}
          className="relative p-4 rounded-2xl bg-[#eefaf6] dark:bg-teal-950/30 border border-[#cff2e6] dark:border-teal-900/40 flex items-center gap-3.5 cursor-pointer hover:shadow-sm transition-all group col-span-2 sm:col-span-1"
        >
          {canEditDashboardData && (
            <button
              onClick={(e) => handleStartEditingCard('users', e)}
              className="absolute top-2 right-2 p-1 rounded-md bg-teal-200/80 dark:bg-teal-900 text-teal-800 dark:text-teal-200 opacity-80 hover:opacity-100 transition-opacity"
              title="Edit Users count"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}

          <div className="w-11 h-11 rounded-2xl bg-[#1b8a6b] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            {editingCard === 'users' ? (
              <div className="space-y-1" onClick={e => e.stopPropagation()}>
                <input
                  type="text"
                  value={cardCountInput}
                  onChange={e => setCardCountInput(e.target.value)}
                  className="w-full px-1.5 py-0.5 text-sm font-black rounded border border-teal-400 bg-white dark:bg-slate-800"
                  autoFocus
                />
                <input
                  type="text"
                  value={cardSubtitleInput}
                  onChange={e => setCardSubtitleInput(e.target.value)}
                  className="w-full px-1.5 py-0.5 text-[10px] rounded border border-teal-400 bg-white dark:bg-slate-800"
                />
                <button
                  onClick={(e) => handleSaveCard('users', e)}
                  className="px-2 py-0.5 rounded bg-teal-600 text-white text-[10px] font-bold"
                >
                  Save
                </button>
              </div>
            ) : (
              <>
                <p className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-none">
                  {dashboardConfig.kpiCards.users.count}
                </p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                  {dashboardConfig.kpiCards.users.label}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {dashboardConfig.kpiCards.users.subtitle}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. MAIN 3-COLUMN GRID
      ========================================================================= */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* =======================================================================
            LEFT COLUMN: INTERACTIVE LAND USE MAP & CADASTRAL CALIBRATION (Col-span 5)
        ======================================================================= */}
        <div className="col-span-12 lg:col-span-5 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Interactive Land Use Map
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Database-backed record for {currentStateObj?.state_name || selectedState}
                </p>
              </div>

              {canEditDashboardData && (
                <button
                  onClick={() => setIsLandRecordEditorOpen(true)}
                  className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold flex items-center gap-1.5 hover:bg-emerald-200 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Calibrate Figures</span>
                </button>
              )}
            </div>

            <div className="mt-4 min-h-72 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
              {hasVerifiedRecord && currentRecord ? (
                <div className="w-full p-5 space-y-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {currentRecord.dataset_name}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {currentRecord.district_name || currentRecord.state_name} • Reporting year {currentRecord.year}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                      Validated upload
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
                    {[
                      ['Agricultural', currentAgPct, 'text-lime-600'],
                      ['Forest', currentForestPct, 'text-emerald-600'],
                      ['Built-up', currentBuiltupPct, 'text-rose-600'],
                      ['Water bodies', currentWaterPct, 'text-blue-600'],
                      ['Barren', currentBarrenPct, 'text-amber-600'],
                      ['Other', currentOtherPct, 'text-purple-600']
                    ].map(([label, value, color]) => (
                      <div key={String(label)} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className={`block text-lg font-black ${color}`}>{Number(value).toFixed(1)}%</span>
                        <span className="text-[10px] text-slate-500">{label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      <span>Total recorded area: {currentTotalHa.toLocaleString('en-IN')} ha</span>
                      <span className="font-mono text-emerald-600">Source {currentRecord.source_id}</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-700">
                      <div style={{ width: `${currentAgPct}%` }} className="bg-lime-500" />
                      <div style={{ width: `${currentForestPct}%` }} className="bg-emerald-600" />
                      <div style={{ width: `${currentBuiltupPct}%` }} className="bg-rose-600" />
                      <div style={{ width: `${currentWaterPct}%` }} className="bg-blue-600" />
                      <div style={{ width: `${currentBarrenPct}%` }} className="bg-amber-500" />
                      <div style={{ width: `${currentOtherPct}%` }} className="bg-purple-500" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center max-w-sm">
                  <Database className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
                    No validated record for these filters
                  </p>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Prototype seed values are hidden. Upload and validate a dataset to populate this panel.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Dropdowns & View Details Button */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[120px]">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                Select State
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                {states.map(s => (
                  <option key={s.state_code} value={s.state_code}>
                    {s.state_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[120px]">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                Select Layer
              </label>
              <select
                value={selectedLayer}
                onChange={(e) => setSelectedLayer(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="land-use">Land Use (9-Fold)</option>
                <option value="forest">Forest Canopy</option>
                <option value="urban">Urban Sprawl</option>
                <option value="sodic">Sodic Reclamation</option>
              </select>
            </div>

            <div className="self-end">
              <button
                onClick={() => setActivePage('map')}
                className="px-4 py-2 rounded-xl bg-[#1b5e3a] text-white text-xs font-bold hover:bg-[#154d2f] transition-all flex items-center gap-1.5 shadow-xs"
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* =======================================================================
            MIDDLE COLUMN: KEY INSIGHTS (Controlled via dashboardConfig)
        ======================================================================= */}
        <div className="col-span-12 lg:col-span-3 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#1b5e3a]" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Key Insights
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {canEditDashboardData && (
                  <button
                    onClick={() => setIsAddingInsight(!isAddingInsight)}
                    className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 transition-colors"
                    title="Add Insight"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setActivePage('trends')}
                  className="text-xs font-bold text-[#1b5e3a] hover:underline"
                >
                  View All
                </button>
              </div>
            </div>

            {/* Quick Add Form */}
            {isAddingInsight && (
              <div className="my-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <input
                  type="text"
                  placeholder="Metric value"
                  value={newInsightMetric}
                  onChange={e => setNewInsightMetric(e.target.value)}
                  className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newInsightDesc}
                  onChange={e => setNewInsightDesc(e.target.value)}
                  className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setIsAddingInsight(false)}
                    className="px-2 py-1 text-[11px] font-bold text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNewInsight}
                    className="px-3 py-1 rounded bg-emerald-600 text-white text-[11px] font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Metric Items List */}
            <div className="mt-4 space-y-4">
              {dashboardConfig.keyInsights.length === 0 && (
                <div className="py-7 px-3 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700">
                  <Database className="w-7 h-7 text-slate-300 mx-auto" />
                  <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">No validated insights yet</p>
                  <p className="mt-1 text-[10px] text-slate-500">Insights appear after non-demo records are ingested.</p>
                </div>
              )}
              {dashboardConfig.keyInsights.map((item, idx) => (
                <div key={item.id} className="flex items-start justify-between gap-2 group">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      {idx % 4 === 0 ? <TrendingUp className="w-4 h-4" /> : idx % 4 === 1 ? <Sprout className="w-4 h-4" /> : idx % 4 === 2 ? <Users className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-extrabold text-slate-900 dark:text-white leading-none">
                        {item.metric}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {canEditDashboardData && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          const newMet = prompt('Edit Metric:', item.metric);
                          const newDes = prompt('Edit Description:', item.description);
                          if (newMet && newDes) {
                            updateDashboardInsight(item.id, { metric: newMet, description: newDes });
                            triggerToast('Updated Insight!');
                          }
                        }}
                        className="p-1 rounded text-slate-400 hover:text-emerald-600"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          deleteDashboardInsight(item.id);
                          triggerToast('Deleted Insight!');
                        }}
                        className="p-1 rounded text-slate-400 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* =======================================================================
            RIGHT COLUMN: RESEARCH PUBLICATIONS & ONGOING EXPERIMENTS
        ======================================================================= */}
        <div className="col-span-12 lg:col-span-4 space-y-5">
          {/* Card 1: Recent Research Publications */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1b5e3a]" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Recent Research Publications
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {canEditDashboardData && (
                  <button
                    onClick={() => setIsAddingPub(!isAddingPub)}
                    className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 transition-colors"
                    title="Add Publication"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setActivePage('research')}
                  className="text-xs font-bold text-[#1b5e3a] hover:underline"
                >
                  View All
                </button>
              </div>
            </div>

            {/* Quick Add Form */}
            {isAddingPub && (
              <div className="my-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <input
                  type="text"
                  placeholder="Paper Title"
                  value={newPubTitle}
                  onChange={e => setNewPubTitle(e.target.value)}
                  className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold"
                />
                <input
                  type="text"
                  placeholder="Author / Institution"
                  value={newPubAuthor}
                  onChange={e => setNewPubAuthor(e.target.value)}
                  className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setIsAddingPub(false)}
                    className="px-2 py-1 text-[11px] font-bold text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNewPub}
                    className="px-3 py-1 rounded bg-emerald-600 text-white text-[11px] font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            <div className="mt-3 space-y-3">
              {dashboardConfig.recentPublications.length === 0 && (
                <div className="py-5 px-3 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No submitted research yet</p>
                  <p className="mt-1 text-[10px] text-slate-500">Seed publications are not shown on the live dashboard.</p>
                </div>
              )}
              {dashboardConfig.recentPublications.map((pub) => (
                <div
                  key={pub.id}
                  className="flex items-start justify-between gap-2 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
                >
                  <div
                    onClick={() => setActivePage('research')}
                    className="flex items-start gap-2.5 min-w-0 text-left flex-1 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug hover:text-emerald-600 transition-colors">
                        {pub.title}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {pub.author} | {pub.year}
                      </p>
                    </div>
                  </div>

                  {canEditDashboardData && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          const newTit = prompt('Edit Paper Title:', pub.title);
                          const newAut = prompt('Edit Author:', pub.author);
                          if (newTit) {
                            updateDashboardPublication(pub.id, { title: newTit, author: newAut || pub.author });
                            triggerToast('Updated Publication!');
                          }
                        }}
                        className="p-1 rounded text-slate-400 hover:text-emerald-600"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          deleteDashboardPublication(pub.id);
                          triggerToast('Deleted Publication!');
                        }}
                        className="p-1 rounded text-slate-400 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Ongoing Policy Experiments */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#1b5e3a]" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Policy Repository Updates
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {canEditDashboardData && (
                  <button
                    onClick={() => setIsAddingExp(!isAddingExp)}
                    className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 transition-colors"
                    title="Add Experiment"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setActivePage('decision-support')}
                  className="text-xs font-bold text-[#1b5e3a] hover:underline"
                >
                  View All
                </button>
              </div>
            </div>

            {/* Quick Add Form */}
            {isAddingExp && (
              <div className="my-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <input
                  type="text"
                  placeholder="Experiment Title"
                  value={newExpTitle}
                  onChange={e => setNewExpTitle(e.target.value)}
                  className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold"
                />
                <input
                  type="text"
                  placeholder="State or region"
                  value={newExpState}
                  onChange={e => setNewExpState(e.target.value)}
                  className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setIsAddingExp(false)}
                    className="px-2 py-1 text-[11px] font-bold text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNewExp}
                    className="px-3 py-1 rounded bg-emerald-600 text-white text-[11px] font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            <div className="mt-3 space-y-3">
              {dashboardConfig.policyExperiments.length === 0 && (
                <div className="py-5 px-3 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No submitted policy updates yet</p>
                  <p className="mt-1 text-[10px] text-slate-500">Prototype policy entries are excluded.</p>
                </div>
              )}
              {dashboardConfig.policyExperiments.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
                >
                  <div
                    onClick={() => setActivePage('decision-support')}
                    className="flex items-start gap-2.5 min-w-0 text-left flex-1 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                        {exp.title}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {exp.state} | {exp.duration}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                      {exp.status}
                    </span>

                    {canEditDashboardData && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            const newTit = prompt('Edit Experiment Title:', exp.title);
                            const newSt = prompt('Edit State:', exp.state);
                            if (newTit) {
                              updatePolicyExperiment(exp.id, { title: newTit, state: newSt || exp.state });
                              triggerToast('Updated Policy Experiment!');
                            }
                          }}
                          className="p-1 rounded text-slate-400 hover:text-emerald-600"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            deletePolicyExperiment(exp.id);
                            triggerToast('Deleted Policy Experiment!');
                          }}
                          className="p-1 rounded text-slate-400 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. BOTTOM ROW: QUICK ACCESS & UPCOMING EVENTS
      ========================================================================= */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Quick Access Action Tiles (Col-span 8) */}
        <div className="col-span-12 lg:col-span-8 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-left">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#1b5e3a]" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Quick Access
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Explore Datasets', page: 'datasets', icon: Database, bg: 'bg-[#eef8f2]', iconColor: 'text-[#227248]' },
              { label: 'Browse Research', page: 'research', icon: BookOpen, bg: 'bg-[#f6effa]', iconColor: 'text-[#8338a8]' },
              { label: 'Find Policies', page: 'policy', icon: FileText, bg: 'bg-[#fdf2ec]', iconColor: 'text-[#d45d29]' },
              { label: 'Open GIS Maps', page: 'map', icon: Layers, bg: 'bg-[#eef5fc]', iconColor: 'text-[#1d63b8]' },
              { label: 'Start Policy Experiment', page: 'decision-support', icon: Lightbulb, bg: 'bg-[#fef9e7]', iconColor: 'text-[#b78103]' },
              { label: 'Join Collaboration Hub', page: 'workspace', icon: Users, bg: 'bg-[#eefaf6]', iconColor: 'text-[#1b8a6b]' }
            ].map((action, idx) => {
              const Icon = action.icon;
              return (
                <button
                  key={idx}
                  onClick={() => setActivePage(action.page as any)}
                  className={`p-3.5 rounded-2xl ${action.bg} dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex flex-col items-center text-center gap-2.5 hover:scale-102 hover:shadow-xs transition-all cursor-pointer`}
                >
                  <div className={`w-8 h-8 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-2xs ${action.iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events Card (Col-span 4 - Controlled via dashboardConfig) */}
        <div className="col-span-12 lg:col-span-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-left">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#1b5e3a]" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Upcoming Events
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {canEditDashboardData && (
                <button
                  onClick={() => setIsAddingEvent(!isAddingEvent)}
                  className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 transition-colors"
                  title="Add Event"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setActivePage('reports')}
                className="text-xs font-bold text-[#1b5e3a] hover:underline"
              >
                View All
              </button>
            </div>
          </div>

          {/* Quick Add Form */}
          {isAddingEvent && (
            <div className="my-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
              <input
                type="text"
                placeholder="Event Title"
                value={newEventTitle}
                onChange={e => setNewEventTitle(e.target.value)}
                className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold"
              />
              <input
                type="text"
                placeholder="Event date"
                value={newEventDate}
                onChange={e => setNewEventDate(e.target.value)}
                className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsAddingEvent(false)}
                  className="px-2 py-1 text-[11px] font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNewEvent}
                  className="px-3 py-1 rounded bg-emerald-600 text-white text-[11px] font-bold"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          <div className="mt-3 space-y-2.5">
            {dashboardConfig.upcomingEvents.length === 0 && (
              <div className="py-6 px-3 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No verified upcoming events</p>
                <p className="mt-1 text-[10px] text-slate-500">Events will appear only after a real event source is connected.</p>
              </div>
            )}
            {dashboardConfig.upcomingEvents.map((evt) => (
              <div
                key={evt.id}
                className="flex items-start justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <Calendar className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                      {evt.title}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {evt.date} | {evt.location}
                    </p>
                  </div>
                </div>

                {canEditDashboardData && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        const newTit = prompt('Edit Event Title:', evt.title);
                        const newDt = prompt('Edit Date:', evt.date);
                        if (newTit) {
                          updateUpcomingEvent(evt.id, { title: newTit, date: newDt || evt.date });
                          triggerToast('Updated Event!');
                        }
                      }}
                      className="p-1 rounded text-slate-400 hover:text-emerald-600"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        deleteUpcomingEvent(evt.id);
                        triggerToast('Deleted Event!');
                      }}
                      className="p-1 rounded text-slate-400 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================================================
          5. INSPECTION MODALS
      ========================================================================= */}
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
