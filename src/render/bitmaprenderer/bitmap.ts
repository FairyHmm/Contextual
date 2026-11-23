import type { World } from "../../sim/utils/world";
import { circleTile } from "../canvas2d/setup";
import { surface } from "../utils/surface";
import type { RendererFactory } from "../utils/types";
import { CIRCLE, STYLE } from "../utils/visual";

/** Any 2D context: the offscreen and on-screen sources use the same calls. */
type Painter2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/** The pre-rendered circle and its half-size offset, in device pixels. */
interface Brush {
  tile: HTMLCanvasElement;
  offset: number;
}

/** Clears to the background and blits the circle tile at each dot. */
function paint(
  ctx: Painter2D,
  w: World,
  dpr: number,
  width: number,
  height: number,
  brush: Brush,
): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = STYLE.BACKGROUND;
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < w.n; i++) {
    ctx.drawImage(
      brush.tile,
      Math.round(w.x[i] * dpr - brush.offset),
      Math.round(w.y[i] * dpr - brush.offset),
    );
  }
}

/** The visible bitmaprenderer target plus the shared per-frame constants. */
function target(stage: HTMLElement, world: World) {
  const { canvas, dpr, width, height } = surface(stage, world);
  const ctx = canvas.getContext("bitmaprenderer");
  if (ctx === null) throw new Error("bitmaprenderer context unavailable");
  return {
    ctx,
    dpr,
    width,
    height,
    brush: {
      tile: circleTile(Math.round(CIRCLE.DIAMETER * dpr)),
      offset: CIRCLE.RADIUS * dpr,
    } satisfies Brush,
  };
}

/** Draws to an OffscreenCanvas, then hands each frame over synchronously. */
export const bitmap: RendererFactory = (stage, world) => {
  const { ctx, dpr, width, height, brush } = target(stage, world);
  const source = new OffscreenCanvas(width, height);
  const paint2d = source.getContext("2d", { alpha: false });
  if (paint2d === null) throw new Error("offscreen 2d context unavailable");

  return {
    render(w: World) {
      paint(paint2d, w, dpr, width, height, brush);
      ctx.transferFromImageBitmap(source.transferToImageBitmap());
    },
  };
};

/** Draws to a regular <canvas>, then hands each frame over asynchronously. */
export const canvas: RendererFactory = (stage, world) => {
  const { ctx, dpr, width, height, brush } = target(stage, world);
  const source = document.createElement("canvas");
  source.width = width;
  source.height = height;
  const paint2d = source.getContext("2d", { alpha: false });
  if (paint2d === null) throw new Error("canvas 2d context unavailable");

  return {
    async render(w: World) {
      paint(paint2d, w, dpr, width, height, brush);
      ctx.transferFromImageBitmap(await createImageBitmap(source));
    },
  };
};
