import type { Page } from "playwright";

// Injects a rAF recorder. Frame mode (limit > 0) stops after N frames on a
// synthetic 1/60 s clock; time mode (totalMs > 0) stops after a wall-clock
// window on real elapsed ms.
export const recordFrames = (
  limit: number,
  totalMs: number,
  warmupMs: number,
): string => `
window.__frames = [];
window.__done = false;
const raf = window.requestAnimationFrame.bind(window);
const LIMIT = ${limit};
const TOTAL = ${totalMs};
const WARMUP = ${warmupMs};
let start = 0;
let prev = 0;
let count = 0;
window.requestAnimationFrame = cb => {
  if (LIMIT > 0 && count >= LIMIT) return 0;
  return raf(ts => {
    if (start === 0) start = ts;
    const elapsed = ts - start;
    if (TOTAL > 0 && elapsed > TOTAL) {
      window.__done = true;
      return;
    }
    const interval = prev > 0 ? ts - prev : 0;
    prev = ts;
    count++;
    const jsStart = performance.now();
    cb(TOTAL > 0 ? elapsed : (count - 1) * (1000 / 60));
    const js = performance.now() - jsStart;
    if (TOTAL === 0 || elapsed >= WARMUP) {
      window.__frames.push([ts, interval, js]);
    }
  });
};`;

export const STAGE_FAILURE = `(() => {
  const s = document.getElementById("stage");
  return s !== null && s.children.length === 0 ? s.textContent || "empty stage" : null;
})()`;

const percentile = (a: number[], p: number): number =>
  a.toSorted((x, y) => x - y)[Math.floor(a.length * p)];

export const median = (a: number[]) => percentile(a, 0.5);

/** One measured frame, as recorded in the page. */
export interface Frame {
  /** RAF timestamp, ms. */
  t: number;
  /** Interval since the previous frame, ms. */
  interval: number;
  /** Callback duration (step + render), ms. */
  js: number;
}

export interface Sample {
  /** Median rAF interval, ms. */
  frame: number;
  /** Mean rAF interval, ms. */
  frameMean: number;
  frameP95: number;
  frameP99: number;
  /** Frames presented per second of wall time. */
  delivered: number;
  /** Missed vsyncs per second. */
  dropped: number;
  /** Longest frame interval, ms. */
  frameMax: number;
  /** 1000 / mean of the worst 1% of frame intervals. */
  low1: number;
  js: number;
  browser: number;
  /** Number of measured frames. */
  count: number;
  /** Per-frame records in the measured window. */
  frames: Frame[];
}

export interface MeasureOptions {
  /** Frame mode: warm-up frames and measured frames. */
  warmup: number;
  frames: number;
  /** Time mode: total and warm-up window in ms; 0 = frame mode. */
  totalMs: number;
  warmupMs: number;
}

export async function measure(
  page: Page,
  url: string,
  opts: MeasureOptions,
  /** 0 = uncapped; otherwise the vsync interval in ms. */
  budget: number,
): Promise<Sample> {
  await page.goto(url);
  const failure = await page.evaluate<string | null>(STAGE_FAILURE);
  if (failure !== null) throw new Error(failure);
  await page.waitForFunction(
    opts.totalMs > 0
      ? "window.__done === true"
      : `window.__frames.length >= ${opts.warmup + opts.frames}`,
    undefined,
    { polling: 100, timeout: opts.totalMs > 0 ? 120_000 : 0 },
  );
  const recorded =
    await page.evaluate<[number, number, number][]>("window.__frames");
  const kept =
    opts.totalMs > 0
      ? recorded
      : recorded.slice(opts.warmup, opts.warmup + opts.frames);
  // The first kept frame carries the interval from the last warm-up frame.
  const intervals = kept.map(([, interval]) => interval);
  const work = kept.map(([, , js]) => js);
  // Browser = per-frame interval minus JS.
  const browser = intervals.map((interval, i) =>
    Math.max(0, interval - work[i]),
  );
  // A frame spanning two refresh intervals missed one vsync.
  const missed =
    budget > 0
      ? intervals.map(interval =>
          Math.max(0, Math.round(interval / budget) - 1),
        )
      : [];
  const elapsed =
    kept.length > 1 ? (kept[kept.length - 1][0] - kept[0][0]) / 1000 : 0;
  const delivered = elapsed > 0 ? (kept.length - 1) / elapsed : 0;
  const dropped =
    budget > 0 && elapsed > 0
      ? missed.reduce((sum, n) => sum + n, 0) / elapsed
      : 0;
  const worst = intervals.toSorted((a, b) => b - a);
  const frameMax = worst.length > 0 ? worst[0] : 0;
  const tail = Math.max(1, Math.ceil(worst.length * 0.01));
  const low1 =
    worst.length > 0
      ? 1000 / (worst.slice(0, tail).reduce((sum, n) => sum + n, 0) / tail)
      : 0;
  const frameMean =
    intervals.length > 0
      ? intervals.reduce((sum, interval) => sum + interval, 0) /
        intervals.length
      : 0;
  const frames: Frame[] = kept.map(([t, interval, js]) => ({
    t,
    interval,
    js,
  }));
  return {
    frame: median(intervals),
    frameMean,
    frameP95: percentile(intervals, 0.95),
    frameP99: percentile(intervals, 0.99),
    delivered,
    dropped,
    frameMax,
    low1,
    js: median(work),
    browser: median(browser),
    count: kept.length,
    frames,
  };
}
