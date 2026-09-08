import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MapLegend } from './MapLegend';
import { MapDetailDrawer } from './MapDetailDrawer';
import { DistrictGoogleMapView } from './DistrictGoogleMapView';
import {
  Play,
  Pause,
  RotateCcw,
  Info,
  MapPin,
  Layers,
  Sparkles,
  BarChart3,
  TrendingUp,
  Globe,
  Compass,
  Search,
  Eye,
  Activity,
  Sliders,
  Maximize2
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

interface StateMapFeature {
  code: string;
  name: string;
  path: string;
  center: [number, number]; // [x, y] in SVG viewbox
  agriPct: number;
  forestPct: number;
  builtupPct: number;
  degradedPct: number;
  irrigatedPct: number;
  waterPct: number;
  barrenPct: number;
  changePct: number;
}

export const IndiaMapExplorer: React.FC = () => {
  const {
    selectedState,
    setSelectedState,
    selectedDistrict,
    setSelectedDistrict,
    selectedYear,
    setSelectedYear,
    states,
    districts,
    runAIQuery
  } = useApp();

  const [mapMode, setMapMode] = useState<'choropleth' | 'googlemap' | 'comparison'>('choropleth');
  const [indicator, setIndicator] = useState<'agricultural' | 'forest' | 'builtup' | 'degraded' | 'irrigated' | 'change'>('agricultural');
  const [isPlaying, setIsPlaying] = useState(false);
  const [hoveredState, setHoveredState] = useState<StateMapFeature | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerState, setDrawerState] = useState<{ code: string; name: string }>({ code: 'IN-UP', name: 'Uttar Pradesh' });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGraphTab, setActiveGraphTab] = useState<'radar' | 'trend' | 'pie'>('radar');

  // Comparison mode states
  const [compareStateA, setCompareStateA] = useState<string>('IN-UP');
  const [compareStateB, setCompareStateB] = useState<string>('IN-BR');

  // Multi-year animation playback
  const years = [2005, 2010, 2015, 2020, 2025];

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        const nextIdx = (years.indexOf(selectedYear) + 1) % years.length;
        setSelectedYear(years[nextIdx]);
      }, 1400);
    }
    return () => clearInterval(interval);
  }, [isPlaying, selectedYear, setSelectedYear]);

  // Scaled representative vector polygon paths for Indian states
  const stateFeatures: StateMapFeature[] = useMemo(() => [
    {
      code: 'IN-UP',
      name: 'Uttar Pradesh',
      path: 'M 320 200 L 420 180 L 460 210 L 440 250 L 390 270 L 330 250 Z',
      center: [380, 220],
      agriPct: selectedYear === 2005 ? 71.7 : selectedYear === 2015 ? 69.9 : 68.4,
      forestPct: 9.2,
      builtupPct: selectedYear === 2005 ? 7.6 : selectedYear === 2015 ? 10.6 : 11.8,
      degradedPct: 19.1,
      irrigatedPct: 87.2,
      waterPct: 4.5,
      barrenPct: 6.1,
      changePct: -3.3
    },
    {
      code: 'IN-BR',
      name: 'Bihar',
      path: 'M 460 210 L 530 210 L 540 260 L 470 265 L 440 250 Z',
      center: [490, 235],
      agriPct: selectedYear === 2005 ? 61.0 : selectedYear === 2015 ? 58.0 : 55.5,
      forestPct: 7.7,
      builtupPct: 19.5,
      degradedPct: 23.0,
      irrigatedPct: 67.5,
      waterPct: 4.6,
      barrenPct: 4.2,
      changePct: -5.5
    },
    {
      code: 'IN-RJ',
      name: 'Rajasthan',
      path: 'M 190 170 L 290 160 L 320 200 L 310 270 L 230 290 L 170 230 Z',
      center: [240, 220],
      agriPct: selectedYear === 2005 ? 49.0 : selectedYear === 2015 ? 52.0 : 53.0,
      forestPct: 8.3,
      builtupPct: 8.0,
      degradedPct: 41.2,
      irrigatedPct: 44.0,
      waterPct: 2.1,
      barrenPct: 28.6,
      changePct: 4.0
    },
    {
      code: 'IN-MP',
      name: 'Madhya Pradesh',
      path: 'M 290 260 L 390 250 L 430 290 L 390 350 L 280 340 L 270 280 Z',
      center: [350, 300],
      agriPct: selectedYear === 2005 ? 48.0 : selectedYear === 2015 ? 49.0 : 49.2,
      forestPct: 28.5,
      builtupPct: 8.0,
      degradedPct: 27.5,
      irrigatedPct: 58.2,
      waterPct: 3.8,
      barrenPct: 10.5,
      changePct: 1.2
    },
    {
      code: 'IN-MH',
      name: 'Maharashtra',
      path: 'M 240 330 L 350 330 L 390 380 L 340 460 L 240 430 L 220 370 Z',
      center: [300, 390],
      agriPct: selectedYear === 2005 ? 57.0 : selectedYear === 2015 ? 55.5 : 53.8,
      forestPct: 17.5,
      builtupPct: 13.0,
      degradedPct: 31.5,
      irrigatedPct: 27.8,
      waterPct: 3.2,
      barrenPct: 12.5,
      changePct: -3.2
    },
    {
      code: 'IN-GJ',
      name: 'Gujarat',
      path: 'M 140 260 L 230 260 L 240 330 L 190 360 L 130 330 Z',
      center: [180, 300],
      agriPct: 52.0,
      forestPct: 10.5,
      builtupPct: 12.0,
      degradedPct: 32.8,
      irrigatedPct: 56.5,
      waterPct: 4.8,
      barrenPct: 20.7,
      changePct: -1.0
    },
    {
      code: 'IN-KA',
      name: 'Karnataka',
      path: 'M 250 430 L 320 440 L 330 540 L 270 560 L 240 480 Z',
      center: [285, 490],
      agriPct: selectedYear === 2005 ? 55.0 : selectedYear === 2015 ? 54.0 : 52.5,
      forestPct: 20.5,
      builtupPct: 12.0,
      degradedPct: 26.2,
      irrigatedPct: 41.0,
      waterPct: 3.5,
      barrenPct: 11.5,
      changePct: -2.5
    },
    {
      code: 'IN-TN',
      name: 'Tamil Nadu',
      path: 'M 320 520 L 370 510 L 360 620 L 300 610 L 310 540 Z',
      center: [340, 565],
      agriPct: selectedYear === 2005 ? 48.0 : selectedYear === 2015 ? 46.0 : 43.5,
      forestPct: 21.5,
      builtupPct: 17.5,
      degradedPct: 20.5,
      irrigatedPct: 62.0,
      waterPct: 5.2,
      barrenPct: 12.3,
      changePct: -4.5
    },
    {
      code: 'IN-AP',
      name: 'Andhra Pradesh',
      path: 'M 350 420 L 420 390 L 410 490 L 340 510 Z',
      center: [380, 450],
      agriPct: 50.4,
      forestPct: 18.2,
      builtupPct: 11.2,
      degradedPct: 28.0,
      irrigatedPct: 51.5,
      waterPct: 5.1,
      barrenPct: 15.1,
      changePct: -1.8
    },
    {
      code: 'IN-OD',
      name: 'Odisha',
      path: 'M 430 310 L 510 300 L 480 390 L 410 370 Z',
      center: [460, 340],
      agriPct: 46.0,
      forestPct: 33.5,
      builtupPct: 8.5,
      degradedPct: 25.0,
      irrigatedPct: 35.0,
      waterPct: 4.8,
      barrenPct: 12.2,
      changePct: 0.5
    },
    {
      code: 'IN-WB',
      name: 'West Bengal',
      path: 'M 520 240 L 560 230 L 550 320 L 500 310 Z',
      center: [535, 275],
      agriPct: 59.0,
      forestPct: 14.5,
      builtupPct: 17.5,
      degradedPct: 17.2,
      irrigatedPct: 66.0,
      waterPct: 7.2,
      barrenPct: 1.8,
      changePct: -3.0
    },
    {
      code: 'IN-PB',
      name: 'Punjab',
      path: 'M 250 120 L 300 110 L 290 160 L 240 160 Z',
      center: [270, 135],
      agriPct: 82.5,
      forestPct: 3.6,
      builtupPct: 10.0,
      degradedPct: 11.5,
      irrigatedPct: 98.4,
      waterPct: 2.2,
      barrenPct: 1.7,
      changePct: -1.2
    },
    {
      code: 'IN-HR',
      name: 'Haryana',
      path: 'M 290 140 L 330 140 L 320 190 L 280 180 Z',
      center: [305, 160],
      agriPct: 78.0,
      forestPct: 3.8,
      builtupPct: 14.5,
      degradedPct: 14.0,
      irrigatedPct: 92.0,
      waterPct: 2.0,
      barrenPct: 1.7,
      changePct: -2.1
    },
    {
      code: 'IN-AS',
      name: 'Assam',
      path: 'M 570 190 L 660 180 L 640 230 L 560 230 Z',
      center: [610, 205],
      agriPct: 38.0,
      forestPct: 36.2,
      builtupPct: 7.0,
      degradedPct: 18.5,
      irrigatedPct: 22.0,
      waterPct: 9.8,
      barrenPct: 9.0,
      changePct: -1.0
    },
    {
      code: 'IN-KL',
      name: 'Kerala',
      path: 'M 280 560 L 310 550 L 300 630 L 275 610 Z',
      center: [290, 585],
      agriPct: 52.0,
      forestPct: 29.5,
      builtupPct: 14.0,
      degradedPct: 12.0,
      irrigatedPct: 33.0,
      waterPct: 3.5,
      barrenPct: 1.0,
      changePct: -2.8
    }
  ], [selectedYear]);

  // Indicator color and scale configurations
  const indicatorConfigs = {
    agricultural: { name: 'Agricultural Land', min: 35, max: 85, unit: '%', colors: ['#DCFCE7', '#86EFAC', '#22C55E', '#16A34A', '#14532D'] },
    forest: { name: 'Forest Cover', min: 0, max: 40, unit: '%', colors: ['#ECFDF5', '#A7F3D0', '#34D399', '#059669', '#064E3B'] },
    builtup: { name: 'Built-up Area', min: 5, max: 25, unit: '%', colors: ['#F1F5F9', '#CBD5E1', '#64748B', '#334155', '#0F172A'] },
    degraded: { name: 'Land Degradation', min: 10, max: 50, unit: '%', colors: ['#FFF1F2', '#FECDD3', '#FB7185', '#E11D48', '#881337'] },
    irrigated: { name: 'Gross Irrigation', min: 20, max: 100, unit: '%', colors: ['#EFF6FF', '#BFDBFE', '#60A5FA', '#2563EB', '#1E3A8A'] },
    change: { name: '10-Yr Change %', min: -6, max: 6, unit: '%', colors: ['#EF4444', '#FCA5A5', '#F1F5F9', '#86EFAC', '#16A34A'] }
  };

  const currentCfg = indicatorConfigs[indicator];

  const getColor = (feat: StateMapFeature) => {
    let val = feat.agriPct;
    if (indicator === 'forest') val = feat.forestPct;
    if (indicator === 'builtup') val = feat.builtupPct;
    if (indicator === 'degraded') val = feat.degradedPct;
    if (indicator === 'irrigated') val = feat.irrigatedPct;
    if (indicator === 'change') val = feat.changePct;

    const normalized = Math.min(Math.max((val - currentCfg.min) / (currentCfg.max - currentCfg.min), 0), 0.99);
    const colorIndex = Math.floor(normalized * currentCfg.colors.length);
    return currentCfg.colors[colorIndex] || currentCfg.colors[0];
  };

  const activeFocusState = useMemo(() => {
    return hoveredState || stateFeatures.find(f => f.code === selectedState) || stateFeatures[0];
  }, [hoveredState, selectedState, stateFeatures]);

  // Data for the Interactive Radar Chart
  const radarData = useMemo(() => [
    { subject: 'Agriculture', value: activeFocusState.agriPct, fullMark: 100 },
    { subject: 'Forest', value: activeFocusState.forestPct, fullMark: 100 },
    { subject: 'Built-up', value: activeFocusState.builtupPct, fullMark: 100 },
    { subject: 'Irrigation', value: activeFocusState.irrigatedPct, fullMark: 100 },
    { subject: 'Waterbodies', value: activeFocusState.waterPct * 5, fullMark: 100 },
    { subject: 'Degraded', value: activeFocusState.degradedPct, fullMark: 100 }
  ], [activeFocusState]);

  // Data for the Decadal Trend Sparkline
  const trendData = useMemo(() => [
    { year: '2005', agri: activeFocusState.agriPct + 3.5, builtup: Math.max(activeFocusState.builtupPct - 4.2, 3), forest: activeFocusState.forestPct - 0.8 },
    { year: '2010', agri: activeFocusState.agriPct + 2.4, builtup: Math.max(activeFocusState.builtupPct - 2.8, 4), forest: activeFocusState.forestPct - 0.5 },
    { year: '2015', agri: activeFocusState.agriPct + 1.2, builtup: Math.max(activeFocusState.builtupPct - 1.5, 6), forest: activeFocusState.forestPct - 0.2 },
    { year: '2020', agri: activeFocusState.agriPct + 0.4, builtup: Math.max(activeFocusState.builtupPct - 0.5, 8), forest: activeFocusState.forestPct },
    { year: '2025', agri: activeFocusState.agriPct, builtup: activeFocusState.builtupPct, forest: activeFocusState.forestPct }
  ], [activeFocusState]);

  // Pie Chart Distribution
  const pieData = useMemo(() => [
    { name: 'Agriculture', value: activeFocusState.agriPct, color: '#10B981' },
    { name: 'Forest', value: activeFocusState.forestPct, color: '#059669' },
    { name: 'Built-up', value: activeFocusState.builtupPct, color: '#64748B' },
    { name: 'Waterbodies', value: activeFocusState.waterPct, color: '#0EA5E9' },
    { name: 'Barren/Usar', value: activeFocusState.barrenPct, color: '#F59E0B' }
  ], [activeFocusState]);

  const handleStateClick = (feat: StateMapFeature) => {
    setSelectedState(feat.code);
    setDrawerState({ code: feat.code, name: feat.name });
    setDrawerOpen(true);
  };

  const filteredStates = stateFeatures.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 text-left">
      {/* View Mode Switcher Header */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 p-2 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Interactive Geospatial GIS & Map Intelligence Suite</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 font-mono font-bold">
                LIVE GIS
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choropleth heatmaps, high-res satellite Google Maps, real-time radar balance charts, and multi-decadal time sliders.
            </p>
          </div>
        </div>

        {/* Mode Buttons */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setMapMode('choropleth')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mapMode === 'choropleth'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>India Choropleth</span>
          </button>

          <button
            onClick={() => setMapMode('googlemap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mapMode === 'googlemap'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Google Satellite & Tehsils</span>
          </button>

          <button
            onClick={() => setMapMode('comparison')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mapMode === 'comparison'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>State Comparator</span>
          </button>
        </div>
      </div>

      {/* Mode 1: India Choropleth + Live Interactive Graph HUD */}
      {mapMode === 'choropleth' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* Main Map Box */}
          <div className="xl:col-span-8 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col relative shadow-xs min-h-[580px]">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-20 gap-2.5">
              {/* Layers Pill Group */}
              <div className="flex flex-wrap items-center gap-1 text-xs">
                <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" /> Layer:
                </span>
                {(['agricultural', 'forest', 'builtup', 'irrigated', 'degraded', 'change'] as const).map(ind => (
                  <button
                    key={ind}
                    onClick={() => setIndicator(ind)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                      indicator === ind
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {indicatorConfigs[ind].name}
                  </button>
                ))}
              </div>

              {/* Timeline Playback */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
                    isPlaying ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                  <span>{isPlaying ? 'Pause' : 'Play Timeline'}</span>
                </button>

                <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {years.map(y => (
                    <button
                      key={y}
                      onClick={() => {
                        setSelectedYear(y);
                        setIsPlaying(false);
                      }}
                      className={`px-2 py-0.5 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                        selectedYear === y
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick State Search Overlay */}
            <div className="absolute top-16 left-4 z-20 w-56">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Filter state (UP, Bihar)..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Main Map SVG Canvas */}
            <div className="relative flex-1 w-full h-full flex items-center justify-center p-4">
              <svg
                viewBox="100 80 600 580"
                className="w-full h-full max-h-[500px] drop-shadow-md select-none"
              >
                <defs>
                  <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-200/50 dark:text-slate-800/40" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-pattern)" />

                {filteredStates.map(feat => {
                  const isSelected = selectedState === feat.code;
                  const isHovered = hoveredState?.code === feat.code;
                  const fillColor = getColor(feat);

                  return (
                    <g
                      key={feat.code}
                      className="cursor-pointer transition-all duration-300"
                      onClick={() => handleStateClick(feat)}
                      onMouseEnter={() => setHoveredState(feat)}
                      onMouseLeave={() => setHoveredState(null)}
                    >
                      <path
                        d={feat.path}
                        fill={fillColor}
                        stroke={isSelected ? '#059669' : isHovered ? '#0F172A' : '#64748B'}
                        strokeWidth={isSelected ? 3.5 : isHovered ? 2.5 : 1}
                        strokeLinejoin="round"
                        className="transition-all duration-200 hover:opacity-95"
                      />
                      <text
                        x={feat.center[0]}
                        y={feat.center[1]}
                        textAnchor="middle"
                        className="text-[9px] font-bold fill-slate-800 dark:fill-slate-900 pointer-events-none tracking-tight select-none"
                      >
                        {feat.name.length > 8 ? feat.name.substring(0, 7) + '.' : feat.name}
                      </text>
                      <text
                        x={feat.center[0]}
                        y={feat.center[1] + 10}
                        textAnchor="middle"
                        className="text-[8px] font-mono font-bold fill-slate-700 pointer-events-none"
                      >
                        {indicator === 'agricultural' && `${feat.agriPct}%`}
                        {indicator === 'forest' && `${feat.forestPct}%`}
                        {indicator === 'builtup' && `${feat.builtupPct}%`}
                        {indicator === 'degraded' && `${feat.degradedPct}%`}
                        {indicator === 'irrigated' && `${feat.irrigatedPct}%`}
                        {indicator === 'change' && `${feat.changePct > 0 ? '+' : ''}${feat.changePct}%`}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Legend Positioned Bottom Left */}
              <div className="absolute bottom-4 left-4 z-10">
                <MapLegend
                  indicator={currentCfg.name}
                  min={currentCfg.min}
                  max={currentCfg.max}
                  unit={currentCfg.unit}
                  colorScale={currentCfg.colors}
                />
              </div>
            </div>
          </div>

          {/* Interactive Graph HUD (Right Column) */}
          <div className="xl:col-span-4 space-y-4">
            {/* Live Focus Card */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Live Spatial Telemetry
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
                  {activeFocusState.code}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white">
                    {activeFocusState.name}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Series Year: {selectedYear} • 9-Fold Survey
                  </p>
                </div>
                <button
                  onClick={() => handleStateClick(activeFocusState)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 cursor-pointer"
                >
                  Full Drawer →
                </button>
              </div>

              {/* Mini KPI Matrix */}
              <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-xs">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-sans">Agri Share</span>
                  <span className="font-bold text-emerald-600">{activeFocusState.agriPct}%</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-sans">Forest</span>
                  <span className="font-bold text-teal-600">{activeFocusState.forestPct}%</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-sans">Irrigation</span>
                  <span className="font-bold text-blue-600">{activeFocusState.irrigatedPct}%</span>
                </div>
              </div>
            </div>

            {/* Interactive Graph Panel with Tabs */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              {/* Tab Selector */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => setActiveGraphTab('radar')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      activeGraphTab === 'radar'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    🕸️ Radar Balance
                  </button>
                  <button
                    onClick={() => setActiveGraphTab('trend')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      activeGraphTab === 'trend'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    📈 Decadal Trend
                  </button>
                  <button
                    onClick={() => setActiveGraphTab('pie')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      activeGraphTab === 'pie'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    🍩 Classification
                  </button>
                </div>
              </div>

              {/* Tab 1: Radar Chart */}
              {activeGraphTab === 'radar' && (
                <div className="space-y-2">
                  <div className="text-[11px] text-slate-500 text-center">
                    Multi-Dimensional Indicator Radar for <strong>{activeFocusState.name}</strong>
                  </div>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                        <PolarGrid stroke="#94a3b8" strokeOpacity={0.3} />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                        <Radar name={activeFocusState.name} dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.45} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Tab 2: Decadal Trend Sparkline Area Chart */}
              {activeGraphTab === 'trend' && (
                <div className="space-y-2">
                  <div className="text-[11px] text-slate-500 text-center">
                    2005 → 2025 Trajectory (Agriculture vs Urban Sprawl)
                  </div>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorAgri" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="colorUrban" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#64748b" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#64748b" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 100]} />
                        <Tooltip />
                        <Area type="monotone" dataKey="agri" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorAgri)" name="Agri %" />
                        <Area type="monotone" dataKey="builtup" stroke="#64748b" strokeWidth={2} fillOpacity={1} fill="url(#colorUrban)" name="Urban %" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Tab 3: Pie Chart */}
              {activeGraphTab === 'pie' && (
                <div className="space-y-2">
                  <div className="text-[11px] text-slate-500 text-center">
                    9-Fold Distribution in {activeFocusState.name}
                  </div>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-slate-500">
                    {pieData.map(p => (
                      <span key={p.name} className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                        <span>{p.name}: <strong>{p.value}%</strong></span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Google Maps Satellite & Hybrid Explorer */}
      {mapMode === 'googlemap' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Google Maps High-Resolution Satellite & Tehsil GIS Explorer</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Interactive spatial tiles centered on Amethi (Gauriganj) with cadastral tehsil markers and sodic reclamation polygons.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedDistrict('UP-AMT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedDistrict === 'UP-AMT'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                }`}
              >
                📍 Amethi (Gauriganj HQ)
              </button>
            </div>
          </div>

          <DistrictGoogleMapView
            districtName={selectedDistrict === 'UP-AMT' ? 'Amethi (Gauriganj)' : 'Uttar Pradesh District'}
            districtCode={selectedDistrict || 'UP-AMT'}
            stateName="Uttar Pradesh"
            centerCoords={
              selectedDistrict === 'UP-AMT'
                ? [26.2167, 81.6833]
                : [26.2167, 81.6833]
            }
          />
        </div>
      )}

      {/* Mode 3: Side-by-Side State Comparator */}
      {mapMode === 'comparison' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <span>Spatial Dual-State Comparator Engine</span>
              </h3>
              <p className="text-xs text-slate-500">
                Compare multi-dimensional agricultural and urbanization metrics between any two regions.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={compareStateA}
                onChange={e => setCompareStateA(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300 rounded-lg cursor-pointer"
              >
                {stateFeatures.map(s => (
                  <option key={s.code} value={s.code}>{s.name} (Region A)</option>
                ))}
              </select>

              <span className="text-xs font-bold text-slate-400">VS</span>

              <select
                value={compareStateB}
                onChange={e => setCompareStateB(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border border-blue-300 rounded-lg cursor-pointer"
              >
                {stateFeatures.map(s => (
                  <option key={s.code} value={s.code}>{s.name} (Region B)</option>
                ))}
              </select>
            </div>
          </div>

          {/* Side-by-Side Metrics Grid */}
          {(() => {
            const stA = stateFeatures.find(s => s.code === compareStateA) || stateFeatures[0];
            const stB = stateFeatures.find(s => s.code === compareStateB) || stateFeatures[1];

            const compData = [
              { metric: 'Agricultural Share %', a: stA.agriPct, b: stB.agriPct, delta: stA.agriPct - stB.agriPct },
              { metric: 'Forest Canopy Extent %', a: stA.forestPct, b: stB.forestPct, delta: stA.forestPct - stB.forestPct },
              { metric: 'Built-up / Urban Sprawl %', a: stA.builtupPct, b: stB.builtupPct, delta: stA.builtupPct - stB.builtupPct },
              { metric: 'Gross Irrigation Ratio %', a: stA.irrigatedPct, b: stB.irrigatedPct, delta: stA.irrigatedPct - stB.irrigatedPct },
              { metric: 'Land Degradation %', a: stA.degradedPct, b: stB.degradedPct, delta: stA.degradedPct - stB.degradedPct }
            ];

            return (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {compData.map(c => (
                    <div key={c.metric} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{c.metric}</div>
                      <div className="flex items-center justify-between mt-2 font-mono">
                        <span className="font-bold text-emerald-600">{c.a}%</span>
                        <span className="text-slate-400 font-sans text-[10px]">vs</span>
                        <span className="font-bold text-blue-600">{c.b}%</span>
                      </div>
                      <div className={`text-[10px] font-bold mt-1 ${c.delta >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {c.delta >= 0 ? `+${c.delta.toFixed(1)} pp (${stA.name})` : `${c.delta.toFixed(1)} pp (${stB.name})`}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comparative Bar Chart */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    Comparative Indicator Breakdown ({stA.name} vs {stB.name})
                  </h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={compData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                        <XAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="a" fill="#10B981" name={stA.name} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="b" fill="#3B82F6" name={stB.name} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* State Detail Drawer (Slide-over) */}
      <MapDetailDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        stateCode={drawerState.code}
        stateName={drawerState.name}
      />
    </div>
  );
};
