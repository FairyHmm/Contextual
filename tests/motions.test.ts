import { describe, expect, it } from "vitest";

import { clusters } from "../src/sim/clusters";
import { line } from "../src/sim/line";
import { SPEED } from "../src/sim/utils/world";
import type { World } from "../src/sim/utils/world";

const GRID = 64;

/** The highest number of objects in one 64 px cell. */
function peakDensity(world: World): number {
  const cols = Math.ceil(world.width / GRID);
  const rows = Math.ceil(world.height / GRID);
  const bins = new Uint32Array(cols * rows);
  for (let i = 0; i < world.n; i++) {
    const c = Math.min(cols - 1, Math.floor(world.x[i] / GRID));
    const r = Math.min(rows - 1, Math.floor(world.y[i] / GRID));
    bins[r * cols + c] += 1;
  }
  return Math.max(...bins);
}

const onStage = (world: World, i: number): boolean =>
  world.x[i] >= 0 &&
  world.x[i] < world.width &&
  world.y[i] >= 0 &&
  world.y[i] < world.height;

describe("line", () => {
  it("is deterministic for the same seed", () => {
    expect(line(500, 1).world).toEqual(line(500, 1).world);
  });

  it("differs between seeds", () => {
    expect(line(100, 1).world.x).not.toEqual(line(100, 2).world.x);
  });

  it("shares its first objects across N levels", () => {
    const small = line(100, 3).world;
    const big = line(1000, 3).world;
    expect(big.x.slice(0, 100)).toEqual(small.x);
    expect(big.vy.slice(0, 100)).toEqual(small.vy);
  });

  it("starts inside the stage with speeds in range", () => {
    const w = line(2000, 5).world;
    for (let i = 0; i < w.n; i++) {
      expect(onStage(w, i)).toBe(true);
      const speed = Math.hypot(w.vx[i], w.vy[i]);
      expect(speed).toBeGreaterThanOrEqual(SPEED.MIN - 1e-9);
      expect(speed).toBeLessThanOrEqual(SPEED.MAX + 1e-9);
    }
  });

  it("moves in a straight line by v * dt", () => {
    const sim = line(1, 1);
    const w = sim.world;
    w.x[0] = 100;
    w.y[0] = 100;
    w.vx[0] = 60;
    w.vy[0] = -30;
    sim.step(0.5);
    expect(w.x[0]).toBeCloseTo(130);
    expect(w.y[0]).toBeCloseTo(85);
  });

  it("wraps around every edge", () => {
    const sim = line(4, 1);
    const w = sim.world;
    w.x.set([1270, 5, 640, 640]);
    w.y.set([360, 360, 715, 5]);
    w.vx.set([100, -100, 0, 0]);
    w.vy.set([0, 0, 100, -100]);
    sim.step(0.1);
    expect(w.x[0]).toBeCloseTo(0);
    expect(w.x[1]).toBeCloseTo(1275);
    expect(w.y[2]).toBeCloseTo(5);
    expect(w.y[3]).toBeCloseTo(715);
  });

  it("keeps everything on the stage over many steps", () => {
    const sim = line(1000, 9);
    for (let k = 0; k < 600; k++) sim.step(1 / 60);
    for (let i = 0; i < sim.world.n; i++) {
      expect(onStage(sim.world, i)).toBe(true);
    }
  });
});

describe("clusters", () => {
  it("is deterministic for the same seed", () => {
    const a = clusters(500, 1);
    const b = clusters(500, 1);
    expect(a.world).toEqual(b.world);
    for (let k = 0; k < 10; k++) {
      a.step(1 / 60);
      b.step(1 / 60);
    }
    expect(a.world).toEqual(b.world);
  });

  it("starts from the same objects as line motion", () => {
    expect(clusters(100, 3).world.x).toEqual(line(100, 3).world.x);
    expect(clusters(100, 3).world.y).toEqual(line(100, 3).world.y);
  });

  it("keeps everything on the stage over many steps", () => {
    const sim = clusters(1000, 9);
    for (let k = 0; k < 600; k++) sim.step(1 / 60);
    for (let i = 0; i < sim.world.n; i++) {
      expect(onStage(sim.world, i)).toBe(true);
    }
  });

  it("gathers into denser clumps than line motion", () => {
    const clustered = clusters(2000, 4);
    const straight = line(2000, 4);
    for (let k = 0; k < 600; k++) {
      clustered.step(1 / 60);
      straight.step(1 / 60);
    }
    expect(peakDensity(clustered.world)).toBeGreaterThan(
      peakDensity(straight.world) * 2,
    );
  });
});
