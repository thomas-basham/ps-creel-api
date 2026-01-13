import axios from "axios";
import { parse as parseCsv } from "csv-parse";
import { isValid, parse as parseDate } from "date-fns";
import { prisma } from "../prismaClient/prisma";
import {
  ramps as RampModel,
  catcharea as CatchAreaModel,
} from "@prisma/client";

type CsvRow = Record<string, string>;

type NormalizedReport = {
  Sample_date: string;
  Ramp_site: string;
  Catch_area: string;
  Interviews__Boat_or_Shore_: number | null;
  Anglers: number | null;
  Chinook__per_angler_: number | null;
  Chinook: number | null;
  Coho: number | null;
  Chum: number | null;
  Pink: number | null;
  Sockeye: number | null;
  Lingcod: number | null;
  Halibut: number | null;
  catch_area_id: bigint;
  ramp_id: bigint;
  sample_date_parsed: Date;
};

const DEFAULT_CSV_URL =
  "https://wdfw.wa.gov/fishing/reports/creel/puget-annual/export?_format=csv";
const CSV_URL = process.env.CSV_URL ?? DEFAULT_CSV_URL;
const SAMPLE_DATE_PARAM = process.env.SAMPLE_DATE_PARAM; // Optional: WDFW year selector value
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE ?? "50", 10);
const DRY_RUN = process.env.DRY_RUN === "true";

const dateFormat = "MMM d, yyyy";

function normalizeName(value?: string): string {
  return value?.trim().toLowerCase() ?? "";
}

function toInt(value?: string): number | null {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function toFloat(value?: string): number | null {
  if (!value) return null;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function buildCsvUrl(): string {
  if (!SAMPLE_DATE_PARAM) return CSV_URL;
  const joiner = CSV_URL.includes("?") ? "&" : "?";
  return `${CSV_URL}${joiner}sample_date=${encodeURIComponent(
    SAMPLE_DATE_PARAM
  )}`;
}

async function loadReferenceMaps() {
  const [ramps, catchAreas] = await Promise.all([
    prisma.ramps.findMany(),
    prisma.catcharea.findMany(),
  ]);

  const rampMap = new Map<string, bigint>();
  const catchAreaMap = new Map<string, bigint>();

  ramps.forEach((r: RampModel) => rampMap.set(normalizeName(r.name), r.id));
  catchAreas.forEach((c: CatchAreaModel) =>
    catchAreaMap.set(normalizeName(c.name), c.id)
  );

  return { rampMap, catchAreaMap };
}

function normalizeRow(
  row: CsvRow,
  rampMap: Map<string, bigint>,
  catchAreaMap: Map<string, bigint>
): NormalizedReport | null {
  const rawDate = row["Sample date"]?.trim();
  const rampName = row["Ramp/site"]?.trim() ?? "";
  const catchAreaName = row["Catch area"]?.trim() ?? "";

  const parsedDate = parseDate(rawDate ?? "", dateFormat, new Date());
  if (!rawDate || !isValid(parsedDate)) {
    return null;
  }

  const rampId = rampMap.get(normalizeName(rampName));
  const catchAreaId = catchAreaMap.get(normalizeName(catchAreaName));
  if (!rampId || !catchAreaId) {
    return null;
  }

  return {
    Sample_date: rawDate,
    Ramp_site: rampName,
    Catch_area: catchAreaName,
    Interviews__Boat_or_Shore_: toInt(row["# Interviews (Boat or Shore)"]),
    Anglers: toInt(row["Anglers"]),
    Chinook__per_angler_: toFloat(row["Chinook (per angler)"]),
    Chinook: toInt(row["Chinook"]),
    Coho: toInt(row["Coho"]),
    Chum: toInt(row["Chum"]),
    Pink: toInt(row["Pink"]),
    Sockeye: toInt(row["Sockeye"]),
    Lingcod: toInt(row["Lingcod"]),
    Halibut: toInt(row["Halibut"]),
    catch_area_id: catchAreaId,
    ramp_id: rampId,
    sample_date_parsed: parsedDate,
  };
}

async function persistBatch(batch: NormalizedReport[], stats: any) {
  if (batch.length === 0) return;

  for (const row of batch) {
    stats.processed += 1;
    if (DRY_RUN) {
      stats.dryRunSkipped += 1;
      continue;
    }

    await prisma.report.upsert({
      where: {
        sample_date_parsed_ramp_id_catch_area_id: {
          sample_date_parsed: row.sample_date_parsed,
          ramp_id: row.ramp_id,
          catch_area_id: row.catch_area_id,
        },
      },
      update: {
        Sample_date: row.Sample_date,
        Ramp_site: row.Ramp_site,
        Catch_area: row.Catch_area,
        Interviews__Boat_or_Shore_: row.Interviews__Boat_or_Shore_,
        Anglers: row.Anglers,
        Chinook__per_angler_: row.Chinook__per_angler_,
        Chinook: row.Chinook,
        Coho: row.Coho,
        Chum: row.Chum,
        Pink: row.Pink,
        Sockeye: row.Sockeye,
        Lingcod: row.Lingcod,
        Halibut: row.Halibut,
      },
      create: {
        Sample_date: row.Sample_date,
        Ramp_site: row.Ramp_site,
        Catch_area: row.Catch_area,
        Interviews__Boat_or_Shore_: row.Interviews__Boat_or_Shore_,
        Anglers: row.Anglers,
        Chinook__per_angler_: row.Chinook__per_angler_,
        Chinook: row.Chinook,
        Coho: row.Coho,
        Chum: row.Chum,
        Pink: row.Pink,
        Sockeye: row.Sockeye,
        Lingcod: row.Lingcod,
        Halibut: row.Halibut,
        catch_area_id: row.catch_area_id,
        ramp_id: row.ramp_id,
        sample_date_parsed: row.sample_date_parsed,
      },
    });
  }
}

export async function runEtl(): Promise<void> {
  const stats = {
    seen: 0,
    processed: 0,
    skippedInvalid: 0,
    dryRunSkipped: 0,
  };

  const { rampMap, catchAreaMap } = await loadReferenceMaps();
  const url = buildCsvUrl();

  const response = await axios.get(url, { responseType: "stream" });
  const parser = parseCsv({
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  response.data.pipe(parser);

  const batch: NormalizedReport[] = [];

  for await (const record of parser) {
    stats.seen += 1;
    const normalized = normalizeRow(record as CsvRow, rampMap, catchAreaMap);
    if (!normalized) {
      stats.skippedInvalid += 1;
      continue;
    }

    batch.push(normalized);

    if (batch.length >= BATCH_SIZE) {
      await persistBatch(batch.splice(0, batch.length), stats);
    }
  }

  if (batch.length > 0) {
    await persistBatch(batch, stats);
  }

  console.log(
    JSON.stringify(
      {
        message: "ETL complete",
        stats,
        url,
        dryRun: DRY_RUN,
        batchSize: BATCH_SIZE,
      },
      null,
      2
    )
  );
}

if (require.main === module) {
  runEtl()
    .catch((err) => {
      console.error("ETL failed", err);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
