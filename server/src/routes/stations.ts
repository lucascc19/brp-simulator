import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../db'
import { sync } from '../sync'

export const stationsRoutes: FastifyPluginAsync = async fastify => {
  // GET /api/stations[?at=<ISO>]
  // Returns the current state of all stations in CityBikes-compatible shape.
  // Pass ?at=<ISO date> to query a historical snapshot.
  fastify.get('/stations', async request => {
    const { at } = request.query as { at?: string }
    const timestamp = at ? new Date(at) : null

    const stations = await prisma.station.findMany({
      include: {
        snapshots: {
          where: timestamp ? { fetchedAt: { lte: timestamp } } : undefined,
          orderBy: { fetchedAt: 'desc' },
          take: 1,
        },
      },
    })

    return {
      network: {
        stations: stations
          .filter(s => s.snapshots.length > 0)
          .map(s => ({
            id: s.id,
            name: s.name,
            latitude: s.latitude,
            longitude: s.longitude,
            free_bikes: s.snapshots[0].freeBikes,
            empty_slots: s.snapshots[0].emptySlots,
            timestamp: s.snapshots[0].fetchedAt.toISOString(),
            extra: {},
          })),
      },
    }
  })

  // GET /api/stations/:id/history[?from=&to=&limit=]
  fastify.get('/stations/:id/history', async request => {
    const { id } = request.params as { id: string }
    const { from, to, limit = '288' } = request.query as {
      from?: string
      to?: string
      limit?: string
    }

    const snapshots = await prisma.snapshot.findMany({
      where: {
        stationId: id,
        fetchedAt: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to) } : {}),
        },
      },
      orderBy: { fetchedAt: 'desc' },
      take: parseInt(limit, 10),
    })

    return snapshots.map(s => ({
      freeBikes: s.freeBikes,
      emptySlots: s.emptySlots,
      fetchedAt: s.fetchedAt.toISOString(),
    }))
  })

  // GET /api/snapshots/timestamps
  // Returns the list of available sync timestamps (one entry per sync run).
  fastify.get('/snapshots/timestamps', async () => {
    const rows = await prisma.snapshot.groupBy({
      by: ['fetchedAt'],
      orderBy: { fetchedAt: 'desc' },
      take: 500,
    })
    return rows.map(r => r.fetchedAt.toISOString())
  })

  // POST /api/sync — manual trigger (useful in development)
  fastify.post('/sync', async () => {
    const t0 = Date.now()
    const count = await sync()
    return { synced: count, ms: Date.now() - t0 }
  })
}
