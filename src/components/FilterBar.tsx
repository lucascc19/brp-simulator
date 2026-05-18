import type { StationStatus } from '../types/citybikes'

const STATUS_CONFIG: { status: StationStatus; label: string; activeClass: string; dotClass: string }[] = [
  { status: 'ok', label: 'Disponível', activeClass: 'text-green-700 bg-green-50 border-green-200', dotClass: 'bg-green-500' },
  { status: 'low', label: 'Poucas bikes', activeClass: 'text-amber-700 bg-amber-50 border-amber-200', dotClass: 'bg-amber-500' },
  { status: 'empty', label: 'Vazia', activeClass: 'text-red-700 bg-red-50 border-red-200', dotClass: 'bg-red-500' },
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
          <button
            key={status}
            onClick={() => toggle(status)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-all ${
              active
                ? activeClass
                : 'text-gray-400 bg-white border-gray-200 hover:border-gray-300 hover:text-gray-500'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${active ? dotClass : 'bg-gray-300'}`} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
