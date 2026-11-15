import type { SimulationFactory } from "./utils/world";
import { createWorld } from "./utils/world";

/** Straight-line motion on a torus: leaving one edge re-enters opposite. */
export const line: SimulationFactory = (n, seed) => {
  const world = createWorld(n, seed);
  return {
    world,
    step(dt) {
      const { width, height, x, y, vx, vy } = world;
      for (let i = 0; i < world.n; i++) {
        let nx = x[i] + vx[i] * dt;
        let ny = y[i] + vy[i] * dt;
        if (nx < 0) nx += width;
        else if (nx >= width) nx -= width;
        if (ny < 0) ny += height;
        else if (ny >= height) ny -= height;
        x[i] = nx;
        y[i] = ny;
      }
    },
  };
};
