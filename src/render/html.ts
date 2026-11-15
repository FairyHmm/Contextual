import { whole } from "./utils/types";
import type { RendererFactory, VariantDef } from "./utils/types";
import { CIRCLE, STYLE } from "./utils/visual";

const BASE = `position:absolute;left:0;top:0;width:${CIRCLE.DIAMETER}px;height:${CIRCLE.DIAMETER}px;border-radius:50%;background:${STYLE.FILL}`;

/** CSS property and value for moving one dot to (x, y). */
const PLACE = {
  transform: (x: number, y: number) => `translate(${x}px,${y}px)`,
  translate: (x: number, y: number) => `${x}px ${y}px`,
};

/** Options for one DOM method. */
interface Options {
  property?: keyof typeof PLACE;
  /** Put the style text on each element rather than a shared class. */
  inline?: boolean;
  /** Extra declarations on the shared class. */
  extraCss?: string;
  /** Extra stylesheet text, outside the shared class. */
  globalCss?: string;
  /** `contain: strict` on the stage. */
  containStage?: boolean;
}

// Shared setup

function addStyle(css: string): HTMLStyleElement {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.append(style);
  return style;
}

/** One styled div per object, appended to the stage. */
function mountDots(
  stage: HTMLElement,
  n: number,
  {
    inline = false,
    extraCss = "",
    globalCss = "",
    containStage = false,
  }: Options = {},
): HTMLElement[] {
  if (containStage) stage.style.contain = "strict";
  if (globalCss) addStyle(globalCss);
  if (!inline) addStyle(`.dot{${BASE};${extraCss}}`);
  const dots = Array.from({ length: n }, () => {
    const dot = document.createElement("div");
    if (inline) dot.style.cssText = BASE;
    else dot.className = "dot";
    return dot;
  });
  stage.append(...dots);
  return dots;
}

// Methods
// The name is the `?method=` value.

/** Moves each dot with the CSS property in `options`. */
function html(options: Options = {}): RendererFactory {
  const { property = "transform" } = options;
  const place = PLACE[property];
  return (stage, world) => {
    const dots = mountDots(stage, world.n, options);
    return {
      render(w) {
        for (let i = 0; i < w.n; i++) {
          const x = whole(w.x[i]) - CIRCLE.RADIUS;
          const y = whole(w.y[i]) - CIRCLE.RADIUS;
          dots[i].style[property] = place(x, y);
        }
      },
    };
  };
}

/** Class + individual `translate` property, whole pixels. */
export const translate = html({ property: "translate" });

/** Class + `transform: translate()`, whole pixels. */
export const transform = html();

/** Style text on every element + `transform`, whole pixels. */
export const inline = html({ inline: true });

/** `transform` with `contain: strict` on the stage. */
export const contain = html({ containStage: true });

/** `transform` with `will-change: transform` on every element. */
export const willChange = html({ extraCss: "will-change:transform" });

/** `transform` through CSS Typed OM. */
export const typed: RendererFactory = (stage, world) => {
  if (typeof CSSTransformValue === "undefined") {
    throw new Error("html/typed: CSS Typed OM is not enabled in this browser");
  }
  const dots = mountDots(stage, world.n);
  const x = CSS.px(0);
  const y = CSS.px(0);
  const value = new CSSTransformValue([new CSSTranslate(x, y)]);
  return {
    render(w) {
      for (let i = 0; i < w.n; i++) {
        x.value = whole(w.x[i]) - CIRCLE.RADIUS;
        y.value = whole(w.y[i]) - CIRCLE.RADIUS;
        dots[i].attributeStyleMap.set("transform", value);
      }
    },
  };
};

/** `@property` rules that give `--x` and `--y` a typed `<length>` syntax. */
const REGISTER_VARS = ["--x", "--y"]
  .map(
    name =>
      `@property ${name}{syntax:"<length>";inherits:false;initial-value:0px}`,
  )
  .join("");

/**
 * Positions in custom properties, translated by the class; `globalCss` adds
 * stylesheet text.
 */
const vars =
  (globalCss = ""): RendererFactory =>
  (stage, world) => {
    const dots = mountDots(stage, world.n, {
      extraCss: "translate:var(--x) var(--y)",
      globalCss,
    });
    return {
      render(w) {
        for (let i = 0; i < w.n; i++) {
          const style = dots[i].style;
          style.setProperty("--x", `${whole(w.x[i]) - CIRCLE.RADIUS}px`);
          style.setProperty("--y", `${whole(w.y[i]) - CIRCLE.RADIUS}px`);
        }
      },
    };
  };

/** One stylesheet rule per dot (`.d17{translate:…}`), edited through CSSOM. */
export const rules: RendererFactory = (stage, world) => {
  const dots = mountDots(stage, world.n);
  const sheet = addStyle("").sheet;
  if (sheet === null) throw new Error("html/rules: no stylesheet");
  const targets = dots.map((dot, i) => {
    dot.classList.add(`d${i}`);
    sheet.insertRule(`.d${i}{translate:0px 0px}`, i);
    const rule = sheet.cssRules[i];
    if (!(rule instanceof CSSStyleRule))
      throw new Error("html/rules: bad rule");
    return rule.style;
  });
  return {
    render(w) {
      for (let i = 0; i < w.n; i++) {
        const x = whole(w.x[i]) - CIRCLE.RADIUS;
        const y = whole(w.y[i]) - CIRCLE.RADIUS;
        targets[i].translate = `${x}px ${y}px`;
      }
    },
  };
};

export const config = {
  default: "translate",
  methods: {
    translate,
    transform,
    inline,
    contain,
    "will-change": willChange,
    typed,
    vars: vars(),
    "vars-registered": vars(REGISTER_VARS),
    rules,
  },
} satisfies VariantDef;
