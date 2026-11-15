import type { RendererFactory } from "../utils/types";
import { CIRCLE } from "../utils/visual";
import { classCss, classDot, globalCss, mountDots, type Setup } from "./setup";

/** One custom property holding both coordinates. */
const XY = "--xy";

/** `@property` registration for the two-length `<length>+` syntax. */
const REGISTER_XY = `@property ${XY}{syntax:"<length>+";inherits:false;initial-value:0px}`;

/**
 * Positions in one custom property, translated by the class. Extra setup (the
 * `@property` rule for `vars-registered`) is passed in by the caller.
 */
export const vars =
  (...setup: Setup[]): RendererFactory =>
  (stage, world) => {
    const dots = mountDots(
      stage,
      world.n,
      classDot,
      classCss(`translate:var(${XY})`),
      ...setup,
    );
    const styles = dots.map(dot => dot.style);
    return {
      render(w) {
        const { x: xs, y: ys, n } = w;
        for (let i = 0; i < n; i++) {
          styles[i].setProperty(
            XY,
            `${Math.round(xs[i]) - CIRCLE.RADIUS}px ${Math.round(ys[i]) - CIRCLE.RADIUS}px`,
          );
        }
      },
    };
  };

export const varsDefault = vars();
export const varsRegistered = vars(globalCss(REGISTER_XY));

export const varsMethods = {
  vars: varsDefault,
  "vars-registered": varsRegistered,
} satisfies Record<string, RendererFactory>;
