import type { StationStatus } from '../types/citybikes'
import { Toggle } from '@/components/ui/toggle'

const STATUS_CONFIG: { status: StationStatus; label: string; activeClass: string; dotClass: string }[] = [
  { status: 'ok', label: 'Disponível', activeClass: 'data-[state=on]:bg-green-50 data-[state=on]:text-green-700 data-[state=on]:border-green-200', dotClass: 'bg-green-500' },
  { status: 'low', label: 'Poucas bikes', activeClass: 'data-[state=on]:bg-amber-50 data-[state=on]:text-amber-700 data-[state=on]:border-amber-200', dotClass: 'bg-amber-500' },
  { status: 'empty', label: 'Vazia', activeClass: 'data-[state=on]:bg-red-50 data-[state=on]:text-red-700 data-[state=on]:border-red-200', dotClass: 'bg-red-500' },
]

interface Props {
  activeFilters: StationStatus[]
  onChange: (filters: StationStatus[]) => void
}

export function FilterBar({ activeFilters, onChange }: Props) {
  function toggle(status: StationStatus) {
    if (activeFilters.includes(status)) {
      if (activeFilters.length === 1) return
      onChange(activeFilters.filter(s => s !== status))
    } else {
      onChange([...activeFilters, status])
    }
  }

  return (
    <div className="flex items-center gap-1">
      {STATUS_CONFIG.map(({ status, label, activeClass, dotClass }) => {
        const active = activeFilters.includes(status)
        return (
          <Toggle
            key={status}
            pressed={active}
            onPressedChange={() => toggle(status)}
            variant="outline"
            size="sm"
            className={`gap-1.5 text-xs ${activeClass}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${active ? dotClass : 'bg-gray-300'}`} />
            {label}
          </Toggle>
        )
      })}
    </div>
  )
}
