import { X } from 'lucide-react'
import type { Station } from '../types/citybikes'
import { getCapacity, getStationStatus } from '../types/citybikes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

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

const STATUS_BADGE_CLASS: Record<string, string> = {
  ok: 'bg-green-100 text-green-800 border-green-200',
  low: 'bg-amber-100 text-amber-800 border-amber-200',
  empty: 'bg-red-100 text-red-800 border-red-200',
}

const PROGRESS_CLASS: Record<string, string> = {
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
      <Card className="relative overflow-hidden shadow-xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-3 right-3 size-7 text-muted-foreground"
          aria-label="Fechar"
        >
          <X />
        </Button>

        <CardHeader className="pb-3 pr-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Estação
          </p>
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-snug truncate">
              {station.name}
            </h2>
            <Badge className={`shrink-0 ${STATUS_BADGE_CLASS[status]}`}>
              {STATUS_LABEL[status]}
            </Badge>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-4 space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-3 divide-x divide-border">
            <Stat label="Capacidade" value={capacity} unit="vagas" />
            <Stat label="Bikes" value={station.free_bikes} unit="disponíveis" highlight />
            <Stat label="Slots vazios" value={station.empty_slots} unit="livres" />
          </div>

          {/* Occupancy progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Ocupação de bikes</span>
              <span>{Math.round(fillPercent)}%</span>
            </div>
            <Progress
              value={fillPercent}
              className="h-2"
              indicatorClassName={PROGRESS_CLASS[status]}
            />
          </div>

          {/* Simulation before/after */}
          {simulatedBikes !== undefined && simStatus !== null && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                  Resultado simulado
                </p>
                <BarRow label="Antes" bikes={station.free_bikes} capacity={capacity} indicatorClass="bg-gray-300" />
                <BarRow label="Depois" bikes={simulatedBikes} capacity={capacity} indicatorClass={PROGRESS_CLASS[simStatus]} />
                <div className="flex items-center justify-between pt-0.5">
                  <Badge className={STATUS_BADGE_CLASS[simStatus]}>
                    {STATUS_LABEL[simStatus]}
                  </Badge>
                  <span className={`text-xs font-bold ${delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {delta > 0 ? '+' : ''}{delta} bikes
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ label, value, unit, highlight }: { label: string; value: number; unit: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-2">
      <span className={`text-2xl font-bold ${highlight ? 'text-green-600' : 'text-foreground'}`}>
        {value}
      </span>
      <span className="text-xs text-muted-foreground text-center leading-tight">{label}</span>
      <span className="text-xs text-muted-foreground/70 text-center leading-tight">{unit}</span>
    </div>
  )
}

function BarRow({ label, bikes, capacity, indicatorClass }: { label: string; bikes: number; capacity: number; indicatorClass: string }) {
  const pct = capacity > 0 ? Math.min((bikes / capacity) * 100, 100) : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-10 text-muted-foreground shrink-0">{label}</span>
      <Progress value={pct} className="flex-1 h-1.5" indicatorClassName={indicatorClass} />
      <span className="w-14 text-right text-foreground font-medium shrink-0">
        {bikes} bike{bikes !== 1 ? 's' : ''}
      </span>
    </div>
  )
}
