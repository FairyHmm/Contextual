export const VARIANTS = ["canvas", "html", "svg-many", "svg-path"] as const;
export type Variant = (typeof VARIANTS)[number];

/** Object-count levels. */
export const LEVELS = [100, 500, 1000, 2000, 5000] as const;

export const DEFAULT_SEED = 1;

export interface RunParams {
  variant: Variant;
  n: number;
  seed: number;
}

function isVariant(value: string | null): value is Variant {
  return VARIANTS.some(v => v === value);
}

/** Parse flags into run parameters. */
export function parseParams(search: string): RunParams {
  const q = new URLSearchParams(search);
  const variant = q.get("variant");
  const n = Number(q.get("n") ?? LEVELS[0]);
  const seed = Number(q.get("seed") ?? DEFAULT_SEED);
  return {
    variant: isVariant(variant) ? variant : "canvas",
    n: Number.isInteger(n) && n > 0 ? n : LEVELS[0],
    seed: Number.isInteger(seed) ? seed : DEFAULT_SEED,
  };
}
