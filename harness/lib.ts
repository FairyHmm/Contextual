import { firefox } from "playwright";
import type { Browser } from "playwright";
import { createServer } from "vite";
import type { ViteDevServer } from "vite";

import { MOTIONS } from "../src/app/params.ts";

// Harness helpers: app server, registry entries, flags and Firefox launch.

export const VIEWPORT = { width: 1280, height: 720 };

/** ParseArgs filter flags. */
export const FILTER_FLAGS = {
  method: { type: "string" },
  query: { type: "string" },
} as const;

export const FILTER_HELP = `  --method a,b      what to measure: html (a variant), html/translate
                      (one method), or translate (that name in every variant)
  --query k=v&k=v     extra URL params for every page (e.g. a later scenario)`;

/** ParseArgs options and help for the motion scenario. */
export const MOTION_FLAG = { motion: { type: "string" } } as const;

export const MOTION_HELP = `  --motion ${MOTIONS.join("|")}  motion scenario (default: line)`;

/** Parses a motion name, defaulting to `line`. */
export const motionOf = (s: string | undefined): string => {
  const value = s ?? "line";
  if (!MOTIONS.some(m => m === value)) {
    throw new Error(
      `unknown motion ${value}. Available: ${MOTIONS.join(", ")}`,
    );
  }
  return value;
};

export const list = (s: string | undefined): string[] =>
  (s ?? "")
    .split(",")
    .map(item => item.trim())
    .filter(item => item !== "");

export const count = (s: string | undefined): number => {
  const n = Number(s);
  if (!Number.isInteger(n) || n <= 0) throw new Error(`bad number: ${s}`);
  return n;
};

export interface Entry {
  variant: string;
  method: string;
  /** "variant/method", as printed in tables and file names. */
  name: string;
}

/** The part of `IMPLEMENTATIONS` in src/render/index.ts used here. */
type Registry = Record<string, { methods: Record<string, unknown> }>;

function isRegistry(x: unknown): x is Registry {
  return (
    typeof x === "object" &&
    x !== null &&
    Object.values(x).every(
      def => typeof def === "object" && def !== null && "methods" in def,
    )
  );
}

export interface App {
  server: ViteDevServer;
  base: string;
  /** Every variant/method the source implements. */
  entries: Entry[];
  close(): Promise<void>;
}

export async function startApp(): Promise<App> {
  const server = await createServer({ logLevel: "error" });
  await server.listen();
  const base = server.resolvedUrls?.local[0] ?? "http://localhost:5173/";
  const loaded: Record<string, unknown> = await server.ssrLoadModule(
    "/src/render/index.ts",
  );
  if (!isRegistry(loaded.IMPLEMENTATIONS)) {
    await server.close();
    throw new Error("src/render/index.ts: no IMPLEMENTATIONS");
  }
  const entries = Object.entries(loaded.IMPLEMENTATIONS).flatMap(
    ([variant, def]) =>
      Object.keys(def.methods).map(method => ({
        variant,
        method,
        name: `${variant}/${method}`,
      })),
  );
  return { server, base, entries, close: () => server.close() };
}

/** The page for one entry; `params` and then `--query` go on the URL. */
export function appUrl(
  app: App,
  entry: Entry,
  params: Record<string, string>,
  query: string | undefined,
): string {
  const search = new URLSearchParams({
    variant: entry.variant,
    method: entry.method,
    ...params,
  });
  for (const [key, value] of new URLSearchParams(query ?? "")) {
    search.set(key, value);
  }
  return `${app.base}?${search}`;
}

export function launch(
  prefs: Record<string, string | number | boolean> = {},
): Promise<Browser> {
  return firefox.launch({
    headless: false,
    firefoxUserPrefs: {
      "layout.css.typed-om.enabled": true, // for html/typed
      "dom.webgpu.enabled": true, // navigator.gpu, for canvas/webgpu
      ...prefs,
    },
  });
}
