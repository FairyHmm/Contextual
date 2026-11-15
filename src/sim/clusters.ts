import { mulberry32 } from "./utils/rng";
import type { SimulationFactory } from "./utils/world";
import { createWorld } from "./utils/world";

/** Attractor count, drift, orbit radii and seek time constant. */
const CLUSTER = {
  /** Number of drifting attractors. */
  COUNT: 4,
  /** How far an attractor drifts from the stage center, in px. */
  DRIFT: 240,
  /** Attractor angular speed, in rad/s. */
  SPEED: 0.35,
  /** Orbit radius around an attractor, in px. */
  ORBIT_MIN: 6,
  ORBIT_MAX: 70,
  /** Orbit angular speed, in rad/s. */
  SPIN: 0.7,
  /** Seek time constant, in s. */
  TAU: 0.6,
};

/** Drifting attractors and each object's orbit around its target. */
interface Clusters {
  /** Attractor angle, angular speed and drift radius. */
  angle: Float64Array;
  speed: Float64Array;
  radius: Float64Array;
  /** Attractor position, updated every step. */
  ax: Float64Array;
  ay: Float64Array;
  /** Attractor index, orbit radius, phase and spin, per object. */
  target: Uint16Array;
  orbit: Float64Array;
  phase: Float64Array;
  spin: Float64Array;
}

/** Cluster state from a separate RNG stream. */
function createClusters(n: number, seed: number): Clusters {
  const next = mulberry32(seed ^ 0x9e3779b9);
  const count = CLUSTER.COUNT;
  const clusters: Clusters = {
    angle: new Float64Array(count),
    speed: new Float64Array(count),
    radius: new Float64Array(count),
    ax: new Float64Array(count),
    ay: new Float64Array(count),
    target: new Uint16Array(n),
    orbit: new Float64Array(n),
    phase: new Float64Array(n),
    spin: new Float64Array(n),
  };
  for (let a = 0; a < count; a++) {
    clusters.angle[a] = next() * Math.PI * 2;
    clusters.speed[a] = (next() * 2 - 1) * CLUSTER.SPEED;
    clusters.radius[a] = CLUSTER.DRIFT * (0.55 + next() * 0.45);
  }
  for (let i = 0; i < n; i++) {
    clusters.target[i] = Math.floor(next() * count);
    clusters.orbit[i] =
      CLUSTER.ORBIT_MIN + next() * (CLUSTER.ORBIT_MAX - CLUSTER.ORBIT_MIN);
    clusters.phase[i] = next() * Math.PI * 2;
    clusters.spin[i] = (next() * 2 - 1) * CLUSTER.SPIN;
  }
  return clusters;
}

/**
 * Objects seek a moving orbit around one of a few drifting attractors. The seek
 * is an exponential approach; positions wrap on the torus.
 */
export const clusters: SimulationFactory = (n, seed) => {
  const world = createWorld(n, seed);
  const state = createClusters(n, seed);
  const { angle, speed, radius, ax, ay, target, orbit, phase, spin } = state;
  return {
    world,
    step(dt) {
      if (dt <= 0) return;
      const { width, height, x, y, vx, vy } = world;
      const cx = width / 2;
      const cy = height / 2;
      for (let a = 0; a < angle.length; a++) {
        angle[a] += speed[a] * dt;
        ax[a] = cx + Math.cos(angle[a]) * radius[a];
        ay[a] = cy + Math.sin(angle[a]) * radius[a];
      }
      const f = 1 - Math.exp(-dt / CLUSTER.TAU);
      for (let i = 0; i < world.n; i++) {
        phase[i] += spin[i] * dt;
        const a = target[i];
        const tx = ax[a] + Math.cos(phase[i]) * orbit[i];
        const ty = ay[a] + Math.sin(phase[i]) * orbit[i];
        let dx = tx - x[i];
        let dy = ty - y[i];
        if (dx >= width / 2) dx -= width;
        else if (dx < -width / 2) dx += width;
        if (dy >= height / 2) dy -= height;
        else if (dy < -height / 2) dy += height;
        const sx = dx * f;
        const sy = dy * f;
        vx[i] = sx / dt;
        vy[i] = sy / dt;
        let nx = x[i] + sx;
        let ny = y[i] + sy;
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
