import type { World } from "../../sim/utils/world";
import { surface } from "../utils/surface";
import type { RendererFactory } from "../utils/types";
import { CIRCLE, STYLE } from "../utils/visual";

export const TAU = Math.PI * 2;

/** Draws one frame of circles in CSS px on a cleared canvas. */
export type Paint = (ctx: CanvasRenderingContext2D, world: World) => void;

/** Setup for one method, given the display's pixel density. */
export type Painter = (dpr: number) => Paint;

/**
 * An opaque canvas at the display's pixel density, cleared and painted per
 * frame.
 */
export function method(painter: Painter, clear = true): RendererFactory {
  return (stage, world) => {
    const { canvas, dpr, width, height } = surface(stage, world);
    const ctx = canvas.getContext("2d", { alpha: false });
    if (ctx === null) throw new Error("2d context unavailable");
    const paint = painter(dpr);
    return {
      render(w) {
        if (clear) {
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.fillStyle = STYLE.BACKGROUND;
          ctx.fillRect(0, 0, width, height);
        }
        ctx.fillStyle = STYLE.FILL;
        paint(ctx, w);
      },
    };
  };
}

/** A small canvas holding one pre-rendered circle. */
export function circleTile(size: number): HTMLCanvasElement {
  const tile = document.createElement("canvas");
  tile.width = size;
  tile.height = size;
  const ctx = tile.getContext("2d");
  if (ctx === null) throw new Error("2d context unavailable");
  ctx.fillStyle = STYLE.FILL;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, TAU);
  ctx.fill();
  return tile;
}

/** A circle centered on the origin, shared by the `path2d-*` methods. */
export function circlePath(): Path2D {
  const circle = new Path2D();
  circle.arc(0, 0, CIRCLE.RADIUS, 0, TAU);
  return circle;
}
