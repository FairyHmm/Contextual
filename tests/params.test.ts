import { describe, expect, it } from "vitest";

import { parseParams } from "../src/app/params";

describe("parseParams", () => {
  it("reads variant, n, seed and method", () => {
    expect(parseParams("?variant=svg-path&n=2000&seed=7&method=arc")).toEqual({
      variant: "svg-path",
      n: 2000,
      seed: 7,
      motion: "line",
      method: "arc",
      freeze: null,
    });
  });

  it("falls back to defaults on bad input", () => {
    expect(parseParams("?variant=nope&n=-3")).toEqual({
      variant: "canvas",
      n: 100,
      seed: 1,
      motion: "line",
      method: null,
      freeze: null,
    });
  });

  it("reads motion", () => {
    expect(parseParams("?motion=clusters").motion).toBe("clusters");
    expect(parseParams("?motion=nope").motion).toBe("line");
  });

  it("reads freeze, including 0", () => {
    expect(parseParams("?freeze=120").freeze).toBe(120);
    expect(parseParams("?freeze=0").freeze).toBe(0);
    expect(parseParams("?freeze=-1").freeze).toBeNull();
    expect(parseParams("?freeze=abc").freeze).toBeNull();
  });
});
