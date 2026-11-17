import type { RendererFactory } from "../utils/types";
import { CIRCLE, STYLE } from "../utils/visual";
import {
  arcParts,
  arcRelParts,
  cubicParts,
  dotParts,
  mountSvg,
  SVG_NS,
} from "./setup";

// svg-path: one <path> per frame, its `d` string rebuilt from scratch.

/** Number of paths `chunks` splits the circles across. */
const CHUNKS = 8;

/** How a `d` string reaches the path node. */
type DWriter = (node: SVGPathElement, value: string) => void;

const attrD: DWriter = (node, value) => {
  node.setAttribute("d", value);
};

const cssDWrite: DWriter = (node, value) => {
  node.style.d = `path("${value}")`;
};

/** One `<path>` on the content layer. */
function path(layer: SVGGElement): SVGPathElement {
  const node = document.createElementNS(SVG_NS, "path");
  node.setAttribute("fill", STYLE.FILL);
  layer.append(node);
  return node;
}

/** A `<path>` stroked with round caps, for `dots`. */
function dotPath(layer: SVGGElement): SVGPathElement {
  const node = path(layer);
  node.setAttribute("stroke", STYLE.FILL);
  node.setAttribute("stroke-width", String(CIRCLE.DIAMETER));
  node.setAttribute("stroke-linecap", "round");
  return node;
}

/** A `d` writer: the parts array is joined and assigned once per frame. */
function writer(
  setup: (layer: SVGGElement) => SVGPathElement[],
  part: (parts: string[], px: number, py: number) => void,
  write: DWriter = attrD,
): RendererFactory {
  return (stage, world) => {
    const { layer } = mountSvg(stage, world);
    const nodes = setup(layer);
    const buffers: string[][] = nodes.map(() => []);
    const join = nodes.length;
    return {
      render(w) {
        for (const buffer of buffers) buffer.length = 0;
        const { x, y, n } = w;
        for (let i = 0; i < n; i++) {
          part(buffers[i % join], Math.round(x[i]), Math.round(y[i]));
        }
        for (let i = 0; i < nodes.length; i++) {
          write(nodes[i], buffers[i].join(""));
        }
      },
    };
  };
}

const one = (layer: SVGGElement): SVGPathElement[] => [path(layer)];

const dotOne = (layer: SVGGElement): SVGPathElement[] => [dotPath(layer)];

const chunked = (layer: SVGGElement): SVGPathElement[] => {
  const nodes: SVGPathElement[] = [];
  for (let i = 0; i < CHUNKS; i++) nodes.push(path(layer));
  return nodes;
};

/** Absolute arcs, one path. */
export const d = writer(one, arcParts);

/** Relative arcs, one path. */
export const dRel = writer(one, arcRelParts);

/** Cubic Bézier circles, one path. */
export const cubic = writer(one, cubicParts);

/** Relative arcs through the CSS `d` property. */
export const cssDRel = writer(one, arcRelParts, cssDWrite);

/** Near-zero-length subpaths with a round cap, stroked. */
export const dots = writer(dotOne, dotParts);

/** Absolute arcs split over `CHUNKS` paths. */
export const chunks = writer(chunked, arcParts);

export const pathMethods = {
  d,
  "d-rel": dRel,
  dots,
  chunks,
  cubic,
  "css-d-rel": cssDRel,
} satisfies Record<string, RendererFactory>;
