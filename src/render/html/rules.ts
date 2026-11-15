import type { RendererFactory } from "../utils/types";
import { CIRCLE } from "../utils/visual";
import { addStyle, classCss, classDot, mountDots } from "./setup";

/** One stylesheet rule per dot (`.d17{translate:…}`), edited through CSSOM. */
export const rules: RendererFactory = (stage, world) => {
  const dots = mountDots(stage, world.n, classDot, classCss());
  const sheet = addStyle("").sheet;
  if (sheet === null) throw new Error("html/rules: no stylesheet");
  const targets = dots.map((dot, i) => {
    dot.classList.add(`d${i}`);
    sheet.insertRule(`.d${i}{translate:0px 0px}`, i);
    const rule = sheet.cssRules[i];
    if (!(rule instanceof CSSStyleRule))
      throw new Error("html/rules: bad rule");
    return rule.style;
  });
  return {
    render(w) {
      const { x: xs, y: ys, n } = w;
      for (let i = 0; i < n; i++) {
        targets[i].translate =
          `${Math.round(xs[i]) - CIRCLE.RADIUS}px ${Math.round(ys[i]) - CIRCLE.RADIUS}px`;
      }
    },
  };
};
