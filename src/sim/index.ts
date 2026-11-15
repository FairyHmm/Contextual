import type { Motion } from "../app/params";
import { clusters } from "./clusters";
import { line } from "./line";
import type { SimulationFactory } from "./utils/world";

/** Motion scenarios by name. */
export const IMPLEMENTATIONS: Record<Motion, SimulationFactory> = {
  line,
  clusters,
};

/** The simulation factory for a motion name. */
export function resolveMotion(motion: Motion): SimulationFactory {
  return IMPLEMENTATIONS[motion];
}
