import { parseParams } from "./shared/params";

const params = parseParams(location.search);
const stage = document.getElementById("stage");
if (stage) {
  stage.textContent = `contextual | variant=${params.variant} n=${params.n} seed=${params.seed}`;
}
