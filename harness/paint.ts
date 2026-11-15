import { type Column, type Mode } from "./report.ts";

// ANSI helpers. Colors only when stdout is a terminal, so a piped markdown
// table stays plain text. NO_COLOR disables them.
const enabled =
  process.stdout.isTTY === true && process.env.NO_COLOR === undefined;

const wrap =
  (open: string, close: string) =>
  (s: string): string =>
    enabled ? `${open}${s}${close}` : s;

export const bold = wrap("\x1b[1m", "\x1b[22m");
export const dim = wrap("\x1b[2m", "\x1b[22m");
export const green = wrap("\x1b[32m", "\x1b[39m");
export const yellow = wrap("\x1b[33m", "\x1b[39m");
export const red = wrap("\x1b[31m", "\x1b[39m");
export const cyan = wrap("\x1b[36m", "\x1b[39m");
export const magenta = wrap("\x1b[35m", "\x1b[39m");

export const banner = (
  version: string,
  mode: Mode,
  runs: number,
  width: number,
  height: number,
): string => {
  const windowText = mode.timeBased
    ? `${mode.seconds} s window after ${mode.warmupSeconds} s warm-up`
    : `${mode.frames} frames after ${mode.warmup} warmup`;
  const pace = mode.timeBased
    ? "sim advances by real elapsed time"
    : "fixed 1/60 s sim step per frame";
  const stop = mode.timeBased
    ? "stops at the end of the window"
    : "stops at the measured frame";
  const metrics = mode.capped
    ? [
        `FPS = presented frames / elapsed · Drop/s = missed vsyncs/s ` +
          `(FPS + Drop/s ≈ ${mode.hz})`,
        `Max = longest frame · p95/p99 = frame interval · JS = step + render`,
      ]
    : [
        `Frame = callback interval · JS = step + render · ` +
          `Browser = frame − JS`,
        `FPS = frames / elapsed · 1% low = worst-1% mean`,
      ];
  return [
    bold(
      `Firefox ${version} · ${width}×${height} · ` +
        (mode.capped
          ? cyan(`capped ${mode.hz} Hz vsync`)
          : magenta("uncapped rAF")),
    ),
    `${windowText} · ${runs} run${runs > 1 ? "s" : ""}`,
    `${pace} · ${stop}`,
    ...metrics,
  ].join("\n");
};

export const heading = (n: number): string => bold(cyan(`N = ${n}`));

type Paint = (s: string) => string;

const bestByColumn = (
  columns: Column[],
  rows: string[],
): Map<number, number> => {
  const best = new Map<number, number>();
  for (let c = 0; c < columns.length; c++) {
    const direction = columns[c].better;
    if (direction === null) continue;
    const at = c + 1; // split("|") adds a leading empty cell
    const values: number[] = [];
    for (const line of rows) {
      const cell = line.split("|")[at];
      const value = cell === undefined ? NaN : Number(cell.trim());
      if (Number.isFinite(value)) values.push(value);
    }
    if (values.length > 0) {
      best.set(
        at,
        direction === "max" ? Math.max(...values) : Math.min(...values),
      );
    }
  }
  return best;
};

const heatCell = (cells: string[], at: number, color: Paint): void => {
  const cell = cells[at];
  if (cell !== undefined) cells[at] = color(cell);
};

/** Capped: 55 is effectively the 60 Hz target. Uncapped: 240 gets cyan. */
const heatFps = (value: number, capped: boolean): Paint => {
  if (capped) return value >= 55 ? green : value >= 30 ? yellow : red;
  return value >= 240 ? cyan : value >= 60 ? green : value >= 30 ? yellow : red;
};

const heatDrop = (value: number): Paint =>
  value === 0 ? green : value <= 10 ? yellow : red;

const heatRow = (
  cells: string[],
  plain: string[],
  columns: Column[],
  capped: boolean,
): void => {
  const at = (name: string): number => {
    const index = columns.findIndex(c => c.name === name);
    return index < 0 ? -1 : index + 1; // split("|") adds a leading empty cell
  };
  const fps = at("FPS");
  if (fps >= 0) {
    const value = Number(plain[fps]);
    if (Number.isFinite(value)) heatCell(cells, fps, heatFps(value, capped));
  }
  const drop = at("Drop/s");
  if (drop >= 0 && capped) {
    const value = Number(plain[drop]);
    if (Number.isFinite(value)) heatCell(cells, drop, heatDrop(value));
  }
  const low = at("1% low");
  if (low >= 0 && !capped) {
    const value = Number(plain[low]);
    if (Number.isFinite(value)) heatCell(cells, low, heatFps(value, false));
  }
};

const paintRow = (
  line: string,
  columns: Column[],
  best: Map<number, number>,
  capped: boolean,
): string => {
  const cells = line.split("|");
  const plain = cells.map(cell => cell.trim());
  heatRow(cells, plain, columns, capped);
  for (const [c, value] of best) {
    const text = plain[c];
    if (text === undefined) continue;
    if (Number(text) === value) cells[c] = bold(cells[c]);
  }
  return cells.join("|");
};

/** Bold the best cell per metric; dim rule; FPS/Drop heat map. */
export function paintTable(
  markdown: string,
  columns: Column[],
  capped: boolean,
): string {
  const lines = markdown.split("\n");
  const rows = lines.slice(2).filter(line => line.trim() !== "");
  const best = bestByColumn(columns, rows);
  const paint = (line: string, index: number): string => {
    if (index === 1) return dim(line);
    if (index < 2) return line;
    return paintRow(line, columns, best, capped);
  };
  return lines.map(paint).join("\n");
}
