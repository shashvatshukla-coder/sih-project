import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
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
  Minus,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Quote
} from 'lucide-react';

interface BannerSlide {
  id: number;
  image: string;
  badge: string;
  title: string;
  highlight: string;
  subtitle: string;
  quote: string;
  author: string;
}

const BANNER_SLIDES: BannerSlide[] = [
  {
    id: 1,
    image: '/banners/slide1_rainbow.png',
    badge: 'National Land Vision',
    title: 'Knowledge Today.',
    highlight: 'Better Land Governance Tomorrow.',
    subtitle: 'A collaborative national ecosystem for open data, research, policy and geospatial innovation.',
    quote: '"Sustainable land governance for a stronger, inclusive and resilient India."',
    author: 'Government of India • MoA&FW'
  },
  {
    id: 2,
    image: '/banners/slide2_earth_art.png',
    badge: 'Ecological Equilibrium',
    title: 'Preserving Soil.',
    highlight: 'Empowering Generations.',
    subtitle: 'Harmonizing agriculture, agroforestry and ecological balance through AI-driven intelligence.',
    quote: '"The land is the foundation of all economic vitality and life itself; nurture it with wisdom."',
    author: 'National Land Policy Council'
  },
  {
    id: 3,
    image: '/banners/slide3_mother_nature.png',
    badge: 'Land Reclamation',
    title: 'Reclaiming Wasters.',
    highlight: 'Expanding Green Canopies.',
    subtitle: 'Transforming sodic and degraded soils into productive agricultural zones across Uttar Pradesh.',
    quote: '"To restore the soil is to safeguard our civilization\'s future food security and ecological wealth."',
    author: 'UP Bhumi Sudhar Nigam • Sodic Reclamation'
  },
  {
    id: 4,
    image: '/banners/slide4_space_earth.png',
    badge: 'Space & Remote Sensing',
    title: 'Precision from Space.',
    highlight: 'Decisions on Earth.',
    subtitle: 'Harnessing multi-spectral remote sensing (ISRO Bhuvan & Sentinel) for transparent cadastral governance.',
    quote: '"One unified evidence layer for every agricultural, forest, and spatial development decision."',
    author: 'ISRO • National Remote Sensing Centre (NRSC)'
  },
  {
    id: 5,
    image: '/banners/slide5_rainforest.png',
    badge: 'Catchment & Rivers',
    title: 'Protecting Watercourses.',
    highlight: 'Securing Catchment Basins.',
    subtitle: 'Safeguarding rivers, floodplains, and irrigated agricultural plains for national prosperity.',
    quote: '"Water is the lifeblood of our fields; land governance must protect every riverbank and wetland."',
    author: 'Ministry of Jal Shakti & Agriculture'
  }
];

export const ExecutiveDashboard: React.FC = () => {
  const {
    states,
    selectedState,
    setSelectedState,
    setActivePage
  } = useApp();

  const [selectedLayer, setSelectedLayer] = useState<string>('land-use');
  const [mapZoom, setMapZoom] = useState<number>(1);
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  // Auto-advance slides continuously every 4.8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNER_SLIDES.length);
    }, 4800);
    return () => clearInterval(interval);
  }, []);

  const activeSlideData = BANNER_SLIDES[currentSlide];

  return (
    <div className="space-y-6 text-left pb-10">
      {/* =========================================================================
          1. ALIVE HERO PANORAMIC CAROUSEL WITH DYNAMIC THOUGHTS & ANIMATIONS
      ========================================================================= */}
      <div 
        className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-200/50 dark:border-slate-800 shadow-lg group min-h-[280px] md:min-h-[320px] flex items-center"
      >
        {/* Render all background images with vivid clarity, smooth opacity transitions & Ken Burns zoom */}
        {BANNER_SLIDES.map((slide, idx) => (
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
            {/* Gentle, Transparent Vignette (keeps the artwork vivid and colorful) */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
          </div>
        ))}

        {/* Slide Content Layer with Glassmorphism for Crystal-Clear Readability */}
        <div className="relative z-10 p-6 md:p-8 w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Left Text Card - Frosted Glass Box */}
          <div className="max-w-xl text-left space-y-2 p-5 rounded-2xl bg-black/35 backdrop-blur-md border border-white/20 shadow-2xl">
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
          {BANNER_SLIDES.map((slide, idx) => (
            <div
              key={slide.id}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === currentSlide
                  ? 'w-8 bg-emerald-400 shadow-sm shadow-emerald-400/80'
                  : 'w-1.5 bg-white/40'
              }`}
            />
          ))}

          <span className="text-[9px] text-emerald-300 font-mono font-bold ml-1">
            0{currentSlide + 1} / 0{BANNER_SLIDES.length}
          </span>
        </div>
      </div>

      {/* =========================================================================
          2. 5 PASTEL KPI CARDS ROW
      ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Datasets */}
        <div
          onClick={() => setActivePage('datasets')}
          className="p-4 rounded-2xl bg-[#eef8f2] dark:bg-emerald-950/30 border border-[#d2edd9] dark:border-emerald-900/40 flex items-center gap-3.5 cursor-pointer hover:shadow-sm transition-all group"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#227248] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Database className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-none">
              12,450
            </p>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
              Datasets
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              From 35+ Departments
            </p>
          </div>
        </div>

        {/* Card 2: Research Publications */}
        <div
          onClick={() => setActivePage('research')}
          className="p-4 rounded-2xl bg-[#eef5fc] dark:bg-blue-950/30 border border-[#d2e4f7] dark:border-blue-900/40 flex items-center gap-3.5 cursor-pointer hover:shadow-sm transition-all group"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#1d63b8] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-none">
              3,250
            </p>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
              Research Publications
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              Across 500+ Institutions
            </p>
          </div>
        </div>

        {/* Card 3: Policy Documents */}
        <div
          onClick={() => setActivePage('policy')}
          className="p-4 rounded-2xl bg-[#fdf2ec] dark:bg-orange-950/30 border border-[#fae0d1] dark:border-orange-900/40 flex items-center gap-3.5 cursor-pointer hover:shadow-sm transition-all group"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#d45d29] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-none">
              1,200
            </p>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
              Policy Documents
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              Central & State
            </p>
          </div>
        </div>

        {/* Card 4: Geospatial Layers */}
        <div
          onClick={() => setActivePage('map')}
          className="p-4 rounded-2xl bg-[#f6effa] dark:bg-purple-950/30 border border-[#edd9f6] dark:border-purple-900/40 flex items-center gap-3.5 cursor-pointer hover:shadow-sm transition-all group"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#8338a8] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-none">
              8,700
            </p>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
              Geospatial Layers
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              Nationwide Coverage
            </p>
          </div>
        </div>

        {/* Card 5: Registered Users */}
        <div
          onClick={() => setActivePage('workspace')}
          className="p-4 rounded-2xl bg-[#eefaf6] dark:bg-teal-950/30 border border-[#cff2e6] dark:border-teal-900/40 flex items-center gap-3.5 cursor-pointer hover:shadow-sm transition-all group col-span-2 sm:col-span-1"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#1b8a6b] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-none">
              2,450
            </p>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
              Registered Users
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              Researchers | Policymakers
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. MAIN 3-COLUMN GRID
      ========================================================================= */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* =======================================================================
            LEFT COLUMN: INTERACTIVE LAND USE MAP (Col-span 5)
        ======================================================================= */}
        <div className="col-span-12 lg:col-span-5 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Interactive Land Use Map
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Explore geospatial data across India
                </p>
              </div>
            </div>

            {/* Map Frame with Leaflet Satellite Raster & Custom Polygon Preview */}
            <div className="relative mt-4 w-full h-72 rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center group">
              {/* Satellite / Terrain GIS Map Background */}
              <img
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80"
                alt="India Geospatial Map"
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                style={{ filter: 'saturate(1.4) hue-rotate(25deg)' }}
              />

              {/* Map SVG Overlay with state highlight */}
              <div className="absolute inset-0 bg-emerald-950/20 backdrop-brightness-95 pointer-events-none" />

              {/* Zoom Controls */}
              <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                <button
                  onClick={() => setMapZoom(z => Math.min(z + 0.2, 1.8))}
                  className="w-7 h-7 rounded-lg bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-white flex items-center justify-center font-bold text-sm shadow-sm hover:bg-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setMapZoom(z => Math.max(z - 0.2, 0.8))}
                  className="w-7 h-7 rounded-lg bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-white flex items-center justify-center font-bold text-sm shadow-sm hover:bg-white transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Color-Coded Legend Overlay */}
              <div className="absolute bottom-3 right-3 p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-[10px] space-y-1.5 shadow-sm text-left">
                <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                  <span className="w-2.5 h-2.5 rounded bg-[#84cc16]" />
                  <span>Agricultural Land</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                  <span className="w-2.5 h-2.5 rounded bg-[#16a34a]" />
                  <span>Forest Land</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                  <span className="w-2.5 h-2.5 rounded bg-[#dc2626]" />
                  <span>Urban Area</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                  <span className="w-2.5 h-2.5 rounded bg-[#2563eb]" />
                  <span>Water Bodies</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                  <span className="w-2.5 h-2.5 rounded bg-[#eab308]" />
                  <span>Other Land</span>
                </div>
              </div>
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
            MIDDLE COLUMN: KEY INSIGHTS (Col-span 3)
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
              <button
                onClick={() => setActivePage('trends')}
                className="text-xs font-bold text-[#1b5e3a] hover:underline"
              >
                View All
              </button>
            </div>

            {/* Metric Items List */}
            <div className="mt-4 space-y-4">
              {/* Item 1 */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-base font-extrabold text-slate-900 dark:text-white leading-none">
                    +12%
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-snug">
                    Increase in digitized land records (2020-2025)
                  </p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Sprout className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-base font-extrabold text-slate-900 dark:text-white leading-none">
                    28%
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-snug">
                    India's land under forest cover
                  </p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-base font-extrabold text-slate-900 dark:text-white leading-none">
                    3.2M
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-snug">
                    Land disputes resolved through digital platforms
                  </p>
                </div>
              </div>

              {/* Item 4 */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-base font-extrabold text-slate-900 dark:text-white leading-none">
                    65+
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-snug">
                    Policy experiments in progress across states
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =======================================================================
            RIGHT COLUMN: RESEARCH PUBLICATIONS & ONGOING EXPERIMENTS (Col-span 4)
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
              <button
                onClick={() => setActivePage('research')}
                className="text-xs font-bold text-[#1b5e3a] hover:underline"
              >
                View All
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {[
                { title: 'AI-based Land Dispute Prediction in India', author: 'IIT Bombay', year: '2024' },
                { title: 'Impact of Digital Land Records on Rural Governance', author: 'IIM Ahmedabad', year: '2024' },
                { title: 'Urban Land Use Change Analysis using Satellite Data', author: 'ISRO', year: '2023' },
                { title: 'Land Consolidation Models for Sustainable Agriculture', author: 'ICAR', year: '2023' }
              ].map((pub, idx) => (
                <div
                  key={idx}
                  onClick={() => setActivePage('research')}
                  className="flex items-start gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                >
                  <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug hover:text-emerald-600 transition-colors">
                      {pub.title}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {pub.author} | {pub.year}
                    </p>
                  </div>
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
                  Ongoing Policy Experiments
                </h2>
              </div>
              <button
                onClick={() => setActivePage('decision-support')}
                className="text-xs font-bold text-[#1b5e3a] hover:underline"
              >
                View All
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {[
                { title: 'Digital Land Record Verification', state: 'Uttar Pradesh', duration: '6 months', status: 'Ongoing', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
                { title: 'Community Land Mapping Initiative', state: 'Maharashtra', duration: '1 year', status: 'Evaluation', color: 'bg-amber-100 text-amber-800 border-amber-200' },
                { title: 'Urban Land Use Policy Reform', state: 'Karnataka', duration: '6 months', status: 'Planning', color: 'bg-blue-100 text-blue-800 border-blue-200' }
              ].map((exp, idx) => (
                <div
                  key={idx}
                  onClick={() => setActivePage('decision-support')}
                  className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-2.5 min-w-0 text-left">
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
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${exp.color} shrink-0`}>
                    {exp.status}
                  </span>
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

        {/* Upcoming Events Card (Col-span 4) */}
        <div className="col-span-12 lg:col-span-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-left">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#1b5e3a]" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Upcoming Events
              </h2>
            </div>
            <button
              onClick={() => setActivePage('reports')}
              className="text-xs font-bold text-[#1b5e3a] hover:underline"
            >
              View All
            </button>
          </div>

          <div className="mt-3 flex items-start gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <Calendar className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                National Workshop on Land Governance
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                15 Oct 2025 | New Delhi
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
