import type { RendererFactory } from "../utils/types";
import { circleDot, circleTile, mountSvg, SVG_NS } from "./setup";

// svg-many: one <circle> per object, positioned every frame. Each method changes
// only how the position is written.

/** A position updater for one circle. */
type Put = (px: number, py: number) => void;

/** The per-method setup: build the updater for one element. */
export type DotSetup = (dot: SVGGraphicsElement) => Put;

/** How one element is created before it is positioned. */
type Emitter = () => SVGGraphicsElement;

/** Appends `n` dots made by `create` to `layer` in one fragment. */
function mountDots<T extends SVGGraphicsElement>(
  layer: SVGGElement,
  n: number,
  create: () => T,
): T[] {
  const dots: T[] = [];
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < n; i++) {
    const dot = create();
    dots.push(dot);
    fragment.append(dot);
  }
  layer.append(fragment);
  return dots;
}

/** Mounts the circles once, then uses `setup` to build each updater. */
export function many(
  setup: DotSetup,
  create: Emitter = circleDot,
): RendererFactory {
  return (stage, world) => {
    const { layer } = mountSvg(stage, world);
    const dots = mountDots(layer, world.n, create);
    const puts = dots.map(setup);
    return {
      render(w) {
        const { x, y, n } = w;
        for (let i = 0; i < n; i++) {
          puts[i](Math.round(x[i]), Math.round(y[i]));
        }
      },
    };
  };
}

/** Two property writes: `cx` and `cy` through `SVGAnimatedLength`. */
const cxCyPut: DotSetup = dot => {
  if (!(dot instanceof SVGCircleElement)) {
    throw new Error("svg/cx-cy: not a circle");
  }
  const cx = dot.cx.baseVal;
  const cy = dot.cy.baseVal;
  return (px, py) => {
    cx.value = px;
    cy.value = py;
  };
};

/** One attribute write: the `transform` list. */
const transformPut: DotSetup = dot => (px, py) => {
  dot.setAttribute("transform", `translate(${px},${py})`);
};

export const cxCy = many(cxCyPut);

export const transform = many(transformPut);

/** The transform list through `SVGTransformList`. */
export const transformDom = many(dot => {
  const list = dot.transform.baseVal;
  const svg = dot.ownerSVGElement;
  if (svg === null) throw new Error("svg/transform-dom: no owner svg");
  const entry = svg.createSVGTransform();
  entry.setTranslate(0, 0);
  list.appendItem(entry);
  return (px, py) => {
    entry.matrix.e = px;
    entry.matrix.f = py;
    // Reading the list back marks the transform dirty.
    void list.numberOfItems;
  };
});

/** CSS `translate` on a shared class. */
export const translate: RendererFactory = (stage, world) => {
  const { layer } = mountSvg(stage, world);
  const style = document.createElement("style");
  style.textContent = ".dot{translate:0px 0px}";
  document.head.append(style);
  const dots = mountDots(layer, world.n, () => {
    const dot = circleDot();
    dot.setAttribute("class", "dot");
    return dot;
  });
  return {
    render(w) {
      const { x, y, n } = w;
      for (let i = 0; i < n; i++) {
        dots[i].style.translate = `${Math.round(x[i])}px ${Math.round(y[i])}px`;
      }
    },
  };
};

/** One `<use>` per object, moved by per-instance `x`/`y` lengths. */
export const use: RendererFactory = (stage, world) => {
  const { layer, defs } = mountSvg(stage, world);
  const tile = circleTile(defs);
  const id = `dot-${Math.random().toString(36).slice(2)}`;
  tile.id = id;
  const dots = mountDots(layer, world.n, (): SVGUseElement => {
    const dot = document.createElementNS(SVG_NS, "use");
    dot.setAttribute("href", `#${id}`);
    return dot;
  });
  // A `<use>` box spans x − r … x + r, so the attribute is the centre.
  const xs = dots.map(dot => dot.x.baseVal);
  const ys = dots.map(dot => dot.y.baseVal);
  return {
    render(w) {
      const { x, y, n } = w;
      for (let i = 0; i < n; i++) {
        xs[i].value = Math.round(x[i]);
        ys[i].value = Math.round(y[i]);
      }
    },
  };
};

export const manyMethods = {
  "cx-cy": cxCy,
  transform,
  "transform-dom": transformDom,
  translate,
  use,
} satisfies Record<string, RendererFactory>;
