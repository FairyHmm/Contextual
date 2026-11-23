import type { RendererFactory } from "../utils/types";
import { CIRCLE } from "../utils/visual";
import { circlePath, method, TAU } from "./setup";

/** One Path2D built from arcs directly, then one fill. */
export const path2d = method(dpr => {
  const r = CIRCLE.RADIUS;
  return (ctx, w) => {
    const all = new Path2D();
    const { x, y, n } = w;
    for (let i = 0; i < n; i++) {
      const px = Math.round(x[i]);
      const py = Math.round(y[i]);
      all.moveTo(px + r, py);
      all.arc(px, py, r, 0, TAU);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fill(all);
  };
});

/** One cached Path2D circle, moved by the transform; one fill per circle. */
export const path2dStamp = method(dpr => {
  const circle = circlePath();
  return (ctx, w) => {
    const { x, y, n } = w;
    for (let i = 0; i < n; i++) {
      ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        Math.round(x[i]) * dpr,
        Math.round(y[i]) * dpr,
      );
      ctx.fill(circle);
    }
  };
});

/** The cached circle added to one Path2D per frame; one fill. */
export const path2dMerged = method(dpr => {
  const circle = circlePath();
  // addPath copies the matrix synchronously; reuse one object.
  const move = { e: 0, f: 0 };
  return (ctx, w) => {
    const all = new Path2D();
    const { x, y, n } = w;
    for (let i = 0; i < n; i++) {
      move.e = Math.round(x[i]);
      move.f = Math.round(y[i]);
      all.addPath(circle, move);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fill(all);
  };
});

export const path2DMethods = {
  path2d,
  "path2d-stamp": path2dStamp,
  "path2d-merged": path2dMerged,
} satisfies Record<string, RendererFactory>;
