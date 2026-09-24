import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Viewer } from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { Compass, Globe2, Layers3, Minus, Navigation, Plus, RotateCcw, Satellite } from 'lucide-react';
import type { GeoLocation } from './locationData';
import './EarthGlobe.css';

interface EarthGlobeProps {
  locations: GeoLocation[];
  selectedLocationId?: string;
  initialLocationId?: string;
  onLocationSelect?: (location: GeoLocation) => void;
  onExploreLocation?: (location: GeoLocation) => void;
  className?: string;
}

type CesiumModule = typeof import('cesium');

const INDIA_CAMERA = { latitude: 20.5937, longitude: 78.9629, height: 4_800_000 };
const EARTH_CAMERA = { latitude: 18, longitude: 78.9629, height: 14_000_000 };
const AUTO_ROTATE_RADIANS_PER_MS = 0.0000015;
const RESUME_DELAY_MS = 3_500;

const cameraHeightFor = (location: GeoLocation) => {
  if (location.type === 'country') return 4_800_000;
  if (location.type === 'state') return 1_450_000;
  if (location.type === 'district') return 340_000;
  return 100_000;
};

export const EarthGlobe: React.FC<EarthGlobeProps> = ({
  locations,
  selectedLocationId,
  initialLocationId = 'country-IN',
  onLocationSelect,
  onExploreLocation,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const cesiumRef = useRef<CesiumModule | null>(null);
  const locationsRef = useRef(locations);
  const selectCallbackRef = useRef(onLocationSelect);
  const reducedMotionRef = useRef(false);
  const interactingRef = useRef(false);
  const autoRotateRef = useRef(true);
  const resumeTimerRef = useRef<number | null>(null);
  const initialCameraAppliedRef = useRef(false);
  const [internalSelectedId, setInternalSelectedId] = useState(initialLocationId);
  const [viewerReady, setViewerReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRotating, setAutoRotating] = useState(true);
  const [imageryMode, setImageryMode] = useState<'earth' | 'satellite'>('earth');
  const [imageryLoading, setImageryLoading] = useState(false);
  const [terrainEnabled, setTerrainEnabled] = useState(false);

  const activeSelectedId = selectedLocationId ?? internalSelectedId;
  const selectedLocation = useMemo(
    () => locations.find((location) => location.id === activeSelectedId) || locations.find((location) => location.id === initialLocationId) || null,
    [activeSelectedId, initialLocationId, locations]
  );
  const ionToken = String(import.meta.env.VITE_CESIUM_ION_TOKEN || '').trim();

  useEffect(() => { locationsRef.current = locations; }, [locations]);
  useEffect(() => { selectCallbackRef.current = onLocationSelect; }, [onLocationSelect]);
  useEffect(() => { autoRotateRef.current = autoRotating; }, [autoRotating]);

  const scheduleRotationResume = useCallback(() => {
    if (resumeTimerRef.current !== null) window.clearTimeout(resumeTimerRef.current);
    if (reducedMotionRef.current) return;
    resumeTimerRef.current = window.setTimeout(() => {
      interactingRef.current = false;
      setAutoRotating(true);
    }, RESUME_DELAY_MS);
  }, []);

  const pauseRotation = useCallback(() => {
    if (resumeTimerRef.current !== null) window.clearTimeout(resumeTimerRef.current);
    interactingRef.current = true;
    setAutoRotating(false);
  }, []);

  const flyToCoordinates = useCallback((latitude: number, longitude: number, height: number) => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium || viewer.isDestroyed()) return;
    pauseRotation();
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
      orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
      duration: reducedMotionRef.current ? 0 : 1.35
    });
    scheduleRotationResume();
  }, [pauseRotation, scheduleRotationResume]);

  const focusLocation = useCallback((location: GeoLocation) => {
    flyToCoordinates(location.latitude, location.longitude, cameraHeightFor(location));
  }, [flyToCoordinates]);

  useEffect(() => {
    let cancelled = false;
    let animationFrame = 0;
    let lastFrame = performance.now();
    const cleanupFunctions: Array<() => void> = [];

    const initialize = async () => {
      if (!containerRef.current) return;
      try {
        const Cesium = await import('cesium');
        if (cancelled || !containerRef.current) return;
        cesiumRef.current = Cesium;
        if (ionToken) Cesium.Ion.defaultAccessToken = ionToken;

        const localEarthLayer = Cesium.ImageryLayer.fromProviderAsync(
          Cesium.TileMapServiceImageryProvider.fromUrl(
            Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
          )
        );

        const viewer = new Cesium.Viewer(containerRef.current, {
          animation: false,
          baseLayer: localEarthLayer,
          baseLayerPicker: false,
          fullscreenButton: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          navigationHelpButton: false,
          scene3DOnly: true,
          sceneModePicker: false,
          selectionIndicator: false,
          timeline: false,
          requestRenderMode: true,
          maximumRenderTimeChange: Number.POSITIVE_INFINITY,
          useBrowserRecommendedResolution: true,
          msaaSamples: 2
        });
        if (cancelled) { viewer.destroy(); return; }
        viewerRef.current = viewer;
        viewer.scene.globe.enableLighting = true;
        viewer.scene.globe.showGroundAtmosphere = true;
        viewer.scene.fog.enabled = true;
        viewer.scene.screenSpaceCameraController.minimumZoomDistance = 90_000;
        viewer.scene.screenSpaceCameraController.maximumZoomDistance = 30_000_000;
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(INDIA_CAMERA.longitude, INDIA_CAMERA.latitude, INDIA_CAMERA.height),
          orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 }
        });
        viewer.canvas.setAttribute('aria-label', 'Interactive 3D Earth focused on India');
        viewer.canvas.setAttribute('role', 'application');
        viewer.canvas.setAttribute('tabindex', '0');

        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const updateMotionPreference = () => {
          reducedMotionRef.current = mediaQuery.matches;
          setAutoRotating(!mediaQuery.matches);
        };
        updateMotionPreference();
        mediaQuery.addEventListener('change', updateMotionPreference);
        cleanupFunctions.push(() => mediaQuery.removeEventListener('change', updateMotionPreference));

        const canvas = viewer.canvas;
        const beginInteraction = () => pauseRotation();
        const wheelInteraction = () => { pauseRotation(); scheduleRotationResume(); };
        const endInteraction = () => scheduleRotationResume();
        canvas.addEventListener('pointerdown', beginInteraction, { passive: true });
        canvas.addEventListener('pointerup', endInteraction, { passive: true });
        canvas.addEventListener('pointercancel', endInteraction, { passive: true });
        canvas.addEventListener('wheel', wheelInteraction, { passive: true });
        canvas.addEventListener('touchstart', beginInteraction, { passive: true });
        canvas.addEventListener('touchend', endInteraction, { passive: true });
        cleanupFunctions.push(() => {
          canvas.removeEventListener('pointerdown', beginInteraction);
          canvas.removeEventListener('pointerup', endInteraction);
          canvas.removeEventListener('pointercancel', endInteraction);
          canvas.removeEventListener('wheel', wheelInteraction);
          canvas.removeEventListener('touchstart', beginInteraction);
          canvas.removeEventListener('touchend', endInteraction);
        });

        const clickHandler = new Cesium.ScreenSpaceEventHandler(canvas);
        clickHandler.setInputAction((movement: { position: import('cesium').Cartesian2 }) => {
          const picked = viewer.scene.pick(movement.position) as any;
          const locationId = picked?.id?.properties?.bhuLocationId?.getValue(Cesium.JulianDate.now());
          const location = locationsRef.current.find((item) => item.id === locationId);
          if (!location) return;
          setInternalSelectedId(location.id);
          selectCallbackRef.current?.(location);
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        cleanupFunctions.push(() => clickHandler.destroy());

        const animate = (now: number) => {
          if (cancelled || viewer.isDestroyed()) return;
          const delta = Math.min(now - lastFrame, 50);
          lastFrame = now;
          if (autoRotateRef.current && !interactingRef.current && !reducedMotionRef.current && document.visibilityState === 'visible') {
            viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, -AUTO_ROTATE_RADIANS_PER_MS * delta);
            viewer.scene.requestRender();
          }
          animationFrame = window.requestAnimationFrame(animate);
        };
        animationFrame = window.requestAnimationFrame(animate);

        if (ionToken) {
          Cesium.createWorldTerrainAsync({ requestVertexNormals: true, requestWaterMask: true })
            .then((terrainProvider) => {
              if (!cancelled && !viewer.isDestroyed()) {
                viewer.terrainProvider = terrainProvider;
                setTerrainEnabled(true);
                viewer.scene.requestRender();
              }
            })
            .catch(() => setTerrainEnabled(false));
        }

        setViewerReady(true);
        setLoading(false);
      } catch (initializationError) {
        console.error('Cesium initialization failed:', initializationError);
        if (!cancelled) {
          setError('The 3D Earth could not start on this device. Check WebGL support and Cesium asset deployment.');
          setLoading(false);
        }
      }
    };

    initialize();
    return () => {
      cancelled = true;
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      if (resumeTimerRef.current !== null) window.clearTimeout(resumeTimerRef.current);
      cleanupFunctions.forEach((cleanup) => cleanup());
      const viewer = viewerRef.current;
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
      viewerRef.current = null;
      cesiumRef.current = null;
    };
  }, [ionToken, pauseRotation, scheduleRotationResume]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewerReady || !viewer || !Cesium || viewer.isDestroyed()) return;
    viewer.entities.removeAll();
    locations.forEach((location) => {
      const selected = location.id === activeSelectedId;
      const color = selected
        ? Cesium.Color.WHITE
        : location.type === 'country'
          ? Cesium.Color.fromCssColorString('#f59e0b')
          : location.type === 'state'
            ? Cesium.Color.fromCssColorString('#34d399')
            : Cesium.Color.fromCssColorString('#38bdf8');
      viewer.entities.add({
        id: `bhu-globe-${location.id}`,
        name: location.name,
        position: Cesium.Cartesian3.fromDegrees(location.longitude, location.latitude, location.type === 'country' ? 25_000 : 9_000),
        properties: { bhuLocationId: location.id },
        point: {
          color,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          outlineColor: selected ? Cesium.Color.fromCssColorString('#10b981') : Cesium.Color.fromCssColorString('#07131f'),
          outlineWidth: selected ? 4 : 2,
          pixelSize: selected ? 14 : location.type === 'country' ? 12 : location.type === 'state' ? 9 : 7,
          scaleByDistance: new Cesium.NearFarScalar(150_000, 1.25, 12_000_000, 0.55)
        },
        label: {
          text: location.name,
          font: selected ? '700 14px Inter, system-ui, sans-serif' : '600 12px Inter, system-ui, sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.fromCssColorString('#07131f'),
          outlineWidth: 4,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -18),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
            0,
            location.type === 'district' ? 2_200_000 : location.type === 'state' ? 8_500_000 : 18_000_000
          )
        }
      });
    });
    viewer.scene.requestRender();
  }, [activeSelectedId, locations, viewerReady]);

  useEffect(() => {
    if (!viewerReady || !selectedLocation) return;
    if (!initialCameraAppliedRef.current && selectedLocation.id === initialLocationId) {
      initialCameraAppliedRef.current = true;
      return;
    }
    initialCameraAppliedRef.current = true;
    focusLocation(selectedLocation);
  }, [focusLocation, initialLocationId, selectedLocation, viewerReady]);

  const zoom = (direction: 'in' | 'out') => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    pauseRotation();
    const amount = Math.max(viewer.camera.positionCartographic.height * 0.32, 75_000);
    direction === 'in' ? viewer.camera.zoomIn(amount) : viewer.camera.zoomOut(amount);
    viewer.scene.requestRender();
    scheduleRotationResume();
  };

  const toggleImagery = async () => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium || viewer.isDestroyed() || !ionToken || imageryLoading) return;
    setImageryLoading(true);
    pauseRotation();
    scheduleRotationResume();
    try {
      viewer.imageryLayers.removeAll();
      if (imageryMode === 'earth') {
        const provider = await Cesium.createWorldImageryAsync({ style: Cesium.IonWorldImageryStyle.AERIAL_WITH_LABELS });
        if (!viewer.isDestroyed()) viewer.imageryLayers.addImageryProvider(provider);
        setImageryMode('satellite');
      } else {
        const provider = await Cesium.TileMapServiceImageryProvider.fromUrl(Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII'));
        if (!viewer.isDestroyed()) viewer.imageryLayers.addImageryProvider(provider);
        setImageryMode('earth');
      }
      viewer.scene.requestRender();
    } catch (imageryError) {
      console.warn('Could not switch Cesium imagery:', imageryError);
      const provider = await Cesium.TileMapServiceImageryProvider.fromUrl(Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII'));
      if (!viewer.isDestroyed()) viewer.imageryLayers.addImageryProvider(provider);
      setImageryMode('earth');
    } finally {
      setImageryLoading(false);
    }
  };

  return (
    <section className={`earth-globe-shell ${className}`} aria-label="Explore India in 3D">
      <div ref={containerRef} className="earth-globe-canvas" />
      <div className="earth-globe-vignette" />

      {loading && <div className="earth-globe-loading"><div><div className="earth-globe-spinner"/><p className="font-semibold">Preparing the 3D Earth</p><p className="mt-1 text-xs text-slate-400">Loading Cesium only for this view…</p></div></div>}
      {error && <div className="earth-globe-error"><div><Globe2 className="mx-auto mb-3 h-8 w-8 text-amber-400"/><p className="font-semibold">3D Earth unavailable</p><p className="mt-2 max-w-md text-sm text-slate-400">{error}</p></div></div>}

      {!loading && !error && <>
        <div className="earth-globe-status" aria-live="polite">
          <span className="earth-globe-status-pill"><span className="earth-globe-status-dot"/>{autoRotating ? 'Auto rotation active' : 'Rotation paused'}</span>
          <span className="earth-globe-status-pill"><Layers3 className="h-3.5 w-3.5"/>{terrainEnabled ? 'World terrain' : 'Ellipsoid terrain'}</span>
        </div>

        <div className="earth-globe-controls" aria-label="3D Earth controls">
          <button type="button" className="earth-globe-control" onClick={() => zoom('in')} aria-label="Zoom in" title="Zoom in"><Plus className="h-4 w-4"/></button>
          <button type="button" className="earth-globe-control" onClick={() => zoom('out')} aria-label="Zoom out" title="Zoom out"><Minus className="h-4 w-4"/></button>
          <button type="button" className="earth-globe-control" onClick={() => flyToCoordinates(EARTH_CAMERA.latitude, EARTH_CAMERA.longitude, EARTH_CAMERA.height)} aria-label="Reset Earth camera" title="Reset camera"><RotateCcw className="h-4 w-4"/></button>
          <button type="button" className="earth-globe-control" onClick={() => flyToCoordinates(INDIA_CAMERA.latitude, INDIA_CAMERA.longitude, INDIA_CAMERA.height)} aria-label="Focus camera on India" title="Focus India"><Navigation className="h-4 w-4"/><span>India</span></button>
          <button type="button" className="earth-globe-control" onClick={toggleImagery} disabled={!ionToken || imageryLoading} aria-label="Toggle satellite imagery" title={ionToken ? 'Toggle satellite imagery' : 'Add VITE_CESIUM_ION_TOKEN to enable satellite imagery'}><Satellite className="h-4 w-4"/></button>
        </div>

        {selectedLocation && <aside className="earth-globe-panel" aria-label={`${selectedLocation.name} information`}>
          <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">Selected location</p><h3 className="mt-1 text-lg font-bold text-white">{selectedLocation.name}</h3><p className="mt-0.5 text-xs capitalize text-slate-400">{selectedLocation.type}{selectedLocation.region ? ` · ${selectedLocation.region}` : ''}</p></div><div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-2 text-emerald-300"><Compass className="h-4 w-4"/></div></div>
          <div className="mt-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Available data</p><div className="mt-2 flex flex-wrap gap-1.5">{selectedLocation.availableData.map((item) => <span key={item} className="rounded-full border border-slate-700 bg-slate-800/75 px-2 py-1 text-[11px] text-slate-300">{item}</span>)}</div></div>
          <p className="mt-3 text-[10px] text-slate-500">Marker coordinates come from the existing {selectedLocation.source}; markers are reference points, not administrative boundaries.</p>
          {onExploreLocation && <button type="button" onClick={() => onExploreLocation(selectedLocation)} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300">Explore Data<Navigation className="h-4 w-4"/></button>}
        </aside>}
      </>}
    </section>
  );
};

export default EarthGlobe;
