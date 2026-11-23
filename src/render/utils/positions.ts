import type { World } from "../../sim/utils/world";

/** Fills `out` (2 floats per object) with device-pixel x/y pairs from the world. */
export function packPositions(
  out: Float32Array,
  world: World,
  dpr: number,
): void {
  for (let i = 0; i < world.n; i++) {
    out[i * 2] = world.x[i] * dpr;
    out[i * 2 + 1] = world.y[i] * dpr;
  }
}
