import { parseArgs } from "node:util";

import type { Page } from "playwright";

import {
  FILTER_FLAGS,
  FILTER_HELP,
  MOTION_FLAG,
  MOTION_HELP,
  VIEWPORT,
  appUrl,
  count,
  launch,
  list,
  motionOf,
  select,
  startApp,
} from "./lib.ts";
import { table } from "./table.ts";

// Loads the app once per case; markdown tables on stdout, progress on stderr.

const HELP = `pnpm bench [options]

${FILTER_HELP}
${MOTION_HELP}
  --n 1000,5000    object counts (default 1000,5000)
  --frames 300     frames measured per run (default 300)
  --warmup 60      frames dropped before measuring (default 60)
  --runs 1         repeats per case, interleaved; adds a min-max Range column`;

const { values } = parseArgs({
  options: {
    ...FILTER_FLAGS,
    ...MOTION_FLAG,
    n: { type: "string", default: "1000,5000" },
    frames: { type: "string", default: "300" },
    warmup: { type: "string", default: "60" },
    runs: { type: "string", default: "1" },
    help: { type: "boolean", short: "h" },
  },
});
if (values.help === true) {
  console.log(HELP);
  process.exit(0);
}
const ns = list(values.n).map(count);
const motion = motionOf(values.motion);
const frames = count(values.frames);
const warmup = count(values.warmup);
const runs = count(values.runs);

// Records the rAF timestamp and callback duration per frame. The callback gets
// a synthetic clock advancing 1/60 s per frame, and the page stops at the
// measured frame.
const LIMIT = warmup + frames;
const RECORD_FRAMES = `
window.__frames = [];
const raf = window.requestAnimationFrame.bind(window);
const STEP = 1000 / 60;
const LIMIT = ${LIMIT};
let clock = 0;
let count = 0;
window.requestAnimationFrame = cb => {
  if (count >= LIMIT) return 0;
  return raf(() => {
    count++;
    // performance.now(), the same clock as JS.
    const start = performance.now();
    cb(clock);
    clock += STEP;
    window.__frames.push([start, performance.now() - start]);
  });
};`;

const STAGE_FAILURE = `(() => {
  const s = document.getElementById("stage");
  return s !== null && s.children.length === 0 ? s.textContent || "empty stage" : null;
})()`;

const percentile = (a: number[], p: number): number =>
  a.toSorted((x, y) => x - y)[Math.floor(a.length * p)];

const median = (a: number[]) => percentile(a, 0.5);
const p95 = (a: number[]) => percentile(a, 0.95);

interface Sample {
  frame: number;
  frameP95: number;
  js: number;
  browser: number;
}

async function measure(page: Page, url: string): Promise<Sample> {
  await page.goto(url);
  const failure = await page.evaluate<string | null>(STAGE_FAILURE);
  if (failure !== null) throw new Error(failure);
  await page.waitForFunction(
    `window.__frames.length >= ${warmup + frames}`,
    undefined,
    // Interval polling: the page stops its own rAF at the limit.
    { polling: 100, timeout: 0 },
  );
  const recorded = await page.evaluate<[number, number][]>("window.__frames");
  const kept = recorded.slice(warmup, warmup + frames);
  const intervals = kept.map(([t], i) => t - recorded[warmup + i - 1][0]);
  const work = kept.map(([, js]) => js);
  // Browser = per-frame interval minus JS.
  const browser = intervals.map((interval, i) =>
    Math.max(0, interval - work[i]),
  );
  return {
    frame: median(intervals),
    frameP95: p95(intervals),
    js: median(work),
    browser: median(browser),
  };
}

const HEADER = [
  "Method",
  "Frame",
  ...(runs > 1 ? ["Range"] : []),
  "p95",
  "JS",
  "Browser",
  "FPS",
];

/** One table row: medians over the runs, plus the spread of the frame time. */
function summarize(name: string, samples: Sample[]): string[] {
  const all = samples.map(s => s.frame);
  const frame = median(all);
  const js = median(samples.map(s => s.js));
  return [
    name,
    frame.toFixed(1),
    ...(runs > 1
      ? [`${Math.min(...all).toFixed(1)}-${Math.max(...all).toFixed(1)}`]
      : []),
    median(samples.map(s => s.frameP95)).toFixed(1),
    js.toFixed(2),
    median(samples.map(s => s.browser)).toFixed(1),
    (1000 / frame).toFixed(0),
  ];
}

const app = await startApp();
const browser = await launch({
  "layout.frame_rate": 0,
  "privacy.reduceTimerPrecision": false, // timer precision
});
try {
  const entries = select(app.entries, values);
  const page = await browser.newPage({ viewport: VIEWPORT });
  await page.addInitScript(RECORD_FRAMES);

  console.log(
    `Firefox ${browser.version()}, ${VIEWPORT.width}x${VIEWPORT.height}, uncapped rAF, ` +
      `fixed 1/60 s sim step per frame, stops at the measured frame, ` +
      `${frames} frames after ${warmup} warmup, ${runs} run${runs > 1 ? "s" : ""}. ` +
      `Times in ms; Frame = wall-clock callback interval, JS = step + render, ` +
      `Browser = per-frame interval - JS.`,
  );
  for (const n of ns) {
    const samples = new Map<string, Sample[]>();
    for (const e of entries) samples.set(e.name, []);
    for (let run = 1; run <= runs; run++) {
      for (const entry of entries) {
        console.error(`n=${n} run ${run}/${runs} ${entry.name}`);
        const url = appUrl(
          app,
          entry,
          { n: String(n), seed: "1", motion },
          values.query,
        );
        samples.get(entry.name)?.push(await measure(page, url));
      }
    }
    const rows = entries.map(e => summarize(e.name, samples.get(e.name) ?? []));
    console.log(`\n### N = ${n}\n`);
    console.log(table(HEADER, rows));
  }
} finally {
  await browser.close();
  await app.close();
}
