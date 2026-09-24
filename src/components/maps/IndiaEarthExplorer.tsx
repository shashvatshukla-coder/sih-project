import React, { useMemo, useState } from 'react';
import { Box, Database, Map, MousePointer2, Orbit, Smartphone } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EarthGlobe } from '../EarthGlobe/EarthGlobe';
import { buildGlobeLocations, type GeoLocation } from '../EarthGlobe/locationData';

export const IndiaEarthExplorer: React.FC = () => {
  const {
    states,
    districts,
    selectedState,
    setSelectedState,
    setSelectedDistrict,
    setActivePage
  } = useApp();
  const [selectedLocationId, setSelectedLocationId] = useState('country-IN');
  const locations = useMemo(() => buildGlobeLocations(states, districts), [districts, states]);

  const handleLocationSelect = (location: GeoLocation) => {
    setSelectedLocationId(location.id);
    if (location.type === 'state') setSelectedState(location.sourceId);
    if (location.type === 'district') {
      const parentStateCode = location.parentId?.replace(/^state-/, '');
      if (parentStateCode && parentStateCode !== selectedState) setSelectedState(parentStateCode);
      setSelectedDistrict(location.sourceId);
    }
  };

  const handleStatePicker = (stateCode: string) => {
    if (stateCode === 'IN-ALL') {
      setSelectedLocationId('country-IN');
      return;
    }
    setSelectedState(stateCode);
    setSelectedLocationId(`state-${stateCode}`);
  };

  const exploreLocation = (location: GeoLocation) => {
    handleLocationSelect(location);
    setActivePage('map');
  };

  return (
    <div className="space-y-5 text-left">
      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative p-5 sm:p-6">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-2/5 bg-gradient-to-l from-emerald-500/10 to-transparent" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.17em] text-emerald-700 dark:text-emerald-400"><Orbit className="h-4 w-4"/>Immersive geospatial workspace</div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Explore India in 3D</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Explore India's land, geography and regional data through an interactive 3D globe.</p>
            </div>
            <label className="relative z-10 min-w-0 sm:min-w-64">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Focus a state</span>
              <select value={selectedLocationId === 'country-IN' ? 'IN-ALL' : selectedState} onChange={(event) => handleStatePicker(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                <option value="IN-ALL">All India</option>
                {states.filter((state) => state.state_code !== 'IN-ALL').map((state) => <option key={state.state_code} value={state.state_code}>{state.state_name}</option>)}
              </select>
            </label>
          </div>
        </div>
      </header>

      <EarthGlobe
        locations={locations}
        selectedLocationId={selectedLocationId}
        onLocationSelect={handleLocationSelect}
        onExploreLocation={exploreLocation}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-start gap-3"><div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"><MousePointer2 className="h-5 w-5"/></div><div><h2 className="text-sm font-bold text-slate-900 dark:text-white">Explore spatial hierarchy</h2><p className="mt-1 text-xs leading-5 text-slate-500">Select India, a state, then an available district marker. The camera moves smoothly without replacing the detailed 2D tools.</p></div></div></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-start gap-3"><div className="rounded-xl bg-sky-50 p-2.5 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"><Database className="h-5 w-5"/></div><div><h2 className="text-sm font-bold text-slate-900 dark:text-white">Connected catalogue</h2><p className="mt-1 text-xs leading-5 text-slate-500">Markers reuse the existing states and districts APIs. No parallel database or invented administrative boundary is introduced.</p></div></div></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-start gap-3"><div className="rounded-xl bg-amber-50 p-2.5 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"><Smartphone className="h-5 w-5"/></div><div><h2 className="text-sm font-bold text-slate-900 dark:text-white">2D detail remains available</h2><p className="mt-1 text-xs leading-5 text-slate-500">Use the Explore Data action to continue into the existing GIS map and district analysis workflow.</p><button type="button" onClick={() => setActivePage('map')} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-600 dark:text-emerald-400"><Map className="h-3.5 w-3.5"/>Open GIS & Maps</button></div></div></article>
      </section>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/60">
        <span><strong className="text-slate-700 dark:text-slate-300">{states.filter((state) => state.state_code !== 'IN-ALL').length}</strong> state reference points</span>
        <span><strong className="text-slate-700 dark:text-slate-300">{districts.length}</strong> district reference points loaded for the selected state</span>
        <span className="inline-flex items-center gap-1"><Box className="h-3.5 w-3.5"/>Satellite imagery and world terrain activate only when a Cesium ion token is configured.</span>
      </div>
    </div>
  );
};

export default IndiaEarthExplorer;
