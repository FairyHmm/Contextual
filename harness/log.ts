import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { Entry } from "./lib.ts";
import type { Mode } from "./report.ts";
import type { Frame, Sample } from "./sample.ts";

// Machine-readable run data: one folder per session, with `runs.csv`
// (one row per run), `frames.csv` (one per frame) and `meta.json`.
// A row is field -> string; the header is the first row's keys, kebab-cased.

export const DEFAULT_LOG_DIR = "out/logs";

export interface RowContext {
  mode: Mode;
  motion: string;
}

/** A CSV row: field name -> formatted value. */
export type Row = Record<string, string>;

/** `frameMean` -> `frame-mean`, `capHz` -> `cap-hz`. */
const kebab = (key: string): string =>
  key.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);

/** Numbers keep 3 decimals; other values use String. */
const format = (value: unknown): string =>
  typeof value === "number" ? String(Number(value.toFixed(3))) : String(value);

const stringify = (row: Record<string, unknown>): Row => {
  const out: Row = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = format(value);
  }
  return out;
};

/** Context plus the sample's own fields (minus the per-frame array). */
export function runRow(
  entry: Entry,
  ctx: RowContext,
  n: number,
  run: number,
  sample: Sample,
): Row {
  const metrics: Record<string, unknown> = { ...sample };
  delete metrics.frames;
  return {
    variant: entry.variant,
    method: entry.method,
    motion: ctx.motion,
    n: String(n),
    run: String(run),
    mode: ctx.mode.timeBased ? "time" : "frames",
    capHz: String(ctx.mode.capped ? ctx.mode.hz : 0),
    windowS: ctx.mode.timeBased
      ? String(ctx.mode.seconds)
      : (sample.count / 60).toFixed(3),
    ...stringify(metrics),
  };
}

export function frameRow(
  entry: Entry,
  ctx: RowContext,
  n: number,
  run: number,
  index: number,
  frame: Frame,
): Row {
  return {
    variant: entry.variant,
    method: entry.method,
    motion: ctx.motion,
    n: String(n),
    run: String(run),
    index: String(index),
    ...stringify({ ...frame }),
  };
}

/** Appends one row per measured run, and one per measured frame. */
export function collectRecords(
  entries: Entry[],
  samples: Map<string, Sample[]>,
  ctx: RowContext,
  n: number,
  runs: Row[],
  frames: Row[],
): void {
  for (const entry of entries) {
    const list = samples.get(entry.name) ?? [];
    for (const [i, sample] of list.entries()) {
      const runNumber = i + 1;
      runs.push(runRow(entry, ctx, n, runNumber, sample));
      for (const [j, frame] of sample.frames.entries()) {
        frames.push(frameRow(entry, ctx, n, runNumber, j, frame));
      }
    }
  }
}

/** Header from the first row's keys, then one line per row. */
export function toRows(rows: Row[]): string[][] {
  const [first] = rows;
  if (first === undefined) return [];
  const keys = Object.keys(first);
  return [keys.map(kebab), ...rows.map(row => keys.map(key => row[key] ?? ""))];
}

const cell = (value: string): string =>
  /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;

export const csv = (rows: readonly (readonly string[])[]): string =>
  rows.length === 0
    ? ""
    : `${rows.map(row => row.map(cell).join(",")).join("\n")}\n`;

const pad = (value: number): string => String(value).padStart(2, "0");

/** `YYYYMMDD-HHMMSS` local time, for a per-run folder name. */
export const timestamp = (date = new Date()): string =>
  `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-` +
  `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;

/** Creates `base/bench-<timestamp>`, adding a counter if it already exists. */
export async function createRunDir(base: string): Promise<string> {
  await mkdir(base, { recursive: true });
  const stamp = timestamp();
  let dir = join(base, `bench-${stamp}`);
  for (let i = 2; existsSync(dir); i++) {
    dir = join(base, `bench-${stamp}-${i}`);
  }
  await mkdir(dir);
  return dir;
}

export interface RunLog {
  runs: Row[];
  frames: Row[];
  meta: Record<string, unknown>;
}

export async function writeRunLog(dir: string, log: RunLog): Promise<void> {
  await mkdir(dir, { recursive: true });
  await Promise.all([
    writeFile(join(dir, "runs.csv"), csv(toRows(log.runs))),
    writeFile(join(dir, "frames.csv"), csv(toRows(log.frames))),
    writeFile(join(dir, "meta.json"), `${JSON.stringify(log.meta, null, 2)}\n`),
  ]);
}
