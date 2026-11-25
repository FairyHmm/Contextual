import type { World } from "../../sim/utils/world";

/**
 * Fills `out` (2n floats) structure-of-arrays style: x[0..n) then y[0..n).
 * Device-pixel scaled. The two `set` calls are native 64→32 conversions, so the
 * dpr === 1 path avoids the per-element interleave loop entirely.
 */
export function packPositions(
  out: Float32Array,
  world: World,
  dpr: number,
): void {
  const n = world.n;
  const xs = world.x;
  const ys = world.y;
  if (dpr === 1) {
    out.set(xs, 0);
    out.set(ys, n);
    return;
  }
  for (let i = 0; i < n; i++) out[i] = xs[i] * dpr;
  for (let i = 0; i < n; i++) out[n + i] = ys[i] * dpr;
}

/**
 * Interleaved fallback: x/y pairs (x0,y0,x1,y1,…). Only the RG32F texture
 * method needs this layout; the buffer methods use `packPositions`.
 */
export function packPositionsInterleaved(
  out: Float32Array,
  world: World,
  dpr: number,
): void {
  const xs = world.x;
  const ys = world.y;
  const n = world.n;
  if (dpr === 1) {
    for (let i = 0, j = 0; i < n; i++, j += 2) {
      out[j] = xs[i];
      out[j + 1] = ys[i];
    }
    return;
  }
  for (let i = 0, j = 0; i < n; i++, j += 2) {
    out[j] = xs[i] * dpr;
    out[j + 1] = ys[i] * dpr;
  }
}
