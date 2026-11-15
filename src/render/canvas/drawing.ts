import type { RendererFactory } from "../utils/types";
import { CIRCLE } from "../utils/visual";
import { circleTile, method, TAU } from "./setup";

// Methods
// The name is the `?method=` value.

/** One pre-rendered circle blitted with drawImage at whole device pixels. */
export const sprite = method(dpr => {
  const tile = circleTile(Math.round(CIRCLE.DIAMETER * dpr));
  const offset = CIRCLE.RADIUS * dpr;
  return (ctx, w) => {
    const { x, y, n } = w;
    ctx.setTransform(1, 0, 0, 1, 0, 0); // device pixels
    for (let i = 0; i < n; i++) {
      ctx.drawImage(
        tile,
        Math.round(x[i] * dpr - offset),
        Math.round(y[i] * dpr - offset),
      );
    }
  };
});

function patternFor(
  ctx: CanvasRenderingContext2D,
  tile: HTMLCanvasElement,
): CanvasPattern {
  const fill = ctx.createPattern(tile, "no-repeat");
  if (fill === null) throw new Error("pattern unavailable");
  return fill;
}

/** One pattern tile stamped at whole device pixels; one fillRect per circle. */
export const pattern = method(dpr => {
  const size = Math.round(CIRCLE.DIAMETER * dpr);
  const tile = circleTile(size);
  const offset = CIRCLE.RADIUS * dpr;
  let cached: CanvasPattern | undefined;
  return (ctx, w) => {
    const fill = (cached ??= patternFor(ctx, tile));
    const { x, y, n } = w;
    ctx.fillStyle = fill;
    for (let i = 0; i < n; i++) {
      const px = Math.round(x[i] * dpr - offset);
      const py = Math.round(y[i] * dpr - offset);
      ctx.setTransform(1, 0, 0, 1, px, py);
      ctx.fillRect(0, 0, size, size);
    }
  };
});

/** Every circle as an arc of one path at whole-pixel centers; one fill. */
export const path = method(dpr => {
  const r = CIRCLE.RADIUS;
  return (ctx, w) => {
    const { x, y, n } = w;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const px = Math.round(x[i]);
      const py = Math.round(y[i]);
      ctx.moveTo(px + r, py);
      ctx.arc(px, py, r, 0, TAU);
    }
    ctx.fill();
  };
});

/** One path and one fill per circle. */
export const arc = method(dpr => {
  const r = CIRCLE.RADIUS;
  return (ctx, w) => {
    const { x, y, n } = w;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.arc(Math.round(x[i]), Math.round(y[i]), r, 0, TAU);
      ctx.fill();
    }
  };
});

export const drawingMethods = {
  sprite,
  pattern,
  path,
  arc,
} satisfies Record<string, RendererFactory>;
