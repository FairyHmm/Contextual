import { mulberry32 } from "./rng";

/** Stage size in CSS px. */
export const STAGE = {
  WIDTH: 1280,
  HEIGHT: 720,
};

/** Speed range in px/s. */
export const SPEED = {
  MIN: 40,
  MAX: 120,
};

/** Object state as parallel arrays; one index per object. */
export interface World {
  n: number;
  width: number;
  height: number;
  x: Float64Array;
  y: Float64Array;
  vx: Float64Array;
  vy: Float64Array;
}

/** A running scene: the state and the rule that advances it. */
export interface Simulation {
  world: World;
  step(dt: number): void;
}

/** Builds a fresh simulation for an object count and seed. */
export type SimulationFactory = (n: number, seed: number) => Simulation;

/** Seeded initial state; four random numbers per object. */
export function createWorld(
  n: number,
  seed: number,
  width = STAGE.WIDTH,
  height = STAGE.HEIGHT,
): World {
  const next = mulberry32(seed);
  const world: World = {
    n,
    width,
    height,
    x: new Float64Array(n),
    y: new Float64Array(n),
    vx: new Float64Array(n),
    vy: new Float64Array(n),
  };
  for (let i = 0; i < n; i++) {
    world.x[i] = next() * width;
    world.y[i] = next() * height;
    const angle = next() * Math.PI * 2;
    const speed = SPEED.MIN + next() * (SPEED.MAX - SPEED.MIN);
    world.vx[i] = Math.cos(angle) * speed;
    world.vy[i] = Math.sin(angle) * speed;
  }
  return world;
}
