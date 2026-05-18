import type { Map as LeafletMap } from "leaflet";
import type { MutableRefObject } from "react";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { RouteResult } from "../algorithms/types";
import { distanceKm } from "../algorithms/utils";
import { useMapControl } from "../hooks/useMapControl";
import { useStations } from "../hooks/useStations";
import type { Station, StationStatus } from "../types/citybikes";
import { getCapacity, getStationStatus } from "../types/citybikes";
import { FilterBar } from "./FilterBar";
import { RouteLayer } from "./RouteLayer";
import { SearchBox } from "./SearchBox";
import { SimulatorPanel } from "./SimulatorPanel";
import { StationCard } from "./StationCard";
import { StationMarker } from "./StationMarker";

const FORTALEZA_CENTER: [number, number] = [-3.7327, -38.5267];

function MapRefSetter({
  mapRef,
}: {
  mapRef: MutableRefObject<LeafletMap | null>;
}) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

export function MapView() {
  const { data, isLoading, isError, dataUpdatedAt } = useStations();
  const [selected, setSelected] = useState<Station | null>(null);
  const [activeFilters, setActiveFilters] = useState<StationStatus[]>([
    "ok",
    "low",
    "empty",
  ]);
  const [stationLimit, setStationLimit] = useState<number | null>(null);
  const [showSimulatedState, setShowSimulatedState] = useState(false);

  const { mapRef, flyToStation } = useMapControl();

  const [route, setRoute] = useState<RouteResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [showSimulator, setShowSimulator] = useState(false);

  const stations = data?.network.stations ?? [];
  const limitedStations = stationLimit
    ? [...stations]
        .sort(
          (a, b) =>
            distanceKm(
              FORTALEZA_CENTER[0],
              FORTALEZA_CENTER[1],
              a.latitude,
              a.longitude,
            ) -
            distanceKm(
              FORTALEZA_CENTER[0],
              FORTALEZA_CENTER[1],
              b.latitude,
              b.longitude,
            ),
        )
        .slice(0, stationLimit)
    : stations;

  // Map of stationId → bikes after simulation (from route steps)
  const simulatedMap = new Map<string, number>(
    route?.steps.map((s) => [s.station.id, s.stationBikesAfter] as [string, number]) ?? [],
  );

  // When showSimulatedState, replace free_bikes/empty_slots with simulation result
  const effectiveStations = showSimulatedState
    ? limitedStations.map((s) => {
        const simBikes = simulatedMap.get(s.id);
        if (simBikes === undefined) return s;
        const cap = getCapacity(s);
        return { ...s, free_bikes: simBikes, empty_slots: cap - simBikes };
      })
    : limitedStations;

  const visibleStations = effectiveStations.filter((s) =>
    activeFilters.includes(getStationStatus(s)),
  );
  const updatedAt = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("pt-BR")
    : null;

  useEffect(() => {
    if (!isAnimating || !route) return;
    const id = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= route.steps.length - 1) {
          setIsAnimating(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / animationSpeed);
    return () => clearInterval(id);
  }, [isAnimating, route, animationSpeed]);

  function handleRouteComputed(result: RouteResult) {
    setRoute(result);
    setCurrentStep(0);
    setIsAnimating(false);
    setShowSimulatedState(false);
  }

  // Always open card with original (live) station data
  function handleStationClick(s: Station) {
    const original = limitedStations.find((ls) => ls.id === s.id) ?? s;
    setSelected(original);
  }

  function handleSearchSelect(station: Station) {
    flyToStation(station);
    setSelected(station);
  }

  const animation = {
    currentStep,
    isAnimating,
    speed: animationSpeed,
    showSimulatedState,
    onPlay: () => {
      if (route && currentStep >= route.steps.length - 1) setCurrentStep(0);
      setIsAnimating(true);
    },
    onPause: () => setIsAnimating(false),
    onReset: () => {
      setCurrentStep(0);
      setIsAnimating(false);
    },
    onSpeedChange: setAnimationSpeed,
    onToggleSimulatedView: () => setShowSimulatedState((v) => !v),
  };

  return (
    <div className="relative h-full w-full">
      {/* Header bar */}
      <div className="absolute top-0 left-0 right-0 z-1000 flex items-center justify-between gap-3 bg-white/90 backdrop-blur-sm px-5 py-3 shadow-sm border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-green-600 flex items-center justify-center shrink-0">
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21c0 0-8-6-8-12a8 8 0 0116 0c0 6-8 12-8 12z"
              />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-none">
              Bicicletar
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {showSimulatedState
                ? "Visualizando resultado simulado"
                : "Fortaleza, CE"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isLoading && !isError && (
            <div className="hidden sm:flex items-center gap-2">
              <FilterBar
                activeFilters={activeFilters}
                onChange={setActiveFilters}
              />
              <div className="w-px h-4 bg-gray-200" />
              <SearchBox
                stations={limitedStations}
                onSelect={handleSearchSelect}
              />
              <div className="w-px h-4 bg-gray-200" />
              <select
                value={stationLimit ?? ""}
                onChange={(e) =>
                  setStationLimit(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 bg-white cursor-pointer"
                title="Limitar estações visíveis"
              >
                <option value={25}>25 est.</option>
                <option value={50}>50 est.</option>
                <option value={100}>100 est.</option>
                <option value="">Todas</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            {isLoading && (
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse inline-block" />
            )}
            {isError && <span className="text-red-500">Erro ao carregar</span>}
            {!isLoading && !isError && (
              <>
                <span
                  className={`h-2 w-2 rounded-full inline-block ${showSimulatedState ? "bg-indigo-400" : "bg-green-400"}`}
                />
                <span>
                  {visibleStations.length}/{limitedStations.length}
                </span>
                {updatedAt && (
                  <span className="hidden sm:inline">· {updatedAt}</span>
                )}
              </>
            )}
          </div>

          {/* Simulator toggle */}
          <button
            onClick={() => setShowSimulator((s) => !s)}
            disabled={stations.length === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 ${
              showSimulator
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            🗺️ Simular
          </button>
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={FORTALEZA_CENTER}
        zoom={13}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRefSetter mapRef={mapRef} />
        {visibleStations.map((station) => (
          <StationMarker
            key={station.id}
            station={station}
            onClick={handleStationClick}
            visited={simulatedMap.has(station.id) && showSimulatedState}
          />
        ))}
        {route && <RouteLayer route={route} currentStep={currentStep} />}
      </MapContainer>

      {/* Simulator panel */}
      {showSimulator && (
        <SimulatorPanel
          stations={limitedStations}
          route={route}
          animation={animation}
          onRouteComputed={handleRouteComputed}
          onClose={() => setShowSimulator(false)}
        />
      )}

      {/* Station detail card */}
      {selected && (
        <StationCard
          station={selected}
          simulatedBikes={route ? simulatedMap.get(selected.id) : undefined}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-999 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full border-4 border-green-600 border-t-transparent animate-spin" />
            <p className="text-sm text-gray-600 font-medium">
              Carregando estações…
            </p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {isError && (
        <div className="absolute inset-0 z-999 flex items-center justify-center bg-white/80">
          <div className="text-center px-6">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="text-base font-semibold text-gray-800">
              Não foi possível carregar as estações
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Verifique sua conexão e tente novamente.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
