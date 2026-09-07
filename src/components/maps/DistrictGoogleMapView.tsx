import React, { useState } from 'react';
import {
  MapPin,
  Layers,
  Maximize2,
  ExternalLink,
  Eye,
  CheckCircle2,
  Sparkles,
  Info,
  Navigation,
  Globe
} from 'lucide-react';

interface DistrictGoogleMapViewProps {
  districtName?: string;
  districtCode?: string;
  stateName?: string;
  centerCoords?: [number, number];
  isModal?: boolean;
  onClose?: () => void;
}

export const DistrictGoogleMapView: React.FC<DistrictGoogleMapViewProps> = ({
  districtName = 'Amethi (Gauriganj)',
  districtCode = 'UP-AMT',
  stateName = 'Uttar Pradesh',
  centerCoords = [26.2167, 81.6833],
  isModal = false,
  onClose
}) => {
  const [mapType, setMapType] = useState<'hybrid' | 'satellite' | 'roadmap' | 'terrain'>('hybrid');
  const [zoomLevel, setZoomLevel] = useState<number>(11);
  const [showTehsils, setShowTehsils] = useState<boolean>(true);
  const [showSodicReclamation, setShowSodicReclamation] = useState<boolean>(true);
  const [showCanals, setShowCanals] = useState<boolean>(true);
  const [showIndustrial, setShowIndustrial] = useState<boolean>(true);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const [lat, lng] = centerCoords;

  // Specific GIS Points of Interest for Amethi (Gauriganj)
  const tehsils = [
    {
      id: 'teh-1',
      name: 'Gauriganj (District HQ)',
      coords: [26.2167, 81.6833] as [number, number],
      areaSqKm: 486,
      builtupPct: 18.5,
      agriPct: 62.0,
      description: 'District Administrative Headquarters, Collectorate, Vikas Bhawan, and emerging urban-institutional hub.',
      type: 'hq'
    },
    {
      id: 'teh-2',
      name: 'Amethi Tehsil',
      coords: [26.1500, 81.8100] as [number, number],
      areaSqKm: 612,
      builtupPct: 12.0,
      agriPct: 68.2,
      description: 'Historic municipal council, agricultural marketplace, and grain storage warehousing cluster.',
      type: 'tehsil'
    },
    {
      id: 'teh-3',
      name: 'Musafirkhana Tehsil',
      coords: [26.3700, 81.7900] as [number, number],
      areaSqKm: 654,
      builtupPct: 11.8,
      agriPct: 67.5,
      description: 'Key agrarian belt with extensive Sodic Land Reclamation (UPSLRP Phase III) and canal branching.',
      type: 'tehsil'
    },
    {
      id: 'teh-4',
      name: 'Tiloi Tehsil',
      coords: [26.3333, 81.5000] as [number, number],
      areaSqKm: 577,
      builtupPct: 10.5,
      agriPct: 66.8,
      description: 'Western agrarian border adjoining Raebareli, prominent sugarcane and pulse cultivation zone.',
      type: 'tehsil'
    }
  ];

  const specialZones = [
    {
      id: 'zone-1',
      name: 'UPSLRP Sodic Reclamation Tract (Musafirkhana - Gauriganj)',
      coords: [26.2800, 81.7300] as [number, number],
      type: 'reclamation',
      stat: '8,150+ Hectares Reclaimed',
      color: 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
    },
    {
      id: 'zone-2',
      name: 'Sharda Sahayak Feeder Canal Network & PMKSY Tubewells',
      coords: [26.2500, 81.6500] as [number, number],
      type: 'canal',
      stat: '89.4% Gross Irrigation Coverage',
      color: 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
    },
    {
      id: 'zone-3',
      name: 'Jagdishpur Industrial Growth Centre',
      coords: [26.4300, 81.6200] as [number, number],
      type: 'industrial',
      stat: 'BHEL, Fertilizer, & MSME Cluster',
      color: 'border-amber-500 bg-amber-500/20 text-amber-300'
    }
  ];

  // Google Maps Direct External URL
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const googleEarthUrl = `https://earth.google.com/web/search/${districtName}+${stateName}/@${lat},${lng},100a,35000d,35y,0h,0t,0r`;

  // Google Map Embed URL
  const googleMapEmbedUrl = `https://maps.google.com/maps?q=${lat},${lng}&t=${
    mapType === 'satellite' ? 'k' : mapType === 'hybrid' ? 'h' : mapType === 'terrain' ? 'p' : 'm'
  }&z=${zoomLevel}&output=embed`;

  return (
    <div className={`flex flex-col bg-slate-950 text-white rounded-2xl overflow-hidden border border-slate-800 shadow-2xl ${isModal ? 'max-h-[90vh]' : ''}`}>
      {/* Map Header Toolbar */}
      <div className="p-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm md:text-base text-white">
                Google Maps Land & Geospatial Explorer: {districtName}
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live Google Satellite & Hybrid Imagery with GIS Cadastral Overlays, Sodic Land Reclamation & Tehsil Hubs.
            </p>
          </div>
        </div>

        {/* Controls & External Links */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Map Layer Mode Toggles */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setMapType('hybrid')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                mapType === 'hybrid' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Hybrid
            </button>
            <button
              onClick={() => setMapType('satellite')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                mapType === 'satellite' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapType('roadmap')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                mapType === 'roadmap' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Roadmap
            </button>
            <button
              onClick={() => setMapType('terrain')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                mapType === 'terrain' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Terrain
            </button>
          </div>

          {/* Direct Google Maps & Earth Navigation */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <a
            href={googleEarthUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Google Earth 3D</span>
          </a>

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Layer Filters & POI Filter Strip */}
      <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between gap-3 text-xs overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          <Layers className="w-3.5 h-3.5 text-brand-400" />
          <span className="font-semibold text-slate-300">GIS Overlays:</span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
            <input
              type="checkbox"
              checked={showTehsils}
              onChange={e => setShowTehsils(e.target.checked)}
              className="rounded border-slate-700 text-brand-600 focus:ring-brand-500 bg-slate-800"
            />
            <span className="flex items-center gap-1 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              4 Administrative Tehsils
            </span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
            <input
              type="checkbox"
              checked={showSodicReclamation}
              onChange={e => setShowSodicReclamation(e.target.checked)}
              className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-800"
            />
            <span className="flex items-center gap-1 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Sodic/Usar Reclamation Zones (UPSLRP)
            </span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
            <input
              type="checkbox"
              checked={showCanals}
              onChange={e => setShowCanals(e.target.checked)}
              className="rounded border-slate-700 text-cyan-600 focus:ring-cyan-500 bg-slate-800"
            />
            <span className="flex items-center gap-1 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Sharda Sahayak Canal Grid
            </span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
            <input
              type="checkbox"
              checked={showIndustrial}
              onChange={e => setShowIndustrial(e.target.checked)}
              className="rounded border-slate-700 text-amber-600 focus:ring-amber-500 bg-slate-800"
            />
            <span className="flex items-center gap-1 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Jagdishpur Industrial Hub
            </span>
          </label>
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400 text-[11px]">
          <span>Zoom:</span>
          <button
            onClick={() => setZoomLevel(Math.min(18, zoomLevel + 1))}
            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center"
          >
            +
          </button>
          <span className="w-6 text-center font-mono">{zoomLevel}</span>
          <button
            onClick={() => setZoomLevel(Math.max(6, zoomLevel - 1))}
            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center"
          >
            -
          </button>
        </div>
      </div>

      {/* Main Map Canvas & Interactive Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[460px] relative">
        {/* Interactive Google Map Iframe Viewer */}
        <div className="lg:col-span-3 relative h-[460px] bg-slate-900 overflow-hidden">
          <iframe
            title={`Google Map - ${districtName}`}
            src={googleMapEmbedUrl}
            className="w-full h-full border-0 filter saturate-[1.1]"
            loading="lazy"
            allowFullScreen
          />

          {/* Floating Live Badge & Watermark */}
          <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs shadow-lg pointer-events-none flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold text-white">Google Maps High-Res {mapType.toUpperCase()} View</span>
            <span className="text-slate-400">| Scale 1:{Math.round(500000 / zoomLevel)}</span>
          </div>

          {/* Floating Key Tehsils Overlay Bar */}
          {showTehsils && districtCode === 'UP-AMT' && (
            <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-700/80 shadow-2xl flex items-center justify-between gap-2 overflow-x-auto text-xs">
              <span className="font-bold text-slate-300 shrink-0 text-[11px] uppercase tracking-wider flex items-center gap-1">
                <Navigation className="w-3 h-3 text-red-400" />
                Quick Tehsil Center:
              </span>
              <div className="flex items-center gap-2 shrink-0">
                {tehsils.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedFeature(t.name)}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                      selectedFeature === t.name
                        ? 'bg-red-500/20 text-red-300 border-red-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    📍 {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: District GIS & Land-Use Profiles */}
        <div className="p-4 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 space-y-4 text-xs overflow-y-auto max-h-[460px]">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                Tehsil Boundaries & Land Area
              </span>
              <span className="text-[10px] text-slate-400 font-mono">4 Administrative Units</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Total Geographical Area: <strong className="text-white">2,329 km²</strong> (2,32,900 Ha).
            </p>

            <div className="space-y-2">
              {tehsils.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedFeature(t.name)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                    selectedFeature === t.name
                      ? 'bg-brand-950/60 border-brand-500 text-white'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-100 flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${t.type === 'hq' ? 'bg-red-400' : 'bg-brand-400'}`} />
                      {t.name}
                    </span>
                    <span className="font-mono text-slate-300">{t.areaSqKm} km²</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>Agri: <strong className="text-slate-200">{t.agriPct}%</strong></span>
                    <span>Built-up: <strong className="text-slate-200">{t.builtupPct}%</strong></span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                    {t.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Reclamation & Water Features */}
          <div className="pt-2 border-t border-slate-800">
            <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] block mb-2">
              Specialized Land Interventions
            </span>
            <div className="space-y-2">
              {specialZones.map(z => (
                <div key={z.id} className={`p-2 rounded-lg border ${z.color}`}>
                  <div className="font-bold text-[11px] text-slate-100 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    {z.name}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-300 mt-0.5">
                    {z.stat}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
