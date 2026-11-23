import { driverFor } from "./app/loop";
import { parseParams } from "./app/params";
import { resolve } from "./render";
import { resolveMotion } from "./sim";

async function run(stage: HTMLElement): Promise<void> {
  const { variant, method, n, seed, freeze, motion } = parseParams(
    location.search,
  );
  const create = resolve(variant, method);
  const sim = resolveMotion(motion)(n, seed);
  const renderer = create(stage, sim.world);
  await renderer.ready;
  await driverFor(freeze)(sim, renderer);
}

const stage = document.getElementById("stage");
if (stage === null) throw new Error(`#stage is missing from the page`);
stage.replaceChildren();
void run(stage).catch((error: unknown) => {
  stage.textContent = String(error);
});
