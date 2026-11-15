import type { RendererFactory } from "../utils/types";
import { CIRCLE } from "../utils/visual";
import {
  classCss,
  classDot,
  inlineDot,
  mountDots,
  WRITE,
  type Setup,
  type Writer,
} from "./setup";

/** Moves each dot with `write`, using the supplied mount setup. */
function html(
  write: Writer,
  make: () => HTMLDivElement,
  ...setup: Setup[]
): RendererFactory {
  return (stage, world) => {
    const dots = mountDots(stage, world.n, make, ...setup);
    const styles = dots.map(dot => dot.style);
    return {
      render(w) {
        const { x: xs, y: ys, n } = w;
        for (let i = 0; i < n; i++) {
          write(
            styles[i],
            Math.round(xs[i]) - CIRCLE.RADIUS,
            Math.round(ys[i]) - CIRCLE.RADIUS,
          );
        }
      },
    };
  };
}

/** Class + individual `translate` property, whole pixels. */
export const translate: RendererFactory = (stage, world) => {
  const dots = mountDots(stage, world.n, classDot, classCss());
  const styles = dots.map(dot => dot.style);
  return {
    render(w) {
      const { x: xs, y: ys, n } = w;
      for (let i = 0; i < n; i++) {
        styles[i].translate =
          `${Math.round(xs[i]) - CIRCLE.RADIUS}px ${Math.round(ys[i]) - CIRCLE.RADIUS}px`;
      }
    },
  };
};

/** Class + `transform: translate()`, whole pixels. */
export const transform = html(WRITE.transform, classDot, classCss());

/** Style text on every element + `transform`, whole pixels. */
export const inline = html(WRITE.transform, inlineDot);

/** `transform` with `contain: strict` on the stage. */
export const contain = html(WRITE.transform, classDot, classCss(), stage => {
  stage.style.contain = "strict";
});

/** `transform` with `will-change: transform` on every element. */
export const willChange = html(
  WRITE.transform,
  classDot,
  classCss("will-change:transform"),
);

export const styleMethods = {
  translate,
  transform,
  inline,
  contain,
  "will-change": willChange,
} satisfies Record<string, RendererFactory>;
