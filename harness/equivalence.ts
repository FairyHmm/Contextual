import { mkdir, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";

import type { Page } from "playwright";

import {
  FILTER_FLAGS,
  FILTER_HELP,
  MOTION_FLAG,
  MOTION_HELP,
  VIEWPORT,
  appUrl,
  launch,
  motionOf,
  startApp,
} from "./lib.ts";
import { select } from "./select.ts";

// Equivalence check: same seed and frame, every method against the reference.
// Screenshots go to out/equivalence/.

const HELP = `pnpm equivalence [options]

${FILTER_HELP}
${MOTION_HELP}`;

const REFERENCE = "canvas/sprite";
const SEED = "1";
const CASES = [
  { n: 100, freeze: 0 },
  { n: 1000, freeze: 0 },
  { n: 1000, freeze: 300 },
  { n: 5000, freeze: 300 },
];

const { values } = parseArgs({
  options: {
    ...FILTER_FLAGS,
    ...MOTION_FLAG,
    help: { type: "boolean", short: "h" },
  },
});
if (values.help === true) {
  console.log(HELP);
  process.exit(0);
}
const motion = motionOf(values.motion);

interface Diff {
  differing: number;
  litA: number;
  litB: number;
}

/** Compares two PNGs (base64) pixel by pixel, inside the page's canvas. */
async function compare(page: Page, a: string, b: string): Promise<Diff> {
  await page.goto("about:blank");
  return page.evaluate(
    async (pair: string[]) => {
      const load = async (b64: string) => {
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext("2d");
        if (ctx === null) throw new Error("no 2d context");
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, c.width, c.height).data;
      };
      const x = await load(pair[0] ?? "");
      const y = await load(pair[1] ?? "");
      let differing = 0;
      let litA = 0;
      let litB = 0;
      for (let i = 0; i < x.length; i += 4) {
        const d = Math.max(
          Math.abs(x[i] - y[i]),
          Math.abs(x[i + 1] - y[i + 1]),
          Math.abs(x[i + 2] - y[i + 2]),
        );
        if (d > 48) differing++;
        if (x[i] > 80) litA++;
        if (y[i] > 80) litB++;
      }
      return { differing, litA, litB };
    },
    [a, b],
  );
}

const app = await startApp();
const browser = await launch();
try {
  const reference = app.entries.find(e => e.name === REFERENCE);
  if (reference === undefined) throw new Error(`no reference ${REFERENCE}`);
  const { entries: picked, shared } = select(app.entries, values);
  const others = picked.filter(e => e !== reference);
  if (shared.length > 0) {
    console.log(
      `! ${shared.join(", ")} exists in more than one variant: ` +
        `checking ${shared
          .map(n =>
            others
              .filter(e => e.method === n)
              .map(e => e.name)
              .join(" + "),
          )
          .join(", ")}. Use --method html/translate to pick one.`,
    );
  }

  const page = await browser.newPage({ viewport: VIEWPORT });
  // `__name` shim for esbuild-wrapped functions in page.evaluate.
  await page.addInitScript("window.__name = f => f;");
  const dir = `out/equivalence/${motion}`;
  await mkdir(dir, { recursive: true });

  for (const { n, freeze } of CASES) {
    const shot = async (entry: (typeof others)[number]) => {
      const params = {
        n: String(n),
        seed: SEED,
        freeze: String(freeze),
        motion,
      };
      await page.goto(appUrl(app, entry, params, values.query));
      const png = await page.locator("#stage").screenshot();
      const file = `${entry.variant}-${entry.method}-n${n}-f${freeze}.png`;
      await writeFile(`${dir}/${file}`, png);
      return png.toString("base64");
    };
    const ref = await shot(reference);
    for (const entry of others) {
      const diff = await compare(page, ref, await shot(entry));
      console.log(
        `n=${n} freeze=${freeze} ${REFERENCE} vs ${entry.name}: ` +
          `${diff.differing} px differ (>48), lit ${diff.litA} vs ${diff.litB}`,
      );
    }
  }
} finally {
  await browser.close();
  await app.close();
}
