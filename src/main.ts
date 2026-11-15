import { driverFor } from "./app/loop";
import { parseParams } from "./app/params";
import { resolve } from "./render";
import { resolveMotion } from "./sim";

function run(stage: HTMLElement): void {
  const { variant, method, n, seed, freeze, motion } = parseParams(
    location.search,
  );
  const create = resolve(variant, method);
  const sim = resolveMotion(motion)(n, seed);
  driverFor(freeze)(sim, create(stage, sim.world));
}

const stage = document.getElementById("stage");
if (stage === null) throw new Error(`#stage is missing from the page`);
stage.replaceChildren();
try {
  run(stage);
} catch (error) {
  stage.textContent = String(error);
}
