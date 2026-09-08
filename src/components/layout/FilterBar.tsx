import React from 'react';
import { useApp } from '../../context/AppContext';
import { LandCategory } from '../../types';
import { Filter, RotateCcw, MapPin, Calendar, Layers, ChevronDown, Check } from 'lucide-react';

export const FilterBar: React.FC = () => {
  const {
    selectedState,
    setSelectedState,
    selectedDistrict,
    setSelectedDistrict,
    selectedYear,
    setSelectedYear,
    selectedCategory,
    setSelectedCategory,
    states,
    districts
  } = useApp();

  const categories: Array<{ id: LandCategory; label: string; color: string }> = [
    { id: 'agricultural', label: 'Agricultural Land', color: 'text-agri-600 bg-agri-50 border-agri-200' },
    { id: 'forest', label: 'Forest Cover', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { id: 'builtup', label: 'Built-up / Urban', color: 'text-slate-700 bg-slate-100 border-slate-300' },
    { id: 'waterbodies', label: 'Water Bodies', color: 'text-sky-700 bg-sky-50 border-sky-200' },
    { id: 'barren', label: 'Barren & Usar Land', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { id: 'irrigated', label: 'Irrigated Land %', color: 'text-blue-700 bg-blue-50 border-blue-200' },
    { id: 'degraded', label: 'Land Degradation %', color: 'text-rose-700 bg-rose-50 border-rose-200' }
  ];

  const years = [2025, 2020, 2015, 2010, 2005];

  const handleReset = () => {
    setSelectedState('IN-UP');
    setSelectedDistrict('UP-AMT');
    setSelectedYear(2025);
    setSelectedCategory('agricultural');
  };

  const quickDistricts = [
    { code: 'UP-AMT', name: 'Amethi (Gauriganj)', state: 'IN-UP' },
    { code: 'UP-LKO', name: 'Lucknow', state: 'IN-UP' },
    { code: 'UP-GBN', name: 'Noida (GB Nagar)', state: 'IN-UP' },
    { code: 'UP-GKP', name: 'Gorakhpur', state: 'IN-UP' }
  ];

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-2.5 shadow-xs backdrop-blur-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Main Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1">
          {/* State Selector */}
          <div className="relative min-w-[140px]">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5 text-left">State</label>
            <div className="relative">
              <select
                value={selectedState}
                onChange={e => setSelectedState(e.target.value)}
                className="w-full appearance-none pl-7 pr-7 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {states.map(s => (
                  <option key={s.state_code} value={s.state_code}>
                    {s.state_name}
                  </option>
                ))}
              </select>
              <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* District Selector */}
          <div className="relative min-w-[160px] sm:min-w-[180px]">
            <label className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-0.5 text-left">District Focus</label>
            <div className="relative">
              <select
                value={selectedDistrict}
                onChange={e => setSelectedDistrict(e.target.value)}
                className="w-full appearance-none pl-7 pr-7 py-1.5 text-xs font-bold bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {districts.map(d => (
                  <option key={d.district_code} value={d.district_code}>
                    📍 {d.district_name}
                  </option>
                ))}
                <option value="ALL">All Districts (State Aggregate)</option>
              </select>
              <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <ChevronDown className="w-3 h-3 text-emerald-700 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Year Selector */}
          <div className="relative min-w-[90px]">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5 text-left">Series Year</label>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="w-full appearance-none pl-7 pr-6 py-1.5 text-xs font-semibold font-mono bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {years.map(y => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <Calendar className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Category Selector */}
          <div className="relative min-w-[150px]">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5 text-left">Classification</label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value as LandCategory)}
                className="w-full appearance-none pl-7 pr-7 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <Layers className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Quick-Select District Pills & Reset */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 lg:pt-0">
          <span className="text-[11px] font-medium text-slate-400 mr-1 hidden xl:inline">Quick Jump:</span>
          {quickDistricts.map(qd => {
            const isSelected = selectedDistrict === qd.code;
            return (
              <button
                key={qd.code}
                onClick={() => {
                  setSelectedState(qd.state);
                  setSelectedDistrict(qd.code);
                }}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/50'
                }`}
              >
                {qd.name}
              </button>
            );
          })}

          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 transition-colors ml-1"
            title="Reset Scope to Amethi (Gauriganj)"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
