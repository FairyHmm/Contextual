import type { Renderer } from "../render/utils/types";
import type { Simulation } from "../sim/utils/world";

/** Fixed step and maximum live dt, in seconds. */
const DELTA = {
  FIXED: 1 / 60,
  MAX: 0.1,
};

/** Decides how a run advances the scene and when it draws. */
export type Driver = (sim: Simulation, renderer: Renderer) => void;

/** Live driver: dt from the rAF timestamp, capped at DELTA.MAX. */
export const live: Driver = (sim, renderer) => {
  let last: number | null = null;
  const frame = (now: number): void => {
    if (last !== null) sim.step(Math.min((now - last) / 1000, DELTA.MAX));
    last = now;
    renderer.render(sim.world);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
};

/** Frozen: advance a fixed number of steps, draw once, stop. */
export const frozen =
  (steps: number): Driver =>
  (sim, renderer) => {
    for (let k = 0; k < steps; k++) sim.step(DELTA.FIXED);
    renderer.render(sim.world);
  };

/** `?freeze=k` selects the frozen driver; without it the run is live. */
export const driverFor = (freeze: number | null): Driver =>
  freeze === null ? live : frozen(freeze);
