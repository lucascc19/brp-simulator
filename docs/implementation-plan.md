# Plano de Implementação — BRP Simulator UI

## Status geral

| Fase | Feature | Status |
|------|---------|--------|
| 0 | Setup inicial (Vite + React + Leaflet + TanStack Query + Tailwind) | ✅ Concluído |
| 0 | Visualização de estações do Bicicletar no mapa | ✅ Concluído |
| 0 | Card de detalhes ao clicar numa estação | ✅ Concluído |
| 1 | Filtros de status | ✅ Concluído |
| 1 | Busca de estação | ✅ Concluído |
| 2 | Tipos e algoritmo guloso | ✅ Concluído |
| 2 | GRASP | ✅ Concluído |
| 2 | RouteLayer + animação | ✅ Concluído |
| 2 | SimulatorPanel + RouteStats | ✅ Concluído |
| 3 | Estado pós-simulação nos markers | ✅ Concluído |
| 3 | StationCard com comparativo antes/depois | ✅ Concluído |
| 3 | Toggle "Estado real / Resultado" | ✅ Concluído |
| 4 | Docker + PostgreSQL + Prisma schema | ✅ Concluído |
| 4 | Sync Service + cron | ✅ Concluído |
| 4 | API REST (Fastify) | ✅ Concluído |
| 4 | Trocar URL no useStations | ✅ Concluído |
| 5 | Repositório GitHub | ✅ Concluído |
| 5 | Deploy backend (Railway) | ✅ Concluído |
| 5 | Deploy frontend (Vercel) | ✅ Concluído |

---

## Fase 1 — Filtros + Busca

**Objetivo:** permitir ao usuário filtrar estações por status e localizar uma estação pelo nome.

### Novos arquivos

```
src/
├── components/
│   ├── FilterBar.tsx       ← pills ok / poucas bikes / vazia
│   └── SearchBox.tsx       ← input com lista de sugestões + pan no mapa
└── hooks/
    └── useMapControl.ts    ← ref do mapa para flyTo (pan + zoom)
```

### Mudanças em arquivos existentes

| Arquivo | O que muda |
|---------|------------|
| `src/components/Map.tsx` | recebe `activeFilters` e `searchQuery`; exibe `FilterBar` e `SearchBox` no header; filtra os markers antes de renderizar |
| `src/App.tsx` | mantém estado `activeFilters: StationStatus[]` e repassa para `Map` |

---

## Fase 2 — Simulador de Rota

**Objetivo:** implementar o algoritmo guloso e o GRASP em TypeScript, rodar sobre os dados reais da API e animar a rota do caminhão no mapa.

### Novos arquivos

```
src/
├── algorithms/
│   ├── types.ts            ← RouteInput, RouteStep, RouteResult
│   ├── utils.ts            ← selectCandidates, simulateTruck (implicit depot reload)
│   ├── greedy.ts           ← algoritmo guloso determinístico
│   └── grasp.ts            ← GRASP (construção + busca local pairwise)
└── components/
    ├── SimulatorPanel.tsx  ← controles: selecionar algo, configurar, rodar
    ├── RouteLayer.tsx      ← Polyline da rota + ícone do caminhão no mapa
    └── RouteStats.tsx      ← card com distância total e desequilíbrio residual
```

### Tipos centrais (`algorithms/types.ts`)

```typescript
interface RouteStep {
  station: Station
  action: 'pickup' | 'delivery' | 'balanced'
  quantity: number           // bikes coletadas (+) ou entregues (-)
  truckLoad: number          // carga no caminhão após a visita
  stationBikesAfter: number  // bikes na estação após a visita
}

interface RouteResult {
  algorithm: 'greedy' | 'grasp'
  steps: RouteStep[]
  totalDistance: number      // km (distância euclidiana acumulada)
  residualImbalance: number  // soma de |Q_i - target| após a rota
  executionMs: number
}
```

### Detalhes de implementação

**`selectCandidates`** — divide os top-N candidatos em 50% fontes de coleta + 50% destinos de entrega, evitando que o caminhão comece sem conseguir atender nenhuma estação quando o sistema está majoritariamente vazio.

**Implicit depot reload** — antes de visitar cada estação, se o caminhão está cheio e a próxima ação é coleta, ou vazio e é entrega, reseta a carga (simula uma parada implícita no depósito). Permite multi-trip sem modelar o depósito explicitamente.

---

## Fase 3 — Estado Pós-Simulação

**Objetivo:** ao fim da simulação, atualizar os markers do mapa com o estado resultante de cada estação e exibir um comparativo antes/depois no StationCard.

### Mudanças implementadas

| Arquivo | O que mudou |
|---------|-------------|
| `src/components/Map.tsx` | `simulatedMap: Map<stationId, bikesAfter>` derivado de `route.steps`; `effectiveStations` substitui contagens quando `showSimulatedState=true` |
| `src/components/StationMarker.tsx` | prop `visited?: boolean`; badge indigo no canto superior direito do pin quando visitado |
| `src/components/StationCard.tsx` | prop `simulatedBikes?: number`; seção "Resultado Simulado" com barras antes/depois e delta |
| `src/components/RouteStats.tsx` | botão toggle "Ver resultado / Ver estado real" em `AnimationControls` |

### Fluxo de estado

```
Map.tsx
  showSimulatedState: boolean              ← false por default; reset ao calcular nova rota
  simulatedMap: Map<stationId, bikesAfter> ← derivado de route.steps

  effectiveStations = showSimulatedState
    ? limitedStations com free_bikes substituído pelo valor simulado
    : limitedStations (estado real da API)

  → StationMarker: visited = simulatedMap.has(s.id) && showSimulatedState
  → StationCard:   simulatedBikes = simulatedMap.get(selected.id)
```

---

## Fase 4 — Backend Próprio (Prisma + Docker + API REST)

**Objetivo:** eliminar dependência exclusiva da API CityBikes armazenando snapshots em banco próprio, expondo API REST compatível com o frontend.

### Arquitetura

```
┌─────────────┐   cron (5 min)   ┌──────────────────┐
│ CityBikes   │ ─────────────── ▶│  Sync Service    │
│ API (ext.)  │                  │  (server/sync.ts)│
└─────────────┘                  └────────┬─────────┘
                                          │ upsert
                                          ▼
                                 ┌──────────────────┐
                                 │   PostgreSQL     │
                                 │  Station         │
                                 │  Snapshot        │
                                 └────────┬─────────┘
                                          │ Prisma
                                          ▼
┌─────────────┐   fetch           ┌──────────────────┐
│  React UI   │ ─────────────── ▶│  Fastify API     │
│  (Vite)     │                  │  /api/stations   │
└─────────────┘                  └──────────────────┘
```

### Estrutura de arquivos

```
brp-simulator/
├── src/
│   └── hooks/
│       └── useStations.ts       ← usa VITE_API_URL; fallback para CityBikes
├── server/
│   ├── prisma/
│   │   ├── schema.prisma        ← modelos Station + Snapshot
│   │   └── migrations/          ← gerado pelo Prisma
│   ├── src/
│   │   ├── index.ts             ← Fastify app + cron + initial sync
│   │   ├── db.ts                ← instância do PrismaClient
│   │   ├── sync.ts              ← fetch CityBikes → upsert DB
│   │   └── routes/
│   │       └── stations.ts      ← GET /api/stations, /history, /snapshots, POST /sync
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml           ← PostgreSQL 16
├── railway.toml                 ← config de build/start para Railway
└── .env                         ← DATABASE_URL, VITE_API_URL, SYNC_INTERVAL_CRON
```

### API REST

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/stations[?at=<ISO>]` | Estado atual (ou histórico) — shape idêntica à CityBikes API |
| `GET` | `/api/stations/:id/history` | Histórico de snapshots com `from`, `to`, `limit` |
| `GET` | `/api/snapshots/timestamps` | Lista de timestamps de sync disponíveis |
| `POST` | `/api/sync` | Dispara sync manual |
| `GET` | `/health` | Health check |

### Decisões técnicas

- `fetchedAt` sem `@default(now())` — passado explicitamente pelo sync para garantir que todos os snapshots de um mesmo batch tenham o **exato mesmo timestamp**, tornando o `groupBy` confiável.
- Build command **não** inclui `prisma migrate deploy` — o hostname interno do Railway (`postgres.railway.internal`) só está disponível em runtime, não durante o build. O migrate roda no `startCommand`.

---

## Fase 5 — Deploy

**Objetivo:** disponibilizar a aplicação publicamente com backend persistente.

### Infraestrutura

| Serviço | Plataforma | URL |
|---------|------------|-----|
| Frontend (React/Vite) | Vercel | https://brp-simulator.vercel.app |
| Backend (Fastify) | Railway | https://brp-simulator-production.up.railway.app |
| Banco de dados | Railway (Postgres plugin) | interno ao projeto Railway |

### Configuração

**Railway (`railway.toml` na raiz do repo):**
```toml
[build]
buildCommand = "cd server && npm install && npm run build"

[deploy]
startCommand = "cd server && npm run db:deploy && npm start"
healthcheckPath = "/health"
```

**Vercel (`vercel.json` na raiz do repo):**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**Variáveis de ambiente:**
- Railway: `DATABASE_URL` (injetado automaticamente pelo Postgres plugin), `SYNC_INTERVAL_CRON`
- Vercel: `VITE_API_URL=https://brp-simulator-production.up.railway.app`

### Repositório

- GitHub: https://github.com/lucascc19/brp-simulator
- CI/CD: push para `main` redeploya automaticamente em ambas as plataformas

---

## Bonus — Time Travel (pós Fase 4)

Com snapshots armazenados, é possível adicionar um seletor de data/hora na UI para carregar o estado do sistema em qualquer momento passado — útil para o TCC mostrar a evolução do desequilíbrio ao longo do dia.

O endpoint `GET /api/stations?at=<ISO>` já está implementado e pronto para ser conectado à UI.
