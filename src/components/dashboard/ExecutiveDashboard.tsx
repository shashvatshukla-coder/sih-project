import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MetricCard } from '../common/MetricCard';
import { LandDistributionDonut } from '../charts/LandDistributionDonut';
import { HistoricalTrendLine } from '../charts/HistoricalTrendLine';
import { StateComparisonBar } from '../charts/StateComparisonBar';
import { LandConversionFlow } from '../charts/LandConversionFlow';
import { IndiaMapExplorer } from '../maps/IndiaMapExplorer';
import { DistrictGoogleMapView } from '../maps/DistrictGoogleMapView';
import { DistrictReportModal } from '../reports/DistrictReportModal';
import { SourceBadge } from '../common/SourceBadge';
import {
  TrendingUp,
  Sparkles,
  MapPin,
  ArrowRight,
  Database,
  BookOpen,
  AlertTriangle,
  Layers,
  FileCheck2,
  CheckCircle2,
  Download,
  ExternalLink,
  Globe,
  Maximize2
} from 'lucide-react';

export const ExecutiveDashboard: React.FC = () => {
  const {
    selectedState,
    selectedDistrict,
    selectedYear,
    states,
    districts,
    currentRecord,
    setActivePage,
    setSelectedState,
    setSelectedDistrict,
    runAIQuery
  } = useApp();

  const [showGoogleMapModal, setShowGoogleMapModal] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  const activeState = states.find(s => s.state_code === selectedState);
  const activeDistrict = selectedDistrict !== 'ALL'
    ? districts.find(d => d.district_code === selectedDistrict) || (selectedDistrict === 'UP-AMT' ? { district_code: 'UP-AMT', district_name: 'Amethi (Gauriganj)', state_code: 'IN-UP', state_name: 'Uttar Pradesh', total_area_sqkm: 2329, center_coords: [26.2167, 81.6833] as [number, number] } : null)
    : null;

  // Key UP Districts & Watchlist
  const upDistricts = [
    { name: 'Amethi (Gauriganj)', state: 'Uttar Pradesh', code: 'UP-AMT', stateCode: 'IN-UP', areaSqKm: 2329, agriPct: 66.0, builtupPct: 13.2, irrigatedPct: 89.4, changeText: '-36.1% Usar/Sodic reclamation & Gauriganj HQ growth', status: 'focus' },
    { name: 'Lucknow', state: 'Uttar Pradesh', code: 'UP-LKO', stateCode: 'IN-UP', areaSqKm: 2528, agriPct: 52.0, builtupPct: 33.5, irrigatedPct: 91.2, changeText: '+28.8% Urban growth along Outer Ring Road', status: 'warning' },
    { name: 'Gautam Buddha Nagar', state: 'Uttar Pradesh', code: 'UP-GBN', stateCode: 'IN-UP', areaSqKm: 1442, agriPct: 44.9, builtupPct: 42.9, irrigatedPct: 94.5, changeText: '-36.5% Agri loss (Jewar airport corridor)', status: 'critical' },
    { name: 'Gorakhpur', state: 'Uttar Pradesh', code: 'UP-GKP', stateCode: 'IN-UP', areaSqKm: 3321, agriPct: 71.2, builtupPct: 10.6, irrigatedPct: 86.4, changeText: '-4.7% Wetland/Tal reduction in floodplain', status: 'warning' },
    { name: 'Varanasi', state: 'Uttar Pradesh', code: 'UP-VNS', stateCode: 'IN-UP', areaSqKm: 1535, agriPct: 58.4, builtupPct: 24.1, irrigatedPct: 92.0, changeText: '+18.4% Ring road & infrastructure sprawl', status: 'normal' },
    { name: 'Ayodhya (Faizabad)', state: 'Uttar Pradesh', code: 'UP-AYO', stateCode: 'IN-UP', areaSqKm: 2522, agriPct: 67.8, builtupPct: 14.5, irrigatedPct: 88.0, changeText: '+32.0% Tourism corridor & airport expansion', status: 'normal' }
  ];

  const handleDistrictClick = (stateCode: string, districtCode: string) => {
    setSelectedState(stateCode);
    setSelectedDistrict(districtCode);
  };

  // Clean View Tabs State
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'trends' | 'benchmarks'>('overview');

  return (
    <div className="space-y-6 text-left">
      {/* Executive Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-sm border border-slate-200 dark:border-slate-700 shrink-0 hidden sm:flex items-center justify-center">
            <img src="/bhu-drishti-logo.png" alt="Bhu-Drishti" className="w-full h-full object-cover object-top" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
              <span>BHU-DRISHTI • National Land Records & Geospatial Portal</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
              <span>Land Intelligence Dashboard:</span>
              <span className="text-emerald-700 dark:text-emerald-300 font-extrabold underline decoration-emerald-400">
                {activeDistrict ? activeDistrict.district_name : activeState?.state_name || 'Amethi (Gauriganj)'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Active Scope: <strong>{activeDistrict ? `${activeDistrict.district_name}, ${activeState?.state_name || 'UP'}` : 'Uttar Pradesh (All 75 Districts)'}</strong> • Series Year: <strong>{selectedYear}</strong> • 9-Fold Classification Scheme.
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleDistrictClick('IN-UP', 'UP-AMT')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              selectedDistrict === 'UP-AMT'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border-slate-200 dark:border-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Scope: Amethi (Gauriganj)</span>
          </button>

          <button
            onClick={() => setShowGoogleMapModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Google Maps View</span>
          </button>

          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Generate Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Clean Dashboard Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <span>📊 Overview & KPIs</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'map'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <span>🗺️ Satellite & GIS Explorer</span>
        </button>

        <button
          onClick={() => setActiveTab('trends')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'trends'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <span>📈 Land Conversion & Trends</span>
        </button>

        <button
          onClick={() => setActiveTab('benchmarks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'benchmarks'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <span>🏛️ UP District Benchmarks</span>
        </button>
      </div>

      {/* KPI Cards Strip */}
      {currentRecord && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            title="Total Geographic Area"
            value={Math.round((activeDistrict ? activeDistrict.total_area_sqkm : 2329)).toLocaleString()}
            unit="km²"
            tooltip="Official reported geographical boundary area."
            sourceText="MoA&FW / Board of Revenue"
          />
          <MetricCard
            title="Agricultural Land"
            value={`${currentRecord.agricultural_pct}%`}
            changePct={-3.5}
            tooltip="Net sown area plus cultivable fallow parcels."
            sourceText="MoA&FW 2025"
          />
          <MetricCard
            title="Forest Cover"
            value={`${currentRecord.forest_pct}%`}
            changePct={+0.8}
            tooltip="Canopy forest density and social forestry corridors."
            sourceText="FSI ISFR 2025"
          />
          <MetricCard
            title="Built-up / Urban Area"
            value={`${currentRecord.builtup_pct}%`}
            changePct={+5.2}
            tooltip="Land occupied by Gauriganj HQ, housing colonies, and infrastructure."
            sourceText="NRSC Bhuvan"
          />
          <MetricCard
            title="Barren & Usar Land"
            value={`${currentRecord.barren_pct}%`}
            changePct={-3.5}
            tooltip="Sodic/Usar wasteland reclaimed into productive agriculture under UPSLRP."
            sourceText="UP Bhumi Sudhar Nigam"
          />
          <MetricCard
            title="Irrigation Ratio"
            value={`${currentRecord.irrigated_pct || 89.4}%`}
            changePct={+12.9}
            tooltip="Sharda Sahayak canal system & PMKSY tubewell coverage."
            sourceText="MoJS / PMKSY"
          />
        </div>
      )}

      {/* Tab 1: Executive Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Gemini AI Grounded Quick Insights Strip */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-slate-50 to-teal-50 dark:from-emerald-950/20 dark:via-slate-900 dark:to-teal-950/20 border border-emerald-200/70 dark:border-emerald-900/40 text-xs text-slate-800 dark:text-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>Google Gemini 1.5 Grounded Insights ({activeDistrict ? activeDistrict.district_name : 'Amethi - Gauriganj'})</span>
              </div>
              <button
                onClick={() => {
                  runAIQuery('Show land statistics of Gauriganj, Amethi (UP)');
                }}
                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Ask Gemini Assistant →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[12px] text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span><strong>Sodic Reclamation:</strong> Barren usar wastelands in Amethi decreased from 9.7% to 6.2%, reclaiming 8,150+ hectares into productive multi-crop agriculture.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span><strong>HQ Urbanization:</strong> Gauriganj administrative headquarters development expanded built-up share to 13.2% (+5.2 pp shift).</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span><strong>Irrigation Coverage:</strong> Sharda Sahayak canal feeds and PMKSY tubewells raised gross irrigated farmland in Amethi to 89.4%.</span>
              </div>
            </div>
          </div>

          {/* Primary Visualizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Land-Use Donut */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                  Land-Use Distribution: {activeDistrict ? activeDistrict.district_name : 'Amethi (Gauriganj)'}
                </h3>
                <SourceBadge source="MoA&FW / DES 2025" />
              </div>
              <LandDistributionDonut record={currentRecord} />
            </div>

            {/* State Comparison Bar */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                  District Benchmark: Agricultural Land %
                </h3>
                <span className="text-xs text-slate-400">Regional Rankings</span>
              </div>
              <StateComparisonBar category="agricultural" />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Map & GIS Explorer */}
      {activeTab === 'map' && (
        <div className="space-y-6">
          {/* Embedded Google Maps View & GIS Controls */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Google Maps Satellite & Tehsil GIS Explorer: {activeDistrict ? activeDistrict.district_name : 'Amethi (Gauriganj)'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Switch between Hybrid, Satellite, and Terrain views. Inspect Gauriganj HQ, Amethi, Musafirkhana, and Tiloi.
                </p>
              </div>
            </div>

            <DistrictGoogleMapView
              districtName={activeDistrict ? activeDistrict.district_name : 'Amethi (Gauriganj)'}
              districtCode={selectedDistrict}
              stateName={activeState?.state_name || 'Uttar Pradesh'}
              centerCoords={
                selectedDistrict === 'UP-AMT'
                  ? [26.2167, 81.6833]
                  : selectedDistrict === 'UP-LKO'
                  ? [26.8467, 80.9462]
                  : selectedDistrict === 'UP-GBN'
                  ? [28.5355, 77.3910]
                  : selectedDistrict === 'UP-GKP'
                  ? [26.7606, 83.3732]
                  : [26.2167, 81.6833]
              }
            />
          </div>

          {/* Geospatial Map Explorer Section */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                  Interactive India Geospatial Map Explorer
                </h3>
                <span className="text-xs text-slate-400">
                  Choropleth mapping across 2005–2025 multi-year time series. Click state/district to inspect.
                </span>
              </div>
            </div>

            <IndiaMapExplorer />
          </div>
        </div>
      )}

      {/* Tab 3: Trends & Conversion */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          {/* Decadal Land Conversion Flow */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Amethi / Gauriganj Land Conversion Flow & Transition Dynamics (2010 → 2025)</span>
              </h3>
              <button
                onClick={() => setActivePage('change')}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Full Transition Matrix →
              </button>
            </div>

            <LandConversionFlow stateName="Amethi (Gauriganj, UP)" fromYear={2010} toYear={2025} />
          </div>
        </div>
      )}

      {/* Tab 4: Benchmarks */}
      {activeTab === 'benchmarks' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>District Watchlist & Regional Benchmarks</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Compare key developmental indicators across Uttar Pradesh districts. Click any card to switch scope.
              </p>
            </div>

            {/* UP Districts Quick Switcher Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {upDistricts.map(d => (
                <button
                  key={d.code}
                  onClick={() => handleDistrictClick(d.stateCode, d.code)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedDistrict === d.code
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                      : 'bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {d.name}
                    </span>
                    {d.code === 'UP-AMT' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                        HQ Focus
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono py-2 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Agri</span>
                      <span className="font-bold text-emerald-600">{d.agriPct}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Urban</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{d.builtupPct}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Irrigated</span>
                      <span className="font-bold text-blue-600">{d.irrigatedPct}%</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {d.changeText}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal View for Google Maps */}
      {showGoogleMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-5xl">
            <DistrictGoogleMapView
              districtName={activeDistrict ? activeDistrict.district_name : 'Amethi (Gauriganj)'}
              districtCode={selectedDistrict}
              stateName={activeState?.state_name || 'Uttar Pradesh'}
              centerCoords={
                selectedDistrict === 'UP-AMT'
                  ? [26.2167, 81.6833]
                  : selectedDistrict === 'UP-LKO'
                  ? [26.8467, 80.9462]
                  : selectedDistrict === 'UP-GBN'
                  ? [28.5355, 77.3910]
                  : [26.2167, 81.6833]
              }
              isModal={true}
              onClose={() => setShowGoogleMapModal(false)}
            />
          </div>
        </div>
      )}

      {/* Modal View for PDF Report Generation */}
      <DistrictReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        district={activeDistrict}
        state={activeState}
        record={currentRecord}
        year={selectedYear}
      />
    </div>
  );
};
