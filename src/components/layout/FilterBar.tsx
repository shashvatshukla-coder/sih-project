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

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-3 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Main Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
            <Filter className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span className="hidden sm:inline">Active Scope:</span>
          </div>

          {/* State Selector */}
          <div className="relative min-w-[150px] sm:min-w-[170px]">
            <select
              value={selectedState}
              onChange={e => setSelectedState(e.target.value)}
              className="w-full appearance-none pl-8 pr-8 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              {states.map(s => (
                <option key={s.state_code} value={s.state_code}>
                  {s.state_name}
                </option>
              ))}
            </select>
            <MapPin className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* District Selector */}
          <div className="relative min-w-[160px] sm:min-w-[190px]">
            <select
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
              className="w-full appearance-none pl-8 pr-8 py-1.5 text-xs font-bold bg-brand-50/70 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200 border border-brand-300 dark:border-brand-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              {districts.map(d => (
                <option key={d.district_code} value={d.district_code}>
                  📍 {d.district_name}
                </option>
              ))}
              <option value="ALL">All Districts (State-Level Aggregate)</option>
            </select>
            <MapPin className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Year Selector */}
          <div className="relative min-w-[100px]">
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="w-full appearance-none pl-8 pr-8 py-1.5 text-xs font-semibold font-mono bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              {years.map(y => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Category Selector */}
          <div className="relative min-w-[160px]">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value as LandCategory)}
              className="w-full appearance-none pl-8 pr-8 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Reset / Status Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Reset Scope to Amethi (Gauriganj)"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden md:inline">Reset to Amethi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
