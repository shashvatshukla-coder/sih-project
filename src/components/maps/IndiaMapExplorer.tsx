import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MapLegend } from './MapLegend';
import { MapDetailDrawer } from './MapDetailDrawer';
import { Play, Pause, RotateCcw, Info, MapPin, ZoomIn, ZoomOut, Layers } from 'lucide-react';

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
  changePct: number;
}

export const IndiaMapExplorer: React.FC = () => {
  const {
    selectedState,
    setSelectedState,
    selectedYear,
    setSelectedYear,
    states
  } = useApp();

  const [indicator, setIndicator] = useState<'agricultural' | 'forest' | 'builtup' | 'degraded' | 'irrigated' | 'change'>('agricultural');
  const [isPlaying, setIsPlaying] = useState(false);
  const [hoveredState, setHoveredState] = useState<StateMapFeature | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerState, setDrawerState] = useState<{ code: string; name: string }>({ code: 'IN-UP', name: 'Uttar Pradesh' });

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
  const stateFeatures: StateMapFeature[] = [
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
      changePct: +4.0
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
      changePct: +1.2
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
      changePct: +0.5
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
      changePct: -2.8
    }
  ];

  // Indicator configs
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

  const handleStateClick = (feat: StateMapFeature) => {
    setSelectedState(feat.code);
    setDrawerState({ code: feat.code, name: feat.name });
    setDrawerOpen(true);
  };

  return (
    <div className="relative w-full h-[650px] bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
      {/* Top Map Toolbar */}
      <div className="flex flex-wrap items-center justify-between p-3.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-20 gap-3">
        {/* Indicators Pill Group */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> Layer:
          </span>
          {(['agricultural', 'forest', 'builtup', 'irrigated', 'degraded', 'change'] as const).map(ind => (
            <button
              key={ind}
              onClick={() => setIndicator(ind)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                indicator === ind
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {indicatorConfigs[ind].name}
            </button>
          ))}
        </div>

        {/* Year Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
              isPlaying
                ? 'bg-amber-500 text-white'
                : 'bg-brand-700 text-white hover:bg-brand-800'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'Pause' : 'Play Timeline'}</span>
          </button>

          {/* Year Buttons */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            {years.map(y => (
              <button
                key={y}
                onClick={() => {
                  setSelectedYear(y);
                  setIsPlaying(false);
                }}
                className={`px-2 py-1 text-xs font-mono font-bold rounded-md transition-all ${
                  selectedYear === y
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Map SVG Canvas */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center p-4">
        <svg
          viewBox="100 80 600 580"
          className="w-full h-full max-h-[540px] drop-shadow-md select-none"
        >
          {/* Base Map Frame Grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-200/50 dark:text-slate-800/40" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* State Boundaries */}
          {stateFeatures.map(feat => {
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
                  stroke={isSelected ? '#0F172A' : isHovered ? '#1E293B' : '#64748B'}
                  strokeWidth={isSelected ? 3 : isHovered ? 2 : 1}
                  strokeLinejoin="round"
                  className="transition-all duration-200 hover:opacity-95"
                />
                {/* State Label Text */}
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
                  className="text-[8px] font-mono font-semibold fill-slate-700 pointer-events-none"
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

        {/* Hover Floating Tooltip */}
        {hoveredState && (
          <div className="absolute top-16 left-6 p-3 rounded-xl bg-slate-900/95 text-white shadow-2xl border border-slate-700 text-left text-xs space-y-1.5 pointer-events-none animate-in fade-in duration-100 z-20 min-w-[200px]">
            <div className="flex items-center justify-between border-b border-slate-700 pb-1">
              <span className="font-bold text-sm text-brand-300">{hoveredState.name}</span>
              <span className="font-mono text-[10px] text-slate-400">{hoveredState.code}</span>
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Agricultural:</span>
                <span className="font-bold text-emerald-400">{hoveredState.agriPct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Forest Extent:</span>
                <span className="font-bold text-teal-400">{hoveredState.forestPct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Built-up Area:</span>
                <span className="font-bold text-slate-200">{hoveredState.builtupPct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Irrigation:</span>
                <span className="font-bold text-blue-400">{hoveredState.irrigatedPct}%</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800 text-[10px]">
                <span className="text-slate-400">10-Yr Shift:</span>
                <span className={hoveredState.changePct > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {hoveredState.changePct > 0 ? `+${hoveredState.changePct}%` : `${hoveredState.changePct}%`}
                </span>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 pt-0.5 text-center italic">
              Click to open analytical profile →
            </div>
          </div>
        )}

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

        {/* State Detail Drawer (Slide-over) */}
        <MapDetailDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          stateCode={drawerState.code}
          stateName={drawerState.name}
        />
      </div>
    </div>
  );
};
