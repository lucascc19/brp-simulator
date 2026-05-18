import { divIcon } from 'leaflet'
import { Marker, Popup } from 'react-leaflet'
import type { Station } from '../types/citybikes'
import { getCapacity, getStationStatus } from '../types/citybikes'

interface Props {
  station: Station
  onClick: (station: Station) => void
  visited?: boolean
}

const STATUS_COLOR: Record<string, string> = {
  ok: '#16a34a',
  low: '#d97706',
  empty: '#dc2626',
}

function createIcon(status: string, visited: boolean) {
  const color = STATUS_COLOR[status] ?? STATUS_COLOR.ok
  const badge = visited
    ? `<div style="position:absolute;top:-3px;right:-3px;width:10px;height:10px;background:#4f46e5;border:2px solid white;border-radius:50%"></div>`
    : ''
  const html = `
    <div style="position:relative;width:28px;height:36px">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
        <path d="M14 0C6.268 0 0 6.268 0 14c0 9.625 14 22 14 22S28 23.625 28 14C28 6.268 21.732 0 14 0z"
              fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="14" cy="14" r="6" fill="white" fill-opacity="0.85"/>
      </svg>
      ${badge}
    </div>`
  return divIcon({
    html,
    className: '',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  })
}

export function StationMarker({ station, onClick, visited = false }: Props) {
  const status = getStationStatus(station)
  const capacity = getCapacity(station)

  return (
    <Marker
      position={[station.latitude, station.longitude]}
      icon={createIcon(status, visited)}
      eventHandlers={{ click: () => onClick(station) }}
    >
      <Popup>
        <div className="text-sm font-medium">{station.name}</div>
        <div className="text-xs text-gray-500 mt-0.5">
          {station.free_bikes} bike{station.free_bikes !== 1 ? 's' : ''} disponíve{station.free_bikes !== 1 ? 'is' : 'l'}
          {' '}· capacidade {capacity}
        </div>
      </Popup>
    </Marker>
  )
}
