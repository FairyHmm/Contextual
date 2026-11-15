import type { World } from "../sim/utils/world";
import { whole } from "./utils/types";
import type { RendererFactory, VariantDef } from "./utils/types";
import { STYLE, CIRCLE } from "./utils/visual";

const TAU = Math.PI * 2;

// Shared frame
// `method` builds the canvas and clears it each frame. `Painter` runs once at
// setup and returns the `Paint` that draws the circles.

/** Draws one frame of circles in CSS px on a cleared canvas. */
type Paint = (ctx: CanvasRenderingContext2D, world: World) => void;

/** Setup for one method, given the display's pixel density. */
type Painter = (dpr: number) => Paint;

/**
 * An opaque canvas at the display's pixel density, cleared and painted per
 * frame.
 */
function method(painter: Painter): RendererFactory {
  return (stage, world) => {
    const dpr = window.devicePixelRatio;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(world.width * dpr);
    canvas.height = Math.round(world.height * dpr);
    canvas.style.cssText = `display:block;width:${world.width}px;height:${world.height}px`;
    stage.append(canvas);
    const ctx = canvas.getContext("2d", { alpha: false });
    if (ctx === null) throw new Error("2d context unavailable");
    const paint = painter(dpr);
    return {
      render(w) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = STYLE.BACKGROUND;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = STYLE.FILL;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        paint(ctx, w);
      },
    };
  };
}

/** A small canvas holding one pre-rendered circle. */
function circleTile(size: number): HTMLCanvasElement {
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
function circlePath(): Path2D {
  const circle = new Path2D();
  circle.arc(0, 0, CIRCLE.RADIUS, 0, TAU);
  return circle;
}

// Methods
// The name is the `?method=` value.

/** One pre-rendered circle blitted with drawImage at whole device pixels. */
export const sprite = method(dpr => {
  const tile = circleTile(Math.round(CIRCLE.DIAMETER * dpr));
  const offset = CIRCLE.RADIUS * dpr;
  return (ctx, w) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0); // device pixels
    for (let i = 0; i < w.n; i++) {
      ctx.drawImage(
        tile,
        Math.round(w.x[i] * dpr - offset),
        Math.round(w.y[i] * dpr - offset),
      );
    }
  };
});

/** Every circle as an arc of one path at whole-pixel centers; one fill. */
export const path = method(() => (ctx, w) => {
  ctx.beginPath();
  for (let i = 0; i < w.n; i++) {
    const x = whole(w.x[i]);
    const y = whole(w.y[i]);
    ctx.moveTo(x + CIRCLE.RADIUS, y);
    ctx.arc(x, y, CIRCLE.RADIUS, 0, TAU);
  }
  ctx.fill();
});

/** One path and one fill per circle. */
export const arc = method(() => (ctx, w) => {
  for (let i = 0; i < w.n; i++) {
    ctx.beginPath();
    ctx.arc(whole(w.x[i]), whole(w.y[i]), CIRCLE.RADIUS, 0, TAU);
    ctx.fill();
  }
});

/** One cached Path2D circle, moved by the transform; one fill per circle. */
export const path2dStamp = method(dpr => {
  const circle = circlePath();
  return (ctx, w) => {
    for (let i = 0; i < w.n; i++) {
      ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        whole(w.x[i]) * dpr,
        whole(w.y[i]) * dpr,
      );
      ctx.fill(circle);
    }
  };
});

/** The cached circle added to one Path2D per frame; one fill. */
export const path2dMerged = method(() => {
  const circle = circlePath();
  // addPath copies the matrix synchronously.
  const move = { e: 0, f: 0 };
  return (ctx, w) => {
    const all = new Path2D();
    for (let i = 0; i < w.n; i++) {
      move.e = whole(w.x[i]);
      move.f = whole(w.y[i]);
      all.addPath(circle, move);
    }
    ctx.fill(all);
  };
});

export const config = {
  default: "sprite",
  methods: {
    sprite,
    path,
    arc,
    "path2d-stamp": path2dStamp,
    "path2d-merged": path2dMerged,
  },
} satisfies VariantDef;
