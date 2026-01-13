# Puget Sound Creel Data API / ETL

Node.js + Express + TypeScript + Prisma (v7) API backed by PostgreSQL, plus an ETL that ingests the WDFW Puget Sound creel CSV and upserts it into the database.

## Prereqs

- Node.js 18+
- PostgreSQL reachable via `DATABASE_URL` (Supabase works)
- WDFW CSV source: `https://wdfw.wa.gov/fishing/reports/creel/puget-annual/export?_format=csv`

## Environment

Create `.env` in the repo root:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
PORT=4000
CLIENT_URL=http://localhost:3000
```

## Install

```
npm install
```

## Prisma (v7)

- Config file: `prisma.config.ts`
- Generator includes `binaryTargets = ["native", "rhel-openssl-3.0.x"]` to support Lambda’s Linux runtime.
- Generate client: `npx prisma generate --config ./prisma.config.ts`
- Apply schema (unique on sample date + ramp + catch area): `npx prisma migrate dev --name init --config ./prisma.config.ts`

## Run API

```
PORT=4000 npm start
```

Routes (JSON):

- `GET /reports` (optional `?limit`)
- `POST /reports`
- `GET /reports/date?startDate=ISO&endDate=ISO`
- `GET /reports/catcharea/:catchAreaName`
- `GET /reports/species?species=Chinook&minCount=1`
- `GET /reports/ramp/:rampName`
- `GET /reports/anglers?minAnglers=3`
- `GET /reports/aggregate`
- Helpers: `GET /reports/exists`, `GET /ramps/:rampName`, `GET /catchareas/:catchAreaName`

## Run ETL (local)

```
npm run etl
```

Env options:

- `CSV_URL` (default: WDFW export)
- `SAMPLE_DATE_PARAM` (optional WDFW year selector)
- `BATCH_SIZE` (default 50)
- `DRY_RUN=true` to parse without writes

Behavior: streams CSV, normalizes dates/numbers, maps ramp/catch area names to IDs, and upserts on `(sample_date_parsed, ramp_id, catch_area_id)`.

## Lambda deployment (outline)

- API Lambda: handler `api/lambda.handler` wraps Express via `serverless-http`; expose with API Gateway HTTP API.
- ETL Lambda: handler `etl/lambda.handler`; trigger with EventBridge every 12h.
- Both Lambdas need `DATABASE_URL` (use Secrets Manager/SSM). Optional: `CSV_URL`, `SAMPLE_DATE_PARAM`, `BATCH_SIZE`, `DRY_RUN` for ETL.
- Package with the generated Prisma client (Linux target), `node_modules`, and project files. Use Node 18/20 runtimes. Memory: API ~512–1024 MB; ETL ~512–1024 MB, 3–5 min timeout.
