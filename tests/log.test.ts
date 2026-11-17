import { describe, expect, it } from "vitest";

import type { Entry } from "../harness/lib";
import {
  type RowContext,
  csv,
  frameRow,
  runRow,
  timestamp,
  toRows,
} from "../harness/log";
import type { Mode } from "../harness/report";
import type { Frame, Sample } from "../harness/sample";

// The header is inferred from the row keys and kebab-cased.

const entry: Entry = {
  variant: "canvas",
  method: "sprite",
  name: "canvas/sprite",
};

const mode: Mode = {
  capped: false,
  timeBased: false,
  hz: 0,
  seconds: 0,
  warmupSeconds: 0,
  frames: 300,
  warmup: 60,
};

const ctx: RowContext = { mode, motion: "line" };

const frame: Frame = { t: 1.5, interval: 2.5, js: 0.2 };

const sample: Sample = {
  frame: 2.5,
  frameMean: 2.6,
  frameP95: 4,
  frameP99: 6,
  frameMax: 9,
  delivered: 380,
  dropped: 0,
  low1: 150,
  js: 0.2,
  browser: 2.3,
  count: 300,
  frames: [frame],
};

describe("log", () => {
  it("quotes CSV fields that need it", () => {
    expect(csv([["a", "b,c", 'd"e', "f\ng"]])).toBe('a,"b,c","d""e","f\ng"\n');
  });

  it("infers the header from the first row and keeps its order", () => {
    expect(toRows([{ b: "2", a: "1" }])[0]).toEqual(["b", "a"]);
  });

  it("converts camelCase row keys to kebab-case headers", () => {
    expect(toRows([{ frameMean: "2.600" }])[0]).toEqual(["frame-mean"]);
  });

  it("derives the runs header from the sample's own fields", () => {
    const rows = toRows([runRow(entry, ctx, 1000, 2, sample)]);
    const header = rows[0] ?? [];
    for (const name of [
      "variant",
      "cap-hz",
      "window-s",
      "frame-mean",
      "frame-p95",
      "frame-max",
    ]) {
      expect(header).toContain(name);
    }
    expect(rows[1]).toHaveLength(header.length);
  });

  it("writes a frame row with an index and the frame fields", () => {
    const rows = toRows([frameRow(entry, ctx, 1000, 2, 7, frame)]);
    expect(rows[0]).toEqual([
      "variant",
      "method",
      "motion",
      "n",
      "run",
      "index",
      "t",
      "interval",
      "js",
    ]);
    expect(rows[1]).toEqual([
      "canvas",
      "sprite",
      "line",
      "1000",
      "2",
      "7",
      "1.5",
      "2.5",
      "0.2",
    ]);
  });

  it("formats a timestamp as YYYYMMDD-HHMMSS", () => {
    expect(timestamp(new Date(2026, 10, 17, 16, 15, 30))).toBe(
      "20261117-161530",
    );
  });
});
