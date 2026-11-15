import type { Page } from "playwright";

import {
  type App,
  type Entry,
  VIEWPORT,
  appUrl,
  launch,
  select,
  startApp,
} from "./lib.ts";
import { banner, heading, paintTable } from "./paint.ts";
import { type Mode, header, summarize } from "./report.ts";
import { type Sample, measure, recordFrames } from "./sample.ts";
import { table } from "./table.ts";

export interface RunOptions {
  variant: string | undefined;
  method: string | undefined;
  query: string | undefined;
  ns: number[];
  runs: number;
  motion: string;
  mode: Mode;
}

async function collect(
  page: Page,
  app: App,
  entries: Entry[],
  n: number,
  opts: RunOptions,
  budget: number,
): Promise<Map<string, Sample[]>> {
  const { mode } = opts;
  const totalMs = mode.timeBased
    ? (mode.warmupSeconds + mode.seconds) * 1000
    : 0;
  const warmupMs = mode.timeBased ? mode.warmupSeconds * 1000 : 0;
  const samples = new Map<string, Sample[]>();
  for (const e of entries) samples.set(e.name, []);
  for (let repeat = 1; repeat <= opts.runs; repeat++) {
    for (const entry of entries) {
      const label = `n=${n} run ${repeat}/${opts.runs} ${entry.name}`;
      if (process.stderr.isTTY) process.stderr.write(`\r${label}\u001b[K`);
      else console.error(label);
      const url = appUrl(
        app,
        entry,
        { n: String(n), seed: "1", motion: opts.motion },
        opts.query,
      );
      samples
        .get(entry.name)
        ?.push(
          await measure(
            page,
            url,
            { warmup: mode.warmup, frames: mode.frames, totalMs, warmupMs },
            budget,
          ),
        );
    }
  }
  if (process.stderr.isTTY) process.stderr.write("\r\u001b[K");
  return samples;
}

export async function run(opts: RunOptions): Promise<void> {
  const app = await startApp();
  const browser = await launch({
    "layout.frame_rate": opts.mode.capped ? opts.mode.hz : 0,
    "privacy.reduceTimerPrecision": false, // timer precision
  });
  try {
    const entries = select(app.entries, opts);
    const page = await browser.newPage({ viewport: VIEWPORT });
    const mode = opts.mode;
    const budget = mode.capped ? 1000 / mode.hz : 0;
    const limit = mode.timeBased ? 0 : mode.warmup + mode.frames;
    const totalMs = mode.timeBased
      ? (mode.warmupSeconds + mode.seconds) * 1000
      : 0;
    const warmupMs = mode.timeBased ? mode.warmupSeconds * 1000 : 0;
    await page.addInitScript(recordFrames(limit, totalMs, warmupMs));

    const COLUMNS = header(mode, opts.runs);
    const HEADER = COLUMNS.map(c => c.name);
    console.log(
      banner(
        browser.version(),
        mode,
        opts.runs,
        VIEWPORT.width,
        VIEWPORT.height,
      ),
    );
    for (const n of opts.ns) {
      const samples = await collect(page, app, entries, n, opts, budget);
      const rows = entries.map(e =>
        summarize(e.name, samples.get(e.name) ?? [], mode, opts.runs),
      );
      console.log(`\n${heading(n)}\n`);
      console.log(paintTable(table(HEADER, rows), COLUMNS, mode.capped));
    }
  } finally {
    await browser.close();
    await app.close();
  }
}
