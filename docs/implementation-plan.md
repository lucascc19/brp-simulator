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
| 3 | Estado pós-simulação nos markers | ⏳ Pendente |
| 3 | StationCard com comparativo antes/depois | ⏳ Pendente |
| 3 | Toggle "Estado real / Resultado" | ⏳ Pendente |

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

### Fluxo de estado

```
App
 └── activeFilters: StationStatus[]   ← ['ok', 'low', 'empty'] por default
      └── Map → StationMarker (só renderiza se status ∈ activeFilters)
          └── FilterBar → toggle de cada status

 └── SearchBox (dentro do Map)
      ├── filtra stations pelo nome
      ├── mostra dropdown com até 5 sugestões
      └── ao selecionar → flyTo(station) + abre StationCard
```

---

## Fase 2 — Simulador de Rota

**Objetivo:** implementar o algoritmo guloso e o GRASP em TypeScript, rodar sobre os dados reais da API e animar a rota do caminhão no mapa.

### Novos arquivos

```
src/
├── algorithms/
│   ├── types.ts            ← RouteInput, RouteStep, RouteResult
│   ├── greedy.ts           ← algoritmo guloso determinístico
│   └── grasp.ts            ← GRASP (construção + busca local)
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
  quantity: number        // bikes coletadas (+) ou entregues (-)
  truckLoad: number       // carga no caminhão após a visita
}

interface RouteResult {
  algorithm: 'greedy' | 'grasp'
  steps: RouteStep[]
  totalDistance: number   // km (distância euclidiana acumulada)
  residualImbalance: number  // soma de |Q_i - target| após a rota
  executionMs: number
}
```

### Algoritmos

**Guloso** — determinístico, O(n²):
1. Começa na estação com maior desequilíbrio
2. A cada passo, escolhe o vizinho não atendido com maior `|Q_i - 10|`
3. Atende a estação (coleta ou entrega), respeita capacidade 20
4. Para quando todas estão balanceadas ou caminhão precisa retornar

**GRASP** — probabilístico, `k` iterações:
1. **Construção:** roleta viciada nos vizinhos (peso proporcional ao desequilíbrio)
2. **Busca local:** testa trocas de pares de estações na rota; aceita se reduzir distância total
3. Repete por `k = 30` iterações; guarda melhor resultado

### Animação da rota

```
SimulatorPanel
 ├── botão "Executar" → calcula RouteResult
 ├── botão "Animar" → avança currentStep via setInterval (velocidade ajustável)
 └── RouteLayer
      ├── <Polyline> com a sequência completa (cinza)
      ├── <Polyline> com os passos já percorridos (verde/laranja)
      └── <Marker> caminhão na posição currentStep
```

### Painel de resultados (`RouteStats`)

- Distância total percorrida
- Desequilíbrio residual (quantidade de bikes fora do alvo)
- Tempo de execução
- Comparativo lado a lado quando ambos os algoritmos são rodados

---

## Fase 3 — Estado Pós-Simulação

**Objetivo:** ao fim da simulação, atualizar os markers do mapa com o estado resultante de cada estação e exibir um comparativo antes/depois no StationCard, permitindo avaliar visualmente a qualidade do balanceamento.

### Nenhum arquivo novo — apenas modificações

| Arquivo | O que muda |
|---------|------------|
| `src/components/Map.tsx` | estado `showSimulatedState`; deriva `simulatedMap` e `effectiveStations`; repassa toggle para `RouteStats` via `AnimationControls` |
| `src/components/StationMarker.tsx` | prop `visited?: boolean`; quando visitado, renderiza anel/halo ao redor do pin |
| `src/components/StationCard.tsx` | prop `simulatedBikes?: number`; mostra seção antes/depois com duas barras de ocupação e delta |
| `src/components/RouteStats.tsx` | adiciona `showSimulatedState` + `onToggleSimulatedView` em `AnimationControls`; exibe botão de toggle |
| `src/components/SimulatorPanel.tsx` | passa os novos campos de `AnimationControls` adiante |

### Fluxo de estado

```
Map.tsx
  showSimulatedState: boolean              ← false por default; reset ao calcular nova rota
  simulatedMap: Map<stationId, bikesAfter> ← derivado de route.steps (já existe stationBikesAfter)

  effectiveStations = showSimulatedState
    ? limitedStations.map(s =>
        simulatedMap.has(s.id)
          ? { ...s, free_bikes: simulatedMap.get(s.id)!,
                    empty_slots: capacity(s) - simulatedMap.get(s.id)! }
          : s)
    : limitedStations

  visibleStations = effectiveStations.filter(activeFilters)   ← cores dos markers refletem estado simulado

  → StationMarker
      station = effectiveStation          ← recebe estado já substituído; lógica de cor inalterada
      visited = simulatedMap.has(s.id) && showSimulatedState

  → StationCard
      station = original (live)
      simulatedBikes = simulatedMap.get(selected.id)   ← undefined se não visitada

  → SimulatorPanel → RouteStats
      showSimulatedState, onToggleSimulatedView
```

### Detalhes de cada mudança

#### `StationMarker.tsx` — anel de visita

Quando `visited=true`, adiciona ao SVG um círculo semi-transparente ao redor do pin:

```svg
<!-- anel verde/violeta ao redor do teardrop -->
<circle cx="14" cy="14" r="16" fill="none" stroke="${color}" stroke-width="2.5" stroke-opacity="0.4"/>
```

Cores do anel: verde para Guloso, violeta para GRASP (mesmo `ALGO_COLOR` do `RouteLayer`).

#### `StationCard.tsx` — seção antes/depois

Renderizada apenas quando `simulatedBikes` está definido:

```
┌─────────────────────────────────────────┐
│  Antes   [████░░░░░░░░]  5 bikes  42%   │
│  Depois  [████████░░░░]  10 bikes  83%  │
│                               Δ +5 bikes │
└─────────────────────────────────────────┘
```

O delta é colorido: verde se melhorou (|simulado - target| < |real - target|), vermelho se piorou.

#### `RouteStats.tsx` — botão de toggle

Adicionado junto aos controles de animação, visível somente quando `route != null`:

```
[ ↺ ]  [ ▶ Animar ]  [ 1× ▾ ]  [ 🗺 Ver resultado ]
                                 ↑ ou "Ver estado real"
```

O botão alterna `showSimulatedState`. Quando ativo, um badge discreto no header do mapa pode indicar "Visualizando resultado simulado".

### Dados já disponíveis (sem mudança de algoritmo)

`RouteStep.stationBikesAfter` já é calculado em `greedy.ts` e `utils.ts` (simulateTruck). O dado necessário para toda a Fase 3 já existe — só falta expô-lo na UI.

### Casos de borda

| Situação | Comportamento |
|----------|---------------|
| Estação não visitada pelo algoritmo | marker mantém estado real; StationCard não exibe seção antes/depois |
| Estação visitada mas com `action: 'none'` | `stationBikesAfter === free_bikes`; delta = 0; seção exibida mas sem alteração |
| Nova rota calculada | `showSimulatedState` volta a `false` automaticamente |
| Filtro de status ativo no modo simulado | filtra pela cor **simulada** (não real) |

---

## Fase 4 — Backend Próprio (Prisma + Docker + API REST)

**Objetivo:** eliminar dependência exclusiva da API CityBikes armazenando snapshots das estações em banco de dados próprio, expondo uma API REST compatível com o frontend e habilitando consulta de dados históricos.

---

### Visão geral da arquitetura

```
┌─────────────┐   cron (5 min)   ┌──────────────────┐
│ CityBikes   │ ─────────────── ▶│  Sync Service    │
│ API (ext.)  │                  │  (server/sync.ts)│
└─────────────┘                  └────────┬─────────┘
                                          │ upsert
                                          ▼
                                 ┌──────────────────┐
                                 │   PostgreSQL     │
                                 │   (Docker)       │
                                 │  Station         │
                                 │  Snapshot        │
                                 └────────┬─────────┘
                                          │ Prisma
                                          ▼
┌─────────────┐   fetch           ┌──────────────────┐
│  React UI   │ ─────────────── ▶│  API REST        │
│  (Vite)     │                  │  (Fastify/Express)│
└─────────────┘                  └──────────────────┘
```

---

### Estrutura de arquivos

```
brp-simulator/
├── src/                         ← frontend (sem mudanças estruturais)
│   └── hooks/
│       └── useStations.ts       ← troca URL para VITE_API_URL
├── server/
│   ├── prisma/
│   │   ├── schema.prisma        ← modelos Station + Snapshot
│   │   └── migrations/          ← gerado pelo Prisma
│   ├── src/
│   │   ├── index.ts             ← entry point (Fastify app + cron)
│   │   ├── db.ts                ← instância do PrismaClient
│   │   ├── sync.ts              ← fetch CityBikes → upsert DB
│   │   └── routes/
│   │       └── stations.ts      ← GET /api/stations, /history, /snapshots
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml           ← PostgreSQL 16
└── .env                         ← DATABASE_URL, VITE_API_URL, SYNC_INTERVAL_MS
```

---

### Schema Prisma (`server/prisma/schema.prisma`)

```prisma
model Station {
  id        String     @id          // id da CityBikes API
  name      String
  latitude  Float
  longitude Float
  capacity  Int                     // free_bikes + empty_slots no primeiro sync
  createdAt DateTime   @default(now())
  snapshots Snapshot[]
}

model Snapshot {
  id         Int      @id @default(autoincrement())
  stationId  String
  freeBikes  Int
  emptySlots Int
  fetchedAt  DateTime @default(now())
  station    Station  @relation(fields: [stationId], references: [id])

  @@index([stationId, fetchedAt])
  @@index([fetchedAt])             // consultas por janela de tempo
}
```

---

### API REST

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/stations` | Estado atual de todas as estações (último snapshot) — **mesma shape da CityBikes API** |
| `GET` | `/api/stations/:id/history?from=&to=` | Histórico de snapshots de uma estação num intervalo |
| `GET` | `/api/snapshots/timestamps` | Lista de `fetchedAt` únicos disponíveis |
| `GET` | `/api/stations?at=<ISO>` | Estado de todas as estações num snapshot específico |
| `POST` | `/api/sync` | Dispara sync manual (útil em dev) |

O endpoint `GET /api/stations` retorna exatamente a shape da CityBikes API:

```json
{
  "network": {
    "stations": [
      {
        "id": "...", "name": "...",
        "free_bikes": 5, "empty_slots": 15,
        "latitude": -3.73, "longitude": -38.52,
        "timestamp": "2025-05-17T18:00:00Z",
        "extra": {}
      }
    ]
  }
}
```

Isso garante que `useStations.ts` muda apenas a URL — lógica do frontend intacta.

---

### Sync Service (`server/src/sync.ts`)

```
1. fetch https://api.citybik.es/v2/networks/bicicletar
2. Para cada station da resposta:
   a. upsert em Station (id, name, lat, lng, capacity)
   b. insert em Snapshot (freeBikes, emptySlots, fetchedAt = now())
3. Log: X estações sincronizadas em Y ms
```

Agendado via `node-cron` a cada 5 minutos (configurável em `.env`).

---

### Docker (`docker-compose.yml`)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: brp
      POSTGRES_USER: brp
      POSTGRES_PASSWORD: brp
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U brp"]
      interval: 5s
      retries: 5

volumes:
  pgdata:
```

---

### Mudanças no frontend

| Arquivo | O que muda |
|---------|------------|
| `src/hooks/useStations.ts` | URL muda de CityBikes para `VITE_API_URL ?? 'https://api.citybik.es/...'` — fallback mantém funcionamento sem backend |
| `.env` (novo) | `VITE_API_URL=http://localhost:3001` em dev |

---

### Scripts (raiz `package.json`)

```json
"server:dev":   "tsx watch server/src/index.ts",
"server:sync":  "tsx server/src/sync.ts",
"db:migrate":   "cd server && npx prisma migrate dev",
"db:studio":    "cd server && npx prisma studio"
```

---

### Bonus — Time Travel (pós Fase 4)

Com snapshots armazenados, será possível adicionar um seletor de data/hora na UI para carregar o estado do sistema em qualquer momento passado — útil para o TCC mostrar a evolução do desequilíbrio ao longo do dia.

---

## Ordem de entrega

| # | Feature | Complexidade | Status |
|---|---------|--------------|--------|
| 1 | Filtros de status | Baixa | ✅ Concluído |
| 2 | Busca de estação | Baixa | ✅ Concluído |
| 3 | Tipos + algoritmo guloso | Média | ✅ Concluído |
| 4 | GRASP | Média-Alta | ✅ Concluído |
| 5 | RouteLayer + animação | Média | ✅ Concluído |
| 6 | SimulatorPanel + RouteStats | Média | ✅ Concluído |
| 7 | Estado pós-simulação nos markers | Baixa | ✅ Concluído |
| 8 | StationCard antes/depois | Baixa | ✅ Concluído |
| 9 | Toggle estado real / resultado | Baixa | ✅ Concluído |
| 10 | Docker + PostgreSQL + Prisma schema | Baixa | ⏳ Pendente |
| 11 | Sync Service + cron | Média | ⏳ Pendente |
| 12 | API REST (Fastify) | Média | ⏳ Pendente |
| 13 | Trocar URL no useStations | Baixa | ⏳ Pendente |
