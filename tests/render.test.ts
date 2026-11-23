import { describe, expect, it } from "vitest";

import type { Variant } from "../src/app/params";
import { IMPLEMENTATIONS } from "../src/render";

// The registry is what the harness reads to decide what exists, so these
// tests pin its shape — including which method each variant runs by default,
// which is a measured choice rather than an arbitrary one.

const VARIANTS: Variant[] = [
  "2d",
  "webgl",
  "webgl2",
  "webgpu",
  "bitmaprenderer",
  "html",
  "svg-many",
  "svg-path",
];

const methods = (variant: Variant): string[] =>
  Object.keys(IMPLEMENTATIONS[variant]?.methods ?? {});

const fallback = (variant: Variant): string | undefined =>
  IMPLEMENTATIONS[variant]?.default;

describe("render registry", () => {
  it("implements every variant", () => {
    for (const variant of VARIANTS) {
      expect(IMPLEMENTATIONS[variant]).toBeDefined();
    }
  });

  it("gives each variant a default that it also implements", () => {
    for (const variant of VARIANTS) {
      const def = IMPLEMENTATIONS[variant];
      expect(def?.default).toBeDefined();
      expect(Object.keys(def?.methods ?? {})).toContain(def?.default);
    }
  });

  it("defaults to the fastest measured method per variant", () => {
    // sprite is the simplest blit; translate the cheapest HTML write;
    // image the fastest svg-many write (cached sprite); d-rel the fastest single path.
    expect(fallback("2d")).toBe("sprite");
    expect(fallback("html")).toBe("translate");
    expect(fallback("svg-many")).toBe("image");
    expect(fallback("svg-path")).toBe("d-rel");
  });

  it("gives svg-many one method per write path", () => {
    expect(methods("svg-many").sort()).toEqual(
      [
        "cx-cy",
        "transform",
        "transform-dom",
        "translate",
        "use",
        "rect",
        "image",
      ].sort(),
    );
  });

  it("gives svg-path one method per path shape", () => {
    expect(methods("svg-path").sort()).toEqual(
      ["chunks", "d", "d-rel", "dots", "cubic", "css-d-rel"].sort(),
    );
  });

  it("keeps every method name kebab-case", () => {
    for (const variant of VARIANTS) {
      for (const name of methods(variant)) {
        expect(name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      }
    }
  });

  it("does not reuse a method name for two different meanings", () => {
    // Names may repeat across variants (translate, transform) — that is what
    // the harness warns about — but a variant must not define one twice.
    for (const variant of VARIANTS) {
      const names = methods(variant);
      expect(new Set(names).size).toBe(names.length);
    }
  });
});
