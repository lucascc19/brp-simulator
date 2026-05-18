import type { RouteResult } from '../algorithms/types'

const ALGO_LABEL: Record<string, string> = { greedy: 'Guloso', grasp: 'GRASP' }
const ALGO_BADGE: Record<string, string> = {
  greedy: 'bg-green-100 text-green-800',
  grasp: 'bg-violet-100 text-violet-800',
}
const ALGO_BAR: Record<string, string> = {
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
    <div className="border-t border-gray-100 pt-4 mt-1 space-y-3">
      {/* Badge + time */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${ALGO_BADGE[route.algorithm]}`}>
          {ALGO_LABEL[route.algorithm]}
        </span>
        <span className="text-xs text-gray-400">{route.executionMs.toFixed(1)} ms</span>
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
          {/* Reset */}
          <button
            onClick={onReset}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            title="Reiniciar"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Play / Pause */}
          <button
            onClick={isAnimating ? onPause : onPlay}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 transition-colors"
          >
            {isAnimating ? (
              <>
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
                Pausar
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {atEnd ? 'Replay' : 'Animar'}
              </>
            )}
          </button>

          {/* Speed */}
          <select
            value={speed}
            onChange={e => onSpeedChange(Number(e.target.value))}
            className="text-xs border border-gray-200 rounded-lg px-1.5 py-1.5 text-gray-600 bg-white"
          >
            <option value={0.5}>0.5×</option>
            <option value={1}>1×</option>
            <option value={2}>2×</option>
            <option value={4}>4×</option>
          </select>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Passo {Math.min(currentStep + 1, total)} / {total}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-200 ${ALGO_BAR[route.algorithm]}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Simulated state toggle */}
      <button
        onClick={onToggleSimulatedView}
        className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold border transition-all ${
          showSimulatedState
            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
        }`}
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          {showSimulatedState ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z" />
          )}
        </svg>
        {showSimulatedState ? 'Ver mapa real' : 'Visualizar resultado'}
      </button>
    </div>
  )
}

function StatBox({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-2 text-center">
      <div className="text-lg font-bold text-gray-900 leading-none mb-0.5">{value}</div>
      <div className="text-[10px] text-gray-500 leading-tight">{label}</div>
      <div className="text-[10px] text-gray-400 leading-tight">{unit}</div>
    </div>
  )
}
