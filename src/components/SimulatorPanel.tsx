import { useState } from 'react'
import { Play, X } from 'lucide-react'
import { runGrasp } from '../algorithms/grasp'
import { runGreedy } from '../algorithms/greedy'
import type { AlgorithmConfig, AlgorithmId, RouteResult } from '../algorithms/types'
import { DEFAULT_CONFIG } from '../algorithms/types'
import type { Station } from '../types/citybikes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
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
    <div className="absolute top-16 right-3 z-1000 w-72 max-h-[calc(100vh-5rem)]">
      <Card className="flex flex-col overflow-hidden shadow-xl h-full">
        {/* Header */}
        <CardHeader className="flex-row items-center justify-between py-3 px-4 border-b">
          <CardTitle className="text-sm flex items-center gap-2">
            <span>🗺️</span>
            Simulador de Rota
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="size-7 text-muted-foreground shrink-0">
            <X />
          </Button>
        </CardHeader>

        <ScrollArea className="flex-1">
          <CardContent className="px-4 py-4 space-y-5">
            {/* Algorithm tabs */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Algoritmo
              </p>
              <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-xl">
                {(['greedy', 'grasp'] as AlgorithmId[]).map(algo => (
                  <button
                    key={algo}
                    onClick={() => setAlgo(algo)}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      config.algorithm === algo
                        ? 'bg-background shadow text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {algo === 'greedy' ? 'Guloso' : 'GRASP'}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Config sliders */}
            <div className="space-y-4">
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
            <Button
              onClick={handleRun}
              disabled={isRunning || stations.length === 0}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <span className="size-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  Calculando…
                </>
              ) : (
                <>
                  <Play className="size-4" />
                  Calcular Rota
                </>
              )}
            </Button>

            {/* Results */}
            {route && <RouteStats route={route} animation={animation} />}
          </CardContent>
        </ScrollArea>
      </Card>
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
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-foreground font-medium">{label}</span>
        <span className="text-muted-foreground font-semibold">
          {value} {unit}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  )
}
