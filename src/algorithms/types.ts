import type { Station } from '../types/citybikes'

export type AlgorithmId = 'greedy' | 'grasp'

export interface AlgorithmConfig {
  algorithm: AlgorithmId
  truckCapacity: number
  targetLevel: number
  maxStations: number
  graspIterations: number
}

export const DEFAULT_CONFIG: AlgorithmConfig = {
  algorithm: 'greedy',
  truckCapacity: 20,
  targetLevel: 10,
  maxStations: 30,
  graspIterations: 30,
}

export interface RouteStep {
  station: Station
  action: 'pickup' | 'delivery' | 'none'
  quantity: number
  truckLoad: number
  stationBikesAfter: number
}

export interface RouteResult {
  algorithm: AlgorithmId
  config: AlgorithmConfig
  steps: RouteStep[]
  totalDistanceKm: number
  residualImbalance: number
  executionMs: number
}
