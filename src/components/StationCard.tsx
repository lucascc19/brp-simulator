import type { Station } from '../types/citybikes'
import { getCapacity, getStationStatus } from '../types/citybikes'

interface Props {
  station: Station
  simulatedBikes?: number
  onClose: () => void
}

const STATUS_LABEL: Record<string, string> = {
  ok: 'Disponível',
  low: 'Poucas bikes',
  empty: 'Vazia',
}

const STATUS_CLASSES: Record<string, string> = {
  ok: 'bg-green-100 text-green-800',
  low: 'bg-amber-100 text-amber-800',
  empty: 'bg-red-100 text-red-800',
}

const BAR_CLASSES: Record<string, string> = {
  ok: 'bg-green-500',
  low: 'bg-amber-500',
  empty: 'bg-red-500',
}

export function StationCard({ station, simulatedBikes, onClose }: Props) {
  const status = getStationStatus(station)
  const capacity = getCapacity(station)
  const fillPercent = capacity > 0 ? (station.free_bikes / capacity) * 100 : 0

  const delta = simulatedBikes !== undefined ? simulatedBikes - station.free_bikes : 0
  const simStatus = simulatedBikes !== undefined
    ? getStationStatus({ ...station, free_bikes: simulatedBikes, empty_slots: capacity - simulatedBikes })
    : null

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-1000 w-full max-w-sm px-4 sm:left-6 sm:translate-x-0 sm:px-0">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
              Estação
            </p>
            <h2 className="text-base font-bold text-gray-900 leading-snug truncate">
              {station.name}
            </h2>
          </div>
          <span
            className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASSES[status]}`}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-gray-100" />

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 px-5 py-4">
          <Stat label="Capacidade" value={capacity} unit="vagas" />
          <Stat label="Bikes" value={station.free_bikes} unit="disponíveis" highlight />
          <Stat label="Slots vazios" value={station.empty_slots} unit="livres" />
        </div>

        {/* Progress bar */}
        <div className="px-5 pb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Ocupação de bikes</span>
            <span>{Math.round(fillPercent)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${BAR_CLASSES[status]}`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>

        {/* Simulation before/after */}
        {simulatedBikes !== undefined && simStatus !== null && (
          <>
            <div className="mx-5 border-t border-gray-100" />
            <div className="px-5 py-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                Resultado simulado
              </p>
              <BarRow
                label="Antes"
                bikes={station.free_bikes}
                capacity={capacity}
                barClass="bg-gray-300"
              />
              <BarRow
                label="Depois"
                bikes={simulatedBikes}
                capacity={capacity}
                barClass={BAR_CLASSES[simStatus]}
              />
              <div className="flex items-center justify-between pt-0.5">
                <span className={`text-xs font-semibold inline-flex items-center rounded-full px-2 py-0.5 ${STATUS_CLASSES[simStatus]}`}>
                  {STATUS_LABEL[simStatus]}
                </span>
                <span className={`text-xs font-bold ${delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {delta > 0 ? '+' : ''}{delta} bikes
                </span>
              </div>
            </div>
          </>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
          aria-label="Fechar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value, unit, highlight }: { label: string; value: number; unit: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-2">
      <span className={`text-2xl font-bold ${highlight ? 'text-green-600' : 'text-gray-800'}`}>
        {value}
      </span>
      <span className="text-xs text-gray-500 text-center leading-tight">{label}</span>
      <span className="text-xs text-gray-400 text-center leading-tight">{unit}</span>
    </div>
  )
}

function BarRow({ label, bikes, capacity, barClass }: { label: string; bikes: number; capacity: number; barClass: string }) {
  const pct = capacity > 0 ? Math.min((bikes / capacity) * 100, 100) : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-10 text-gray-500 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-14 text-right text-gray-700 font-medium shrink-0">
        {bikes} bike{bikes !== 1 ? 's' : ''}
      </span>
    </div>
  )
}
