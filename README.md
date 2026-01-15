# Puget Sound Creel Data API / ETL

Node.js + Express + TypeScript + Prisma (v7) API backed by PostgreSQL, plus an ETL that ingests the WDFW Puget Sound creel CSV and upserts it into the database.

## Frontend

- Deployed: <https://pscreelreports.com>
- Source (GitHub): <https://github.com/thomas-basham/ps-creel>

## Prereqs

- Node.js 18+
- PostgreSQL reachable via `DATABASE_URL`
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

## ETL Lambda (CloudFormation)

- Template: `infra/etl-schedule.yaml`
- Default schedule: `rate(20 minutes)` (EventBridge)
- Handler: `dist/etl/lambda.handler` (built via `tsconfig.lambda.json`)
- Required env: `DATABASE_URL` (Optional: `DIRECT_URL`, `CSV_URL`, `SAMPLE_DATE_PARAM`, `BATCH_SIZE`, `DRY_RUN`)

Deploy example:

```
aws cloudformation deploy \
  --template-file infra/etl-schedule.yaml \
  --stack-name ps-creel-etl \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    EtlCodeS3Bucket=YOUR_BUCKET \
    EtlCodeS3Key=path/to/etl.zip \
    DatabaseUrl='postgresql://...'
```

## GitHub Actions deploy

Workflow: `.github/workflows/deploy-etl.yml` (runs on push to `main`).

Required GitHub variables:

- `AWS_REGION`
- `ETL_S3_BUCKET`
- Optional: `ETL_S3_PREFIX` (defaults to `etl/`)

Required GitHub secrets:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `DATABASE_URL`
- Optional: `DIRECT_URL`
