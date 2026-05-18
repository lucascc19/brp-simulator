export interface StationExtra {
  slots?: number
  uid?: string
  address?: string
  last_update?: number
}

export interface Station {
  id: string
  name: string
  timestamp: string
  free_bikes: number
  empty_slots: number
  latitude: number
  longitude: number
  extra: StationExtra
}

export interface Network {
  id: string
  name: string
  stations: Station[]
}

export interface NetworkResponse {
  network: Network
}

export type StationStatus = 'empty' | 'low' | 'ok'

export function getStationStatus(station: Station): StationStatus {
  const capacity = station.free_bikes + station.empty_slots
  if (station.free_bikes === 0) return 'empty'
  if (capacity > 0 && station.free_bikes / capacity < 0.5) return 'low'
  return 'ok'
}

export function getCapacity(station: Station): number {
  return station.free_bikes + station.empty_slots
}
