import { useEffect, useRef, useState } from 'react'
import type { Station } from '../types/citybikes'

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
      <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2.5 py-1.5">
        <svg
          className="h-3.5 w-3.5 text-gray-400 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Buscar estação…"
          className="bg-transparent text-xs text-gray-700 placeholder:text-gray-400 outline-none w-36"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setOpen(false)
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
          {suggestions.map(station => (
            <button
              key={station.id}
              onClick={() => handleSelect(station)}
              className="w-full text-left px-3 py-2 text-xs text-gray-700 font-medium hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
            >
              {station.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
