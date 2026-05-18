import Fastify from 'fastify'
import cors from '@fastify/cors'
import cron from 'node-cron'
import { stationsRoutes } from './routes/stations'
import { sync } from './sync'

const PORT = parseInt(process.env.PORT ?? '3001', 10)
const SYNC_CRON = process.env.SYNC_INTERVAL_CRON ?? '*/5 * * * *'

const fastify = Fastify({ logger: true })

async function start() {
  await fastify.register(cors, { origin: true })

  fastify.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))

  await fastify.register(stationsRoutes, { prefix: '/api' })

  // Schedule periodic sync
  cron.schedule(SYNC_CRON, async () => {
    try {
      const n = await sync()
      fastify.log.info(`Cron sync: ${n} stations`)
    } catch (err) {
      fastify.log.error({ err }, 'Cron sync failed')
    }
  })

  // Initial sync on startup so the DB is never empty
  try {
    const n = await sync()
    fastify.log.info(`Initial sync: ${n} stations`)
  } catch (err) {
    fastify.log.warn({ err }, 'Initial sync failed — continuing without data')
  }

  await fastify.listen({ port: PORT, host: '0.0.0.0' })
}

start().catch(err => {
  console.error(err)
  process.exit(1)
})
