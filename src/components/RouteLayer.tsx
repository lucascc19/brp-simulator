import L from 'leaflet'
import { Marker, Polyline } from 'react-leaflet'
import type { RouteResult } from '../algorithms/types'
import { DEPOT } from '../algorithms/utils'

const DEPOT_POS: [number, number] = [DEPOT.latitude, DEPOT.longitude]

const ALGO_COLOR: Record<string, string> = {
  greedy: '#16a34a',
  grasp: '#7c3aed',
}

const truckIcon = L.divIcon({
  html: `<div style="font-size:22px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.4))">🚛</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

const depotIcon = L.divIcon({
  html: `<div style="background:#1d4ed8;color:white;font-size:9px;font-weight:700;
    padding:2px 6px;border-radius:4px;white-space:nowrap;border:2px solid white;
    box-shadow:0 1px 4px rgba(0,0,0,0.35);letter-spacing:0.05em">GARAGEM</div>`,
  className: '',
  iconAnchor: [28, 10],
})

interface Props {
  route: RouteResult
  currentStep: number
}

export function RouteLayer({ route, currentStep }: Props) {
  if (route.steps.length === 0) return null

  const positions = route.steps.map(
    s => [s.station.latitude, s.station.longitude] as [number, number],
  )

  const fullPath: [number, number][] = [DEPOT_POS, ...positions, DEPOT_POS]
  const visitedPath: [number, number][] = [DEPOT_POS, ...positions.slice(0, currentStep + 1)]
  const truckPos = positions[Math.min(currentStep, positions.length - 1)]

  return (
    <>
      {/* Full planned route — gray dashed */}
      <Polyline
        positions={fullPath}
        pathOptions={{ color: '#9ca3af', weight: 2, dashArray: '6 4', opacity: 0.55 }}
      />
      {/* Visited portion — colored */}
      <Polyline
        positions={visitedPath}
        pathOptions={{ color: ALGO_COLOR[route.algorithm], weight: 3.5, opacity: 0.9 }}
      />
      {/* Depot */}
      <Marker position={DEPOT_POS} icon={depotIcon} />
      {/* Truck */}
      <Marker position={truckPos} icon={truckIcon} />
    </>
  )
}
