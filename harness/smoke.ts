import { mkdir } from "node:fs/promises";

import { firefox } from "playwright";
import { createServer } from "vite";

// Smoke test: serve the app, open it in headed Firefox at the fixed stage size,
// screenshot it, and record the environment.
const server = await createServer({ logLevel: "error" });
await server.listen();
const base = server.resolvedUrls?.local[0] ?? "http://localhost:5173/";

const browser = await firefox.launch({ headless: false });
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
  });
  await page.goto(`${base}?variant=canvas&n=100&seed=1`);
  await mkdir("out", { recursive: true });
  await page.screenshot({ path: "out/smoke.png" });
  const env = await page.evaluate(() => ({
    devicePixelRatio: window.devicePixelRatio,
    userAgent: navigator.userAgent,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
  }));
  console.log(JSON.stringify(env, null, 2));
} finally {
  await browser.close();
  await server.close();
}
