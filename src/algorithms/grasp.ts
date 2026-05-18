import type { Station } from '../types/citybikes'
import type { AlgorithmConfig, RouteResult, RouteStep } from './types'
import { calcResidualImbalance, routeDistanceKm, selectCandidates, simulateTruck } from './utils'

function weightedPick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

function constructOrder(
  candidates: Station[],
  bikeCounts: Map<string, number>,
  truckCapacity: number,
  targetLevel: number,
): Station[] {
  const counts = new Map(bikeCounts)
  let truckLoad = 0
  const visited = new Set<string>()
  const order: Station[] = []

  while (true) {
    const available = candidates.filter(s => {
      if (visited.has(s.id)) return false
      const bikes = counts.get(s.id)!
      const imbalance = bikes - targetLevel
      if (imbalance === 0) return false
      if (imbalance > 0 && truckLoad >= truckCapacity) return false
      if (imbalance < 0 && truckLoad === 0) return false
      return true
    })

    if (available.length === 0) break

    // Weighted roulette: higher imbalance = higher probability
    const weights = available.map(s => Math.abs(counts.get(s.id)! - targetLevel))
    const next = weightedPick(available, weights)
    visited.add(next.id)
    order.push(next)

    // Advance truck state for next iteration
    const bikes = counts.get(next.id)!
    const imbalance = bikes - targetLevel
    if (imbalance > 0) {
      const qty = Math.min(imbalance, truckCapacity - truckLoad)
      truckLoad += qty
      counts.set(next.id, bikes - qty)
    } else {
      const qty = Math.min(-imbalance, truckLoad)
      truckLoad -= qty
      counts.set(next.id, bikes + qty)
    }
  }

  return order
}

function localSearch(
  order: Station[],
  bikeCounts: Map<string, number>,
  truckCapacity: number,
  targetLevel: number,
): RouteStep[] {
  if (order.length < 2) return simulateTruck(order, bikeCounts, truckCapacity, targetLevel)

  let bestOrder = [...order]
  let bestSteps = simulateTruck(bestOrder, bikeCounts, truckCapacity, targetLevel)
  let bestDist = routeDistanceKm(bestSteps)

  // Up to 3 improvement passes (stops early if no improvement found)
  for (let pass = 0; pass < 3; pass++) {
    let improved = false
    for (let i = 0; i < bestOrder.length - 1; i++) {
      for (let j = i + 1; j < bestOrder.length; j++) {
        const candidate = [...bestOrder]
        ;[candidate[i], candidate[j]] = [candidate[j], candidate[i]]
        const steps = simulateTruck(candidate, bikeCounts, truckCapacity, targetLevel)
        const d = routeDistanceKm(steps)
        if (d < bestDist) {
          bestOrder = candidate
          bestSteps = steps
          bestDist = d
          improved = true
        }
      }
    }
    if (!improved) break
  }

  return bestSteps
}

export function runGrasp(stations: Station[], config: AlgorithmConfig): RouteResult {
  const t0 = performance.now()
  const { truckCapacity, targetLevel, maxStations, graspIterations } = config

  const candidates = selectCandidates(stations, targetLevel, maxStations)
  const bikeCounts = new Map(candidates.map(s => [s.id, s.free_bikes]))

  let bestSteps: RouteStep[] = []
  let bestDist = Infinity

  for (let iter = 0; iter < graspIterations; iter++) {
    const order = constructOrder(candidates, bikeCounts, truckCapacity, targetLevel)
    const steps = localSearch(order, bikeCounts, truckCapacity, targetLevel)
    const dist = routeDistanceKm(steps)
    if (dist < bestDist) {
      bestDist = dist
      bestSteps = steps
    }
  }

  return {
    algorithm: 'grasp',
    config,
    steps: bestSteps,
    totalDistanceKm: bestDist === Infinity ? 0 : bestDist,
    residualImbalance: calcResidualImbalance(bestSteps, stations, targetLevel),
    executionMs: performance.now() - t0,
  }
}
