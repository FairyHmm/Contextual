import { CIRCLE, STYLE } from "../utils/visual";

export const BASE = `position:absolute;left:0;top:0;width:${CIRCLE.DIAMETER}px;height:${CIRCLE.DIAMETER}px;border-radius:50%;background-color:${STYLE.FILL};pointer-events:none;user-select:none`;

/** Writes one dot's position into its style. */
export type Writer = (style: CSSStyleDeclaration, x: number, y: number) => void;

export const WRITE = {
  transform: (style, x, y) => {
    style.transform = `translate(${x}px,${y}px)`;
  },
  translate: (style, x, y) => {
    style.translate = `${x}px ${y}px`;
  },
} satisfies Record<string, Writer>;

/** A one-time step run before the dots are appended. */
export type Setup = (stage: HTMLElement) => void;

export function addStyle(css: string): HTMLStyleElement {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.append(style);
  return style;
}

/** Adds the shared `.dot` class rule, with optional extra declarations. */
export const classCss =
  (extraCss = ""): Setup =>
  _stage => {
    addStyle(`.dot{${BASE};${extraCss}}`);
  };

/** Adds extra stylesheet text, outside the shared class. */
export const globalCss =
  (css: string): Setup =>
  _stage => {
    addStyle(css);
  };

/** Creates a dot styled by the shared `.dot` class. */
export function classDot(): HTMLDivElement {
  const dot = document.createElement("div");
  dot.className = "dot";
  return dot;
}

/** Creates a dot carrying the shared style text directly. */
export function inlineDot(): HTMLDivElement {
  const dot = document.createElement("div");
  dot.style.cssText = BASE;
  return dot;
}

/** Runs each setup, then appends `n` dots made by `make` in one fragment. */
export function mountDots(
  stage: HTMLElement,
  n: number,
  make: () => HTMLDivElement,
  ...setup: Setup[]
): HTMLElement[] {
  for (const apply of setup) apply(stage);
  const dots: HTMLElement[] = [];
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < n; i++) {
    const dot = make();
    dots.push(dot);
    fragment.append(dot);
  }
  stage.append(fragment);
  return dots;
}
