import { Eye, EyeOff, Pause, Play, RotateCcw } from 'lucide-react'
import type { RouteResult } from '../algorithms/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ALGO_LABEL: Record<string, string> = { greedy: 'Guloso', grasp: 'GRASP' }
const ALGO_BADGE_CLASS: Record<string, string> = {
  greedy: 'bg-green-100 text-green-800 border-green-200',
  grasp: 'bg-violet-100 text-violet-800 border-violet-200',
}
const PROGRESS_CLASS: Record<string, string> = {
  greedy: 'bg-green-500',
  grasp: 'bg-violet-500',
}

export interface AnimationControls {
  currentStep: number
  isAnimating: boolean
  speed: number
  showSimulatedState: boolean
  onPlay: () => void
  onPause: () => void
  onReset: () => void
  onSpeedChange: (s: number) => void
  onToggleSimulatedView: () => void
}

interface Props {
  route: RouteResult
  animation: AnimationControls
}

export function RouteStats({ route, animation }: Props) {
  const { currentStep, isAnimating, speed, showSimulatedState, onPlay, onPause, onReset, onSpeedChange, onToggleSimulatedView } = animation
  const total = route.steps.length
  const progress = total > 0 ? ((currentStep + 1) / total) * 100 : 0
  const atEnd = currentStep >= total - 1

  return (
    <div className="space-y-4">
      <Separator />

      {/* Badge + time */}
      <div className="flex items-center justify-between">
        <Badge className={ALGO_BADGE_CLASS[route.algorithm]}>
          {ALGO_LABEL[route.algorithm]}
        </Badge>
        <span className="text-xs text-muted-foreground">{route.executionMs.toFixed(1)} ms</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-1.5">
        <StatBox label="Distância" value={route.totalDistanceKm.toFixed(1)} unit="km" />
        <StatBox label="Estações" value={String(total)} unit="visitadas" />
        <StatBox label="Deseq. res." value={String(route.residualImbalance)} unit="bikes" />
      </div>

      {/* Animation controls */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={onReset} className="size-8 shrink-0" title="Reiniciar">
            <RotateCcw />
          </Button>

          <Button
            onClick={isAnimating ? onPause : onPlay}
            size="sm"
            className="flex-1 gap-1.5"
          >
            {isAnimating ? (
              <><Pause className="size-3.5" />Pausar</>
            ) : (
              <><Play className="size-3.5" />{atEnd ? 'Replay' : 'Animar'}</>
            )}
          </Button>

          <Select value={String(speed)} onValueChange={v => onSpeedChange(Number(v))}>
            <SelectTrigger className="h-8 w-16 text-xs px-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">0.5×</SelectItem>
              <SelectItem value="1">1×</SelectItem>
              <SelectItem value="2">2×</SelectItem>
              <SelectItem value="4">4×</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Passo {Math.min(currentStep + 1, total)} / {total}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress
            value={progress}
            className="h-1.5"
            indicatorClassName={PROGRESS_CLASS[route.algorithm]}
          />
        </div>
      </div>

      {/* Simulated state toggle */}
      <Button
        variant="outline"
        onClick={onToggleSimulatedView}
        className={`w-full gap-2 text-xs ${
          showSimulatedState
            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
            : ''
        }`}
        size="sm"
      >
        {showSimulatedState ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        {showSimulatedState ? 'Ver mapa real' : 'Visualizar resultado'}
      </Button>
    </div>
  )
}

function StatBox({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-muted rounded-xl p-2 text-center">
      <div className="text-lg font-bold text-foreground leading-none mb-0.5">{value}</div>
      <div className="text-[10px] text-muted-foreground leading-tight">{label}</div>
      <div className="text-[10px] text-muted-foreground/70 leading-tight">{unit}</div>
    </div>
  )
}
