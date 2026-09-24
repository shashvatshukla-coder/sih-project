import React, { useMemo, useState } from 'react';
import { ArrowRight, Globe2, Orbit } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EarthGlobe } from '../EarthGlobe/EarthGlobe';
import { buildGlobeLocations, type GeoLocation } from '../EarthGlobe/locationData';

export const DashboardEarthSection: React.FC = () => {
  const {
    states,
    districts,
    selectedState,
    setSelectedState,
    setSelectedDistrict,
    setActivePage
  } = useApp();
  const [selectedLocationId, setSelectedLocationId] = useState('country-IN');
  const locations = useMemo(
    () => buildGlobeLocations(states, districts),
    [districts, states]
  );

  const selectLocation = (location: GeoLocation) => {
    setSelectedLocationId(location.id);

    if (location.type === 'state') {
      setSelectedState(location.sourceId);
      return;
    }

    if (location.type === 'district') {
      const parentStateCode = location.parentId?.replace(/^state-/, '');
      if (parentStateCode && parentStateCode !== selectedState) {
        setSelectedState(parentStateCode);
      }
      setSelectedDistrict(location.sourceId);
    }
  };

  const exploreLocation = (location: GeoLocation) => {
    selectLocation(location);
    setActivePage('map');
  };

  return (
    <section aria-labelledby="dashboard-earth-title" className="space-y-3">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <Globe2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="dashboard-earth-title" className="text-base font-extrabold text-slate-900 dark:text-white">
                Explore India in 3D
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <Orbit className="h-3 w-3" />
                Live globe
              </span>
            </div>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500 dark:text-slate-400">
              Explore India's land, geography and regional data. The globe rotates automatically, pauses while you interact, and resumes after inactivity.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActivePage('earth')}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1b5e3a] px-4 text-xs font-bold text-white transition-colors hover:bg-[#154d2f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          Open full 3D explorer
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <EarthGlobe
        className="earth-globe-dashboard"
        locations={locations}
        selectedLocationId={selectedLocationId}
        onLocationSelect={selectLocation}
        onExploreLocation={exploreLocation}
      />
    </section>
  );
};

export default DashboardEarthSection;
