import type { Station } from '../types/citybikes'
import type { RouteStep } from './types'

export const DEPOT = { latitude: -3.7327, longitude: -38.5267 }

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = lat2 - lat1
  const dLng = (lng2 - lng1) * Math.cos(((lat1 + lat2) / 2) * (Math.PI / 180))
  return Math.sqrt(dLat * dLat + dLng * dLng) * 111.32
}

export function routeDistanceKm(steps: RouteStep[]): number {
  if (steps.length === 0) return 0
  let d = distanceKm(DEPOT.latitude, DEPOT.longitude, steps[0].station.latitude, steps[0].station.longitude)
  for (let i = 1; i < steps.length; i++) {
    d += distanceKm(
      steps[i - 1].station.latitude, steps[i - 1].station.longitude,
      steps[i].station.latitude, steps[i].station.longitude,
    )
  }
  d += distanceKm(
    steps[steps.length - 1].station.latitude, steps[steps.length - 1].station.longitude,
    DEPOT.latitude, DEPOT.longitude,
  )
  return d
}

export function calcResidualImbalance(steps: RouteStep[], allStations: Station[], target: number): number {
  const visited = new Map(steps.map(s => [s.station.id, s.stationBikesAfter]))
  return allStations.reduce((acc, s) => {
    const bikes = visited.get(s.id) ?? s.free_bikes
    return acc + Math.abs(bikes - target)
  }, 0)
}

export function selectCandidates(stations: Station[], target: number, maxCount: number): Station[] {
  const half = Math.ceil(maxCount / 2)

  // Top over-stocked stations (pickup sources) — sorted by largest surplus first
  const pickups = stations
    .filter(s => s.free_bikes > target)
    .sort((a, b) => (b.free_bikes - target) - (a.free_bikes - target))
    .slice(0, half)

  // Fill remaining slots with the most under-stocked stations (delivery targets)
  const deliveries = stations
    .filter(s => s.free_bikes < target)
    .sort((a, b) => (target - a.free_bikes) - (target - b.free_bikes))
    .slice(0, maxCount - pickups.length)

  return [...pickups, ...deliveries]
    .sort((a, b) => Math.abs(b.free_bikes - target) - Math.abs(a.free_bikes - target))
}

export function simulateTruck(
  orderedStations: Station[],
  initialCounts: Map<string, number>,
  truckCapacity: number,
  targetLevel: number,
): RouteStep[] {
  const counts = new Map(initialCounts)
  let truckLoad = 0
  const steps: RouteStep[] = []

  for (const station of orderedStations) {
    const bikes = counts.get(station.id) ?? station.free_bikes
    const imbalance = bikes - targetLevel
    let action: RouteStep['action'] = 'none'
    let quantity = 0

    // Implicit depot stop: reload or unload when truck can't service this station
    if (imbalance > 0 && truckLoad >= truckCapacity) truckLoad = 0
    else if (imbalance < 0 && truckLoad === 0) truckLoad = truckCapacity

    if (imbalance > 0 && truckLoad < truckCapacity) {
      quantity = Math.min(imbalance, truckCapacity - truckLoad)
      truckLoad += quantity
      counts.set(station.id, bikes - quantity)
      action = 'pickup'
    } else if (imbalance < 0 && truckLoad > 0) {
      quantity = Math.min(-imbalance, truckLoad)
      truckLoad -= quantity
      counts.set(station.id, bikes + quantity)
      action = 'delivery'
    }

    steps.push({ station, action, quantity, truckLoad, stationBikesAfter: counts.get(station.id)! })
  }

  return steps
}
