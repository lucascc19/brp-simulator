import type { Station } from '../types/citybikes'
import type { AlgorithmConfig, RouteResult, RouteStep } from './types'
import { calcResidualImbalance, routeDistanceKm, selectCandidates } from './utils'

export function runGreedy(stations: Station[], config: AlgorithmConfig): RouteResult {
  const t0 = performance.now()
  const { truckCapacity, targetLevel, maxStations } = config

  const candidates = selectCandidates(stations, targetLevel, maxStations)
  const bikeCounts = new Map(candidates.map(s => [s.id, s.free_bikes]))
  let truckLoad = 0
  const visited = new Set<string>()
  const steps: RouteStep[] = []

  while (true) {
    const available = candidates.filter(
      s => !visited.has(s.id) && bikeCounts.get(s.id)! !== targetLevel,
    )
    if (available.length === 0) break

    // Pick station with highest |imbalance|
    const next = available.reduce((best, s) => {
      const bImb = Math.abs(bikeCounts.get(best.id)! - targetLevel)
      const sImb = Math.abs(bikeCounts.get(s.id)! - targetLevel)
      return sImb > bImb ? s : best
    })

    const bikes = bikeCounts.get(next.id)!
    const imbalance = bikes - targetLevel

    // Implicit depot stop: reload or unload when truck can't service next station
    if (imbalance > 0 && truckLoad >= truckCapacity) truckLoad = 0
    else if (imbalance < 0 && truckLoad === 0) truckLoad = truckCapacity

    visited.add(next.id)
    let action: RouteStep['action']
    let quantity = 0

    if (imbalance > 0) {
      quantity = Math.min(imbalance, truckCapacity - truckLoad)
      truckLoad += quantity
      bikeCounts.set(next.id, bikes - quantity)
      action = 'pickup'
    } else {
      quantity = Math.min(-imbalance, truckLoad)
      truckLoad -= quantity
      bikeCounts.set(next.id, bikes + quantity)
      action = 'delivery'
    }

    steps.push({ station: next, action, quantity, truckLoad, stationBikesAfter: bikeCounts.get(next.id)! })
  }

  return {
    algorithm: 'greedy',
    config,
    steps,
    totalDistanceKm: routeDistanceKm(steps),
    residualImbalance: calcResidualImbalance(steps, stations, targetLevel),
    executionMs: performance.now() - t0,
  }
}
