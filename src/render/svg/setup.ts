import type { World } from "../../sim/utils/world";
import { CIRCLE, STYLE } from "../utils/visual";

// SVG helpers shared by both variants: one <svg> with a CSS-px viewBox.

export const SVG_NS = "http://www.w3.org/2000/svg";

export interface Svg {
  svg: SVGSVGElement;
  defs: SVGDefsElement;
  /** Top-level layer that holds the moving content. */
  layer: SVGGElement;
}

/** Creates the stage `<svg>`, its `<defs>`, and a content layer. */
export function svgLayer(width: number, height: number): Svg {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.style.cssText = "display:block";
  const defs = document.createElementNS(SVG_NS, "defs");
  svg.append(defs);
  const layer = document.createElementNS(SVG_NS, "g");
  svg.append(layer);
  return { svg, defs, layer };
}

/** Mounts the `<svg>` on the stage and returns its parts. */
export function mountSvg(stage: HTMLElement, world: World): Svg {
  const svg = svgLayer(world.width, world.height);
  stage.append(svg.svg);
  return svg;
}

/** One `<circle r>` on the origin, parked in `<defs>` for `<use>`. */
export function circleTile(defs: SVGDefsElement): SVGCircleElement {
  const tile = document.createElementNS(SVG_NS, "circle");
  tile.setAttribute("r", String(CIRCLE.RADIUS));
  tile.setAttribute("fill", STYLE.FILL);
  tile.setAttribute("cx", "0");
  tile.setAttribute("cy", "0");
  defs.append(tile);
  return tile;
}

/** One `<circle>` with a fixed radius and fill, ready to be positioned. */
export function circleDot(): SVGCircleElement {
  const dot = document.createElementNS(SVG_NS, "circle");
  dot.setAttribute("r", String(CIRCLE.RADIUS));
  dot.setAttribute("fill", STYLE.FILL);
  return dot;
}

// sweep-flag 1: Canvas `arc()` draws clockwise, which is sweep 1 in SVG's y-down
// coordinate system.
const REL_ARC = `a${CIRCLE.RADIUS} ${CIRCLE.RADIUS} 0 11 ${CIRCLE.DIAMETER} 0a${CIRCLE.RADIUS} ${CIRCLE.RADIUS} 0 11-${CIRCLE.DIAMETER} 0`;
const ABS_ARC = `A${CIRCLE.RADIUS} ${CIRCLE.RADIUS} 0 11 `;

/** Appends a circle centered at `(px, py)` from two absolute `A` segments. */
export function arcParts(parts: string[], px: number, py: number): void {
  parts.push(
    `M${px - CIRCLE.RADIUS} ${py}${ABS_ARC}${px + CIRCLE.RADIUS} ${py}${ABS_ARC}${px - CIRCLE.RADIUS} ${py}`,
  );
}

/** Appends a circle centered at `(px, py)` from a relative `a` tail. */
export function arcRelParts(parts: string[], px: number, py: number): void {
  parts.push(`M${px - CIRCLE.RADIUS} ${py}${REL_ARC}`);
}

/** Appends a near-zero-length dot for one circle: `M x y h.01`. */
export function dotParts(parts: string[], px: number, py: number): void {
  parts.push(`M${px} ${py}h.01`);
}

/** Cubic Bézier circle: four segments; the relative tail is constant. */
const KAPPA = (4 / 3) * (Math.SQRT2 - 1);
const round4 = (v: number): number => Math.round(v * 1e4) / 1e4;
const K = round4(CIRCLE.RADIUS * KAPPA);
const K4R = round4(CIRCLE.RADIUS * KAPPA - CIRCLE.RADIUS);
const CUBIC_REL =
  `m${CIRCLE.RADIUS} 0` +
  `c0 ${K} ${K4R} ${CIRCLE.RADIUS} ${-CIRCLE.RADIUS} ${CIRCLE.RADIUS}` +
  `c${-K} 0 ${-CIRCLE.RADIUS} ${K4R} ${-CIRCLE.RADIUS} ${-CIRCLE.RADIUS}` +
  `c0 ${-K} ${-K4R} ${-CIRCLE.RADIUS} ${CIRCLE.RADIUS} ${-CIRCLE.RADIUS}` +
  `c${K} 0 ${CIRCLE.RADIUS} ${-K4R} ${CIRCLE.RADIUS} ${CIRCLE.RADIUS}z`;

/** Appends a cubic approximation of one circle. */
export function cubicParts(parts: string[], px: number, py: number): void {
  parts.push(`M${px} ${py}${CUBIC_REL}`);
}
