import type { RendererFactory } from "../utils/types";
import { CIRCLE } from "../utils/visual";
import { classCss, classDot, mountDots } from "./setup";

/** `transform` through CSS Typed OM. */
export const typed: RendererFactory = (stage, world) => {
  if (typeof CSSTransformValue === "undefined") {
    throw new Error("html/typed: CSS Typed OM is not enabled in this browser");
  }
  const dots = mountDots(stage, world.n, classDot, classCss());
  const maps = dots.map(dot => dot.attributeStyleMap);
  const x = CSS.px(0);
  const y = CSS.px(0);
  const value = new CSSTransformValue([new CSSTranslate(x, y)]);
  return {
    render(w) {
      const { x: xs, y: ys, n } = w;
      for (let i = 0; i < n; i++) {
        x.value = Math.round(xs[i]) - CIRCLE.RADIUS;
        y.value = Math.round(ys[i]) - CIRCLE.RADIUS;
        maps[i].set("transform", value);
      }
    },
  };
};
