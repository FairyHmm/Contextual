export const VARIANTS = ["canvas", "html", "svg-many", "svg-path"] as const;
export type Variant = (typeof VARIANTS)[number];

/** Motion scenarios. */
export const MOTIONS = ["line", "clusters"] as const;
export type Motion = (typeof MOTIONS)[number];

/** Object-count levels. */
export const LEVELS = [100, 500, 1000, 2000, 5000] as const;

export const DEFAULT_SEED = 1;

export interface RunParams {
  variant: Variant;
  n: number;
  seed: number;
  /** Motion scenario; straight lines by default. */
  motion: Motion;
  /** Implementation method within the variant; null = the variant's default. */
  method: string | null;
  /** Advance this many fixed steps, draw once, stop. null = run live. */
  freeze: number | null;
}

const isOf = <T extends string>(
  value: string | null,
  values: readonly T[],
): value is T =>
  value !== null && (values as readonly string[]).includes(value);

/** Parses URL search params into run parameters. */
export function parseParams(search: string): RunParams {
  const q = new URLSearchParams(search);
  const variant = q.get("variant");
  const motion = q.get("motion");
  const n = Number(q.get("n") ?? LEVELS[0]);
  const seed = Number(q.get("seed") ?? DEFAULT_SEED);
  const freezeRaw = q.get("freeze");
  const freeze = freezeRaw === null ? Number.NaN : Number(freezeRaw);
  return {
    variant: isOf(variant, VARIANTS) ? variant : "canvas",
    n: Number.isInteger(n) && n > 0 ? n : LEVELS[0],
    seed: Number.isInteger(seed) ? seed : DEFAULT_SEED,
    motion: isOf(motion, MOTIONS) ? motion : "line",
    method: q.get("method"),
    freeze: Number.isInteger(freeze) && freeze >= 0 ? freeze : null,
  };
}
