import { firefox } from "playwright";
import { createServer } from "vite";

// Week 1 probe: what do performance.now() and requestAnimationFrame actually
// give us in Firefox? Findings feed the methodology (frame time, FPS).
const server = await createServer({ logLevel: "error" });
await server.listen();
const base = server.resolvedUrls?.local[0] ?? "http://localhost:5173/";

const browser = await firefox.launch({ headless: false });
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
  });
  // tsx (esbuild) wraps named functions with __name; page.evaluate needs it.
  await page.addInitScript("window.__name = f => f;");
  await page.goto(base);
  const result = await page.evaluate(async () => {
    const stats = (xs: number[]) => {
      const s = [...xs].sort((a, b) => a - b);
      const at = (p: number) =>
        s[Math.min(s.length - 1, Math.floor(p * s.length))] ?? 0;
      const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
      return {
        n: xs.length,
        mean,
        min: s[0],
        p50: at(0.5),
        p95: at(0.95),
        p99: at(0.99),
        max: s[s.length - 1],
      };
    };

    // 1. Resolution of performance.now(): smallest non-zero step.
    const steps = new Set<number>();
    let last = performance.now();
    for (let i = 0; i < 2_000_000 && steps.size < 20; i++) {
      const t = performance.now();
      if (t !== last) {
        steps.add(+(t - last).toFixed(6));
        last = t;
      }
    }

    // 2. rAF intervals, idle page, and the timestamp rAF hands us.
    const frames = (count: number, work: () => void) =>
      new Promise<{ raf: number[]; wall: number[] }>(resolve => {
        const raf: number[] = [],
          wall: number[] = [];
        let prevRaf = 0,
          prevWall = 0,
          i = 0;
        const tick = (ts: number) => {
          const w = performance.now();
          if (prevRaf) {
            raf.push(ts - prevRaf);
            wall.push(w - prevWall);
          }
          prevRaf = ts;
          prevWall = w;
          work();
          if (++i < count) requestAnimationFrame(tick);
          else resolve({ raf, wall });
        };
        requestAnimationFrame(tick);
      });

    await frames(120, () => {}); // warm-up: window may be throttled right after launch
    const idle = await frames(300, () => {});
    // 3. Fixed 25 ms of main-thread work per frame: does the interval follow?
    const busy = await frames(120, () => {
      const e = performance.now() + 25;
      while (performance.now() < e) {}
    });

    return {
      nowSteps: [...steps].sort((a, b) => a - b),
      idleRaf: stats(idle.raf),
      idleWall: stats(idle.wall),
      busyRaf: stats(busy.raf),
      dpr: window.devicePixelRatio,
      state: document.visibilityState + (document.hasFocus() ? "+focus" : ""),
    };
  });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
  await server.close();
}
