import type { RendererFactory } from "../utils/types";
import { CIRCLE, STYLE } from "../utils/visual";
import { many, type DotSetup } from "./many";
import { SVG_NS } from "./setup";

// Alternative per-object shapes for svg-many: a `<rect rx>` circle and an
// SVG data-URI image of the same circle.

/** A `<rect>` with `rx = width / 2` is a circle, drawn through the rrect path. */
function rectDot(): SVGGraphicsElement {
  const rect = document.createElementNS(SVG_NS, "rect");
  rect.setAttribute("width", String(CIRCLE.DIAMETER));
  rect.setAttribute("height", String(CIRCLE.DIAMETER));
  rect.setAttribute("rx", String(CIRCLE.RADIUS));
  rect.setAttribute("fill", STYLE.FILL);
  return rect;
}

/** The same circle, pre-rendered as an SVG data URI and blitted as an image. */
const SPRITE = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="${SVG_NS}" width="${CIRCLE.DIAMETER}" height="${CIRCLE.DIAMETER}"><circle cx="${CIRCLE.RADIUS}" cy="${CIRCLE.RADIUS}" r="${CIRCLE.RADIUS}" fill="${STYLE.FILL}"/></svg>`,
)}`;

function imageDot(): SVGGraphicsElement {
  const img = document.createElementNS(SVG_NS, "image");
  img.setAttribute("href", SPRITE);
  img.setAttribute("width", String(CIRCLE.DIAMETER));
  img.setAttribute("height", String(CIRCLE.DIAMETER));
  return img;
}

/** The element's top-left is the circle's centre minus the radius. */
const topLeftPut: DotSetup = dot => {
  if (!(dot instanceof SVGRectElement) && !(dot instanceof SVGImageElement)) {
    throw new Error("svg/rect,image: expected rect or image");
  }
  const x = dot.x.baseVal;
  const y = dot.y.baseVal;
  return (px, py) => {
    x.value = px - CIRCLE.RADIUS;
    y.value = py - CIRCLE.RADIUS;
  };
};

/** A rounded-rect circle per object. */
export const rect = many(topLeftPut, rectDot);

/** A pre-rendered SVG image per object. */
export const image = many(topLeftPut, imageDot);

export const shapeMethods = {
  rect,
  image,
} satisfies Record<string, RendererFactory>;
