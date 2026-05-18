import { prisma } from './db'

const CITYBIKES_URL = 'https://api.citybik.es/v2/networks/bicicletar'

interface CityBikesStation {
  id: string
  name: string
  latitude: number
  longitude: number
  free_bikes: number
  empty_slots: number
}

interface CityBikesResponse {
  network: { stations: CityBikesStation[] }
}

export async function sync(): Promise<number> {
  const res = await fetch(CITYBIKES_URL)
  if (!res.ok) throw new Error(`CityBikes API error: ${res.status}`)

  const data = (await res.json()) as CityBikesResponse
  const stations = data.network.stations

  // Single timestamp for the whole batch — ensures all snapshots from this sync
  // share the exact same fetchedAt, making groupBy queries reliable
  const fetchedAt = new Date()

  // Upsert station metadata (name/coordinates may change)
  await prisma.$transaction(
    stations.map(s =>
      prisma.station.upsert({
        where: { id: s.id },
        create: {
          id: s.id,
          name: s.name,
          latitude: s.latitude,
          longitude: s.longitude,
          capacity: s.free_bikes + s.empty_slots,
        },
        update: {
          name: s.name,
          latitude: s.latitude,
          longitude: s.longitude,
        },
      }),
    ),
  )

  // Insert one snapshot per station for this sync
  await prisma.snapshot.createMany({
    data: stations.map(s => ({
      stationId: s.id,
      freeBikes: s.free_bikes,
      emptySlots: s.empty_slots,
      fetchedAt,
    })),
  })

  return stations.length
}

// Allow running directly: cd server && npm run sync
if (require.main === module) {
  sync()
    .then(n => {
      console.log(`✓ Synced ${n} stations`)
      process.exit(0)
    })
    .catch(e => {
      console.error('Sync failed:', e)
      process.exit(1)
    })
}
