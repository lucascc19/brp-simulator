import { useQuery } from '@tanstack/react-query'
import type { NetworkResponse } from '../types/citybikes'

const API_BASE = import.meta.env.VITE_API_URL as string | undefined
const STATIONS_URL = API_BASE
  ? `${API_BASE}/api/stations`
  : 'https://api.citybik.es/v2/networks/bicicletar'

async function fetchStations(): Promise<NetworkResponse> {
  const res = await fetch(STATIONS_URL, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Erro ao buscar dados: ${res.status}`)
  return res.json() as Promise<NetworkResponse>
}

export function useStations() {
  return useQuery({
    queryKey: ['stations', 'bicicletar'],
    queryFn: fetchStations,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
