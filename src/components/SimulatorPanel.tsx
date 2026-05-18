import { useState } from 'react'
import { runGrasp } from '../algorithms/grasp'
import { runGreedy } from '../algorithms/greedy'
import type { AlgorithmConfig, AlgorithmId, RouteResult } from '../algorithms/types'
import { DEFAULT_CONFIG } from '../algorithms/types'
import type { Station } from '../types/citybikes'
import type { AnimationControls } from './RouteStats'
import { RouteStats } from './RouteStats'

interface Props {
  stations: Station[]
  route: RouteResult | null
  animation: AnimationControls
  onRouteComputed: (r: RouteResult) => void
  onClose: () => void
}

export function SimulatorPanel({ stations, route, animation, onRouteComputed, onClose }: Props) {
  const [config, setConfig] = useState<AlgorithmConfig>(DEFAULT_CONFIG)
  const [isRunning, setIsRunning] = useState(false)

  function setAlgo(algorithm: AlgorithmId) {
    setConfig(c => ({ ...c, algorithm }))
  }

  function updateConfig(key: keyof AlgorithmConfig, value: number) {
    setConfig(c => ({ ...c, [key]: value }))
  }

  function handleRun() {
    if (stations.length === 0 || isRunning) return
    setIsRunning(true)
    // Defer to next frame so the loading state renders before heavy computation
    setTimeout(() => {
      const result =
        config.algorithm === 'greedy'
          ? runGreedy(stations, config)
          : runGrasp(stations, config)
      onRouteComputed(result)
      setIsRunning(false)
    }, 16)
  }

  return (
    <div className="absolute top-16 right-3 z-1000 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-y-auto max-h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-2">
          <span className="text-base">🗺️</span>
          <h3 className="text-sm font-bold text-gray-900">Simulador de Rota</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 transition-colors"
          aria-label="Fechar"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Algorithm tabs */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Algoritmo
          </p>
          <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-xl">
            {(['greedy', 'grasp'] as AlgorithmId[]).map(algo => (
              <button
                key={algo}
                onClick={() => setAlgo(algo)}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  config.algorithm === algo
                    ? 'bg-white shadow text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {algo === 'greedy' ? 'Guloso' : 'GRASP'}
              </button>
            ))}
          </div>
        </div>

        {/* Config sliders */}
        <div className="space-y-3">
          <SliderField
            label="Nível alvo"
            value={config.targetLevel}
            min={3}
            max={25}
            unit="bikes"
            onChange={v => updateConfig('targetLevel', v)}
          />
          <SliderField
            label="Capacidade do caminhão"
            value={config.truckCapacity}
            min={10}
            max={50}
            unit="bikes"
            onChange={v => updateConfig('truckCapacity', v)}
          />
          <SliderField
            label="Estações analisadas"
            value={Math.min(config.maxStations, stations.length)}
            min={Math.min(10, stations.length)}
            max={stations.length}
            unit="top"
            onChange={v => updateConfig('maxStations', v)}
          />
          {config.algorithm === 'grasp' && (
            <SliderField
              label="Iterações GRASP"
              value={config.graspIterations}
              min={5}
              max={50}
              unit="iter."
              onChange={v => updateConfig('graspIterations', v)}
            />
          )}
        </div>

        {/* Run button */}
        <button
          onClick={handleRun}
          disabled={isRunning || stations.length === 0}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {isRunning ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Calculando…
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
              </svg>
              Calcular Rota
            </>
          )}
        </button>

        {/* Results */}
        {route && <RouteStats route={route} animation={animation} />}
      </div>
    </div>
  )
}

function SliderField({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  unit: string
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="text-gray-900 font-bold">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full accent-gray-900 cursor-pointer"
      />
    </div>
  )
}
