import type { Page } from "playwright";

import {
  type App,
  type Entry,
  VIEWPORT,
  appUrl,
  launch,
  startApp,
} from "./lib.ts";
import { banner, heading, paintTable, yellow } from "./paint.ts";
import { type Mode, header, summarize } from "./report.ts";
import { type Sample, measure, recordFrames } from "./sample.ts";
import { select } from "./select.ts";
import { table } from "./table.ts";

export interface RunOptions {
  method: string | undefined;
  query: string | undefined;
  ns: number[];
  runs: number;
  motion: string;
  mode: Mode;
  /** `abba` reverses the entry order every other repeat (A B B A for two). */
  order: "forward" | "abba";
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
    const ordered =
      opts.order === "abba" && repeat % 2 === 0
        ? entries.toReversed()
        : entries;
    for (const entry of ordered) {
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
    const { entries, shared } = select(app.entries, opts);
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
        opts.order,
      ),
    );
    if (shared.length > 0) {
      const names = shared
        .map(name => entries.filter(e => e.method === name))
        .map(hits => hits.map(e => e.name).join(" + "))
        .join(", ");
      console.log(
        yellow(
          `! ${shared.join(", ")} exists in more than one variant: ` +
            `running ${names}. Use --method html/translate to pick one.`,
        ),
      );
    }
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
