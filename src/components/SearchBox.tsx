import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import type { Station } from '../types/citybikes'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Props {
  stations: Station[]
  onSelect: (station: Station) => void
}

export function SearchBox({ stations, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const suggestions =
    query.length >= 2
      ? stations.filter(s => s.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
      : []

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  function handleSelect(station: Station) {
    setQuery(station.name)
    setOpen(false)
    onSelect(station)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-2.5 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Buscar estação…"
          className="h-8 w-40 pl-8 pr-7 text-xs"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setQuery(''); setOpen(false) }}
            className="absolute right-0 size-8 text-muted-foreground hover:text-foreground"
          >
            <X />
          </Button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-popover rounded-md border shadow-md overflow-hidden z-50">
          {suggestions.map(station => (
            <button
              key={station.id}
              onClick={() => handleSelect(station)}
              className="w-full text-left px-3 py-2 text-xs text-foreground font-medium hover:bg-accent hover:text-accent-foreground transition-colors border-b border-border/50 last:border-0"
            >
              {station.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
