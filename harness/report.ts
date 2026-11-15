import { type Sample, median } from "./sample.ts";

/** What the two subcommands measure. */
export interface Mode {
  /** Capped vsync pacing (time mode) or uncapped (frames mode). */
  capped: boolean;
  /** Fixed wall-clock window (time) or fixed frame count (frames). */
  timeBased: boolean;
  /** Refresh cap in Hz (time mode). */
  hz: number;
  /** Measured window in seconds (time mode). */
  seconds: number;
  /** Warm-up in seconds (time mode). */
  warmupSeconds: number;
  /** Measured frames (frames mode). */
  frames: number;
  /** Warm-up frames (frames mode). */
  warmup: number;
}

export interface Column {
  name: string;
  /** Which end of the column is the best result. */
  better: "max" | "min" | null;
}

const column = (name: string, better: "max" | "min" | null): Column => ({
  name,
  better,
});

export const header = (mode: Mode, repeats: number): Column[] =>
  mode.capped
    ? [
        column("Method", null),
        ...(repeats > 1 ? [column("Range", null)] : []),
        column("FPS", "max"),
        column("Drop/s", "min"),
        column("Max", "min"),
        column("p95", "min"),
        column("p99", "min"),
        column("JS", "min"),
      ]
    : [
        column("Method", null),
        column("Frame", "min"),
        ...(repeats > 1 ? [column("Range", null)] : []),
        column("p95", "min"),
        column("p99", "min"),
        column("JS", "min"),
        column("Browser", "min"),
        column("FPS", "max"),
        column("1% low", "max"),
      ];

/** One table row: medians over the repeats, plus the spread across repeats. */
export function summarize(
  name: string,
  samples: Sample[],
  mode: Mode,
  repeats: number,
): string[] {
  const js = median(samples.map(s => s.js)).toFixed(2);
  if (mode.capped) {
    const all = samples.map(s => s.delivered);
    return [
      name,
      ...(repeats > 1
        ? [`${Math.min(...all).toFixed(0)}-${Math.max(...all).toFixed(0)}`]
        : []),
      median(all).toFixed(0),
      median(samples.map(s => s.dropped)).toFixed(0),
      median(samples.map(s => s.frameMax)).toFixed(1),
      median(samples.map(s => s.frameP95)).toFixed(1),
      median(samples.map(s => s.frameP99)).toFixed(1),
      js,
    ];
  }
  const all = samples.map(s => s.frame);
  const frame = median(all);
  return [
    name,
    frame.toFixed(1),
    ...(repeats > 1
      ? [`${Math.min(...all).toFixed(1)}-${Math.max(...all).toFixed(1)}`]
      : []),
    median(samples.map(s => s.frameP95)).toFixed(1),
    median(samples.map(s => s.frameP99)).toFixed(1),
    js,
    median(samples.map(s => s.browser)).toFixed(1),
    median(samples.map(s => s.delivered)).toFixed(0),
    median(samples.map(s => s.low1)).toFixed(0),
  ];
}
