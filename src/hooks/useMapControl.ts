import { useRef } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import type { Station } from '../types/citybikes'

export function useMapControl() {
  const mapRef = useRef<LeafletMap | null>(null)

  function flyToStation(station: Station) {
    mapRef.current?.flyTo([station.latitude, station.longitude], 16, { duration: 0.8 })
  }

  return { mapRef, flyToStation }
}
